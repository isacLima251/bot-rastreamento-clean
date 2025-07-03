const userService = require('../services/userService');
const integrationConfigService = require('../services/integrationConfigService');
const integrationService = require('../services/integrationService');
const subscriptionService = require('../services/subscriptionService');
const integrationHistoryService = require('../services/integrationHistoryService');
const pedidoService = require('../services/pedidoService');
const mappers = require('../services/platformMappers');
const crypto = require('crypto');

exports.receberPostback = async (req, res) => {
    const { unique_path } = req.params;
    const payload = req.body;

    try {
        const integracao = await integrationService.findIntegrationByPath(req.db, unique_path);
        if (!integracao) return res.status(404).json({ error: 'Integração não encontrada.' });

        const mapper = mappers[integracao.platform] || mappers.generico;
        if (!mapper) return res.status(400).json({ error: 'Plataforma não suportada.' });
        const dados = mapper(payload);
        console.log('DADOS TRADUZIDOS:', dados);

        const user = { id: integracao.user_id };
        const sub = await subscriptionService.getUserSubscription(req.db, user.id);

        switch (dados.eventType) {
            case 'VENDA_APROVADA':
                console.log('PROCESSANDO VENDA APROVADA...');
                if (dados.clientName && dados.clientPhone) {
                    await pedidoService.criarPedido(
                        req.db,
                        { nome: dados.clientName, telefone: dados.clientPhone, email: dados.clientEmail, produto: dados.productName },
                        req.venomClient,
                        user.id
                    );
                    console.log(`Contato para ${dados.clientName} criado com sucesso.`);
                } else {
                    console.error('Dados insuficientes para criar contato no evento de venda aprovada.');
                }
                break;
            case 'PEDIDO_AGENDADO':
                await pedidoService.criarPedido(
                    req.db,
                    { nome: dados.clientName, telefone: dados.clientPhone, email: dados.clientEmail, produto: dados.productName },
                    req.venomClient,
                    user.id
                );
                break;
            case 'RASTREIO_ADICIONADO':
                if (sub && sub.monthly_limit !== -1 && sub.usage >= sub.monthly_limit) {
                    return res.status(403).json({ error: 'Limite do plano excedido.' });
                }
                console.log(`Processando rastreio para: ${dados.clientEmail}`);
                const pedido = await pedidoService.findPedidoByEmail(req.db, dados.clientEmail, user.id);

                if (pedido) {
                    await pedidoService.updateCamposPedido(req.db, pedido.id, { codigoRastreio: dados.trackingCode }, user.id);
                    if (sub) await subscriptionService.incrementUsage(req.db, sub.id);
                    console.log(`Código de rastreio ${dados.trackingCode} adicionado ao pedido ${pedido.id}.`);
                } else {
                    console.warn(`Nenhum pedido encontrado para o email ${dados.clientEmail} para o usuário ${user.id}`);
                }
                break;
            case 'VENDA_CANCELADA':
                if (sub) await subscriptionService.decrementUsage(req.db, sub.id);
                break;
        }
        res.status(200).json({ message: 'Webhook processado.' });
    } catch (error) {
        console.error('Erro ao processar postback:', error);
        res.status(500).json({ error: 'Erro interno.' });
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
