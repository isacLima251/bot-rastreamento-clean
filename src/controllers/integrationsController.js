const userService = require('../services/userService');
const integrationConfigService = require('../services/integrationConfigService');
const integrationService = require('../services/integrationService');
const subscriptionService = require('../services/subscriptionService');
const integrationHistoryService = require('../services/integrationHistoryService');
const pedidoService = require('../services/pedidoService');
const crypto = require('crypto');

// Dicionário de tradutores para cada plataforma
const platformMappers = {
    braip: (payload) => {
        let eventType = 'UNKNOWN';
        if (payload.type === 'TRACKING_CODE_ADDED') {
            eventType = 'RASTREIO_ADICIONADO';
        } else if (payload.trans_status === 'Pagamento Aprovado' || payload.trans_status === 'Agendado') {
            eventType = 'VENDA_APROVADA';
        } else if (['Cancelada', 'Chargeback', 'Devolvida'].includes(payload.trans_status)) {
            eventType = 'VENDA_CANCELADA';
        }

        return {
            eventType,
            clientEmail: payload.client_email,
            clientName: payload.client_name,
            clientPhone: payload.client_cel,
            productName: payload.product_name,
            trackingCode: payload.tracking_code,
            transactionId: payload.trans_key // ID único da transação
        };
    },
    // ... adicione aqui os mappers para Kiwify, Hotmart, etc.
};

exports.receberPostback = async (req, res) => {
    const { unique_path } = req.params;
    const payload = req.body;

    try {
        // Passo 1: Encontrar qual integração (e qual usuário) está a receber o webhook
        // Esta função precisa de ser criada no seu integrationService
        // const integracao = await integrationService.findIntegrationByPath(req.db, unique_path);
        // if (!integracao) {
        //     console.warn(`Webhook recebido para um caminho desconhecido: ${unique_path}`);
        //     return res.status(404).json({ error: 'Integração não encontrada.' });
        // }

        // **Para o teste, vamos assumir que encontramos o usuário logado e a plataforma Braip**
        const nossoUsuarioId = req.user.id;
        const platform = 'braip'; // Exemplo, viria de integracao.platform

        const mapper = platformMappers[platform];
        if (!mapper) {
            return res.status(400).json({ error: "Plataforma não suportada." });
        }

        // Passo 2: Traduzir os dados da plataforma para o nosso formato padrão
        const dados = mapper(payload);
        console.log(`[Webhook] Evento '${dados.eventType}' recebido para ${dados.clientEmail}`);

        switch (dados.eventType) {
            case 'VENDA_APROVADA': {
                if (!dados.clientName || !dados.clientPhone || !dados.clientEmail) {
                    return res.status(400).json({ error: "Dados do cliente insuficientes para criar o pedido." });
                }

                const pedidoExistente = await pedidoService.findPedidoByEmail(req.db, dados.clientEmail, nossoUsuarioId);
                if (pedidoExistente) {
                    console.log(`[Webhook] Pedido para o email ${dados.clientEmail} já existe. Ignorando criação.`);
                    break;
                }

                await pedidoService.criarPedido(req.db, {
                    nome: dados.clientName,
                    telefone: dados.clientPhone,
                    email: dados.clientEmail,
                    produto: dados.productName,
                }, req.venomClient, nossoUsuarioId);

                console.log(`[Webhook] Contato para ${dados.clientName} criado com sucesso.`);
                break;
            }

            case 'RASTREIO_ADICIONADO': {
                if (!dados.clientEmail || !dados.trackingCode) {
                    return res.status(400).json({ error: "Email ou código de rastreio em falta." });
                }

                const pedido = await pedidoService.findPedidoByEmail(req.db, dados.clientEmail, nossoUsuarioId);
                if (!pedido) {
                    console.warn(`[Webhook] Nenhum pedido encontrado para o email ${dados.clientEmail} no evento de rastreio.`);
                    return res.status(404).json({ error: 'Pedido original não encontrado.' });
                }
                if (pedido.codigoRastreio) {
                    console.log(`[Webhook] Pedido ${pedido.id} já possui código de rastreio. Nenhuma ação necessária.`);
                    break;
                }

                const sub = await subscriptionService.getUserSubscription(req.db, nossoUsuarioId);
                if (sub.monthly_limit !== -1 && sub.usage >= sub.monthly_limit) {
                    console.warn(`[Webhook] Limite do plano excedido para usuário ${nossoUsuarioId}.`);
                    return res.status(403).json({ error: 'Limite do plano excedido.' });
                }

                await pedidoService.updateCamposPedido(req.db, pedido.id, { codigoRastreio: dados.trackingCode });
                await subscriptionService.incrementUsage(req.db, sub.id);
                req.broadcast({ type: 'pedido_atualizado', pedidoId: pedido.id });

                console.log(`[Webhook] Código de rastreio ${dados.trackingCode} adicionado ao pedido ${pedido.id}.`);
                break;
            }

            case 'VENDA_CANCELADA': {
                // Lógica para devolver crédito
                const sub = await subscriptionService.getUserSubscription(req.db, nossoUsuarioId);
                if (sub) {
                    await subscriptionService.decrementUsage(req.db, sub.id);
                    console.log(`[Webhook] Crédito devolvido para usuário ${nossoUsuarioId} devido a cancelamento.`);
                }
                break;
            }

            default:
                console.log(`[Webhook] Evento '${dados.eventType}' recebido, mas nenhuma ação foi configurada.`);
        }

        res.status(200).json({ message: 'Webhook processado.' });

    } catch (error) {
        console.error('[Webhook] ERRO CRÍTICO:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.getIntegrationInfo = async (req, res) => {
    try {
        const user = await userService.findUserById(req.db, req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        const settings = await integrationConfigService.getConfig(req.db, req.user.id);
        res.status(200).json({ apiKey: user.api_key, settings });
    } catch (err) {
        res.status(500).json({ error: 'Falha ao obter chave' });
    }
};

exports.regenerateApiKey = async (req, res) => {
    try {
        const novaChave = await userService.regenerateApiKey(req.db, req.user.id);
        res.status(200).json({ message: 'Nova chave de API gerada com sucesso!', newApiKey: novaChave });
    } catch (err) {
        res.status(500).json({ error: 'Falha ao gerar chave' });
    }
};

exports.criarIntegracao = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { platform, name } = req.body;

    if (!platform || !name) {
        return res.status(400).json({ error: 'Nome e plataforma são obrigatórios.' });
    }

    try {
        const uniquePath = crypto.randomBytes(16).toString('hex');

        const sql = 'INSERT INTO integrations (user_id, platform, name, unique_path) VALUES (?, ?, ?, ?)';
        const newIntegrationId = await new Promise((resolve, reject) => {
            db.run(sql, [clienteId, platform, name, uniquePath], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });

        const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
        const webhookUrl = `${baseUrl}/api/postback/${uniquePath}`;

        res.status(201).json({
            id: newIntegrationId,
            platform,
            name,
            webhook_url: webhookUrl
        });
    } catch (error) {
        console.error('Erro ao criar integração:', error);
        res.status(500).json({ error: 'Falha ao criar a integração.' });
    }
};

exports.atualizarIntegracao = async (req, res) => {
    const { id } = req.params;
    const clienteId = req.user.id;
    const { name, secret_key } = req.body;
    try {
        const result = await integrationService.updateIntegration(
            req.db,
            id,
            { name, secret_key },
            clienteId
        );
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Integração não encontrada.' });
        }
        res.status(200).json({ message: 'Integração atualizada com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar integração', err);
        res.status(500).json({ error: 'Falha ao atualizar integração' });
    }
};

exports.deletarIntegracao = async (req, res) => {
    const { id } = req.params;
    const clienteId = req.user.id;
    try {
        const result = await integrationService.deleteIntegration(req.db, id, clienteId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Integração não encontrada.' });
        }
        res.status(200).json({ message: 'Integração excluída com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir integração', err);
        res.status(500).json({ error: 'Falha ao excluir integração' });
    }
};

exports.listarIntegracoes = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    try {
        db.all('SELECT * FROM integrations WHERE user_id = ? ORDER BY id DESC', [clienteId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Falha ao buscar integrações." });
            }
            const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
            const data = rows.map(row => ({
                ...row,
                webhook_url: `${baseUrl}/api/postback/${row.unique_path}`
            }));
            res.status(200).json({ data });
        });
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor." });
    }
};

exports.updateIntegrationSettings = async (req, res) => {
    try {
        await integrationConfigService.updateConfig(req.db, req.user.id, req.body);
        const settings = await integrationConfigService.getConfig(req.db, req.user.id);
        res.status(200).json({ message: 'Configurações atualizadas', settings });
    } catch (err) {
        console.error('Erro ao atualizar configurações', err);
        res.status(500).json({ error: 'Falha ao atualizar configurações' });
    }
};

exports.listarHistorico = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        const [registros, total] = await Promise.all([
            integrationHistoryService.getPaginated(req.db, userId, limit, offset),
            integrationHistoryService.countAll(req.db, userId)
        ]);

        res.json({ data: registros, total });
    } catch (err) {
        console.error('Erro ao listar histórico de integrações', err);
        res.status(500).json({ error: 'Falha ao buscar histórico de integrações' });
    }
};
