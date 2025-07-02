// src/controllers/integrationsController.js (VERSÃO CORRETA E UNIFICADA)
const userService = require('../services/userService');
const integrationService = require('../services/integrationConfigService');
const subscriptionService = require('../services/subscriptionService');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const integrationHistoryService = require('../services/integrationHistoryService');
const pedidoService = require('../services/pedidoService');

/**
 * Função 1: Recebe o postback de uma plataforma externa.
 * Agora suporta dois tipos de eventos:
 *  - purchase_approved: cria o contato/pedido sem código de rastreio
 *  - tracking_code_added: atualiza o pedido existente com o código recebido
 */
exports.receberPostback = async (req, res) => {
    console.log('--- WEBHOOK RECEBIDO ---');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('------------------------');

    const db = req.db;
    const payload = req.body;

    const evento = (payload.event || '').toLowerCase();

    const emailClienteFinal = payload?.customer?.email || payload?.buyer?.email;
    const telefoneClienteFinal =
        (payload?.customer?.phone?.ddd || '') + (payload?.customer?.phone?.number || payload?.customer?.phone || '');

    if (!emailClienteFinal && !telefoneClienteFinal) {
        return res.status(400).json({ error: 'Dados de identificação do cliente ausentes no webhook.' });
    }

    try {
        const nossoUsuario = req.user;

        switch (evento) {
            case 'purchase_approved':
            case 'venda_aprovada': {
                if (!telefoneClienteFinal) {
                    return res.status(400).json({ error: 'Telefone do cliente não encontrado no webhook.' });
                }

                const nomeCliente = payload?.customer?.name || payload?.buyer?.name || 'Cliente';
                const produto = payload?.product?.name || payload?.product_name || '';

                const existente = await pedidoService.findPedidoByTelefone(db, telefoneClienteFinal, nossoUsuario.id);
                if (!existente) {
                    await pedidoService.criarPedido(
                        db,
                        { nome: nomeCliente, telefone: telefoneClienteFinal, produto },
                        req.venomClient,
                        nossoUsuario.id
                    );
                    console.log(`Pedido criado para ${telefoneClienteFinal}`);
                } else {
                    console.log(`Pedido já existente para ${telefoneClienteFinal}`);
                }
                break;
            }

            case 'tracking_code_added':
            case 'codigo_rastreio_adicionado': {
                const codigoRastreio = payload.tracking_code || payload.codigoRastreio || payload.codigo_rastreio;
                if (!codigoRastreio) {
                    return res.status(400).json({ error: 'Código de rastreio não encontrado no webhook.' });
                }

                if (!telefoneClienteFinal) {
                    return res.status(400).json({ error: 'Telefone do cliente não encontrado no webhook.' });
                }

                const pedido = await pedidoService.findPedidoByTelefone(db, telefoneClienteFinal, nossoUsuario.id);

                if (pedido) {
                    const sub = await subscriptionService.getUserSubscription(db, nossoUsuario.id);
                    if (sub && sub.monthly_limit !== -1 && sub.usage >= sub.monthly_limit) {
                        return res.status(403).json({ error: 'Limite do plano excedido.' });
                    }

                    await pedidoService.updateCamposPedido(db, pedido.id, { codigoRastreio }, nossoUsuario.id);
                    if (sub) await subscriptionService.incrementUsage(db, sub.id);

                    console.log(`Código ${codigoRastreio} adicionado ao pedido ${pedido.id}`);
                } else {
                    return res.status(404).json({ error: 'Pedido não encontrado para o cliente informado.' });
                }
                break;
            }

            default:
                console.log(`Evento '${evento}' recebido, mas nenhuma ação configurada.`);
        }

        res.status(200).json({ message: 'Webhook processado.' });
    } catch (error) {
        console.error('Erro ao processar webhook genérico:', error);
        res.status(500).json({ error: 'Erro interno ao processar webhook.' });
    }
};

/**
 * Função 2: Envia as informações necessárias para a página de integração.
 */
exports.getIntegrationInfo = async (req, res) => {
    try {
        const user = await userService.findUserById(req.db, req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        const settings = await integrationService.getConfig(req.db, req.user.id);
        res.status(200).json({ apiKey: user.api_key, settings });
    } catch (err) {
        res.status(500).json({ error: 'Falha ao obter chave' });
    }
};

/**
 * Função 3: Regenera a chave de API para o link de postback.
 */
exports.regenerateApiKey = async (req, res) => {
    try {
        const novaChave = await userService.regenerateApiKey(req.db, req.user.id);
        console.log(`[Integração] Nova chave de API gerada: ${novaChave}`);
        res.status(200).json({ message: 'Nova chave de API gerada com sucesso!', newApiKey: novaChave });
    } catch (err) {
        res.status(500).json({ error: 'Falha ao gerar chave' });
    }
};

exports.updateIntegrationSettings = async (req, res) => {
    try {
        await integrationService.updateConfig(req.db, req.user.id, req.body);
        const settings = await integrationService.getConfig(req.db, req.user.id);
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
