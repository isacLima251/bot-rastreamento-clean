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
 */
exports.receberPostback = async (req, res) => {
    // LOG PARA DEPURAÇÃO COMPLETA
    console.log('--- WEBHOOK RECEBIDO ---');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('------------------------');

    const db = req.db;
    const payload = req.body;

    // Validação do token (se aplicável)
    const tictoToken = payload.token;
    if (tictoToken && tictoToken !== process.env.TICTO_SECRET) {
        return res.status(401).json({ error: 'Token do webhook inválido.' });
    }

    const email = payload?.customer?.email;
    const status = (payload.status || '').toLowerCase();

    if (!email) {
        return res.status(400).json({ error: 'Email do cliente não encontrado no webhook.' });
    }

    try {
        const user = await userService.findUserByEmail(db, email);

        // --- LÓGICA PARA VENDA APROVADA ---
        if (status === 'paid' || status === 'approved') {
            const planId = payload?.order?.product_id;
            if (!planId) return res.status(400).json({ error: 'ID do produto não encontrado para venda aprovada.' });

            if (user) { // Usuário já existe, faz upgrade
                await subscriptionService.updateUserPlan(db, user.id, planId);
            } else { // Novo usuário
                const generatedPassword = require('crypto').randomBytes(8).toString('hex');
                const newUser = await userService.createUser(db, email, generatedPassword);
                await subscriptionService.updateUserPlan(db, newUser.id, planId);
                await emailService.sendWelcomeEmail(email, generatedPassword);
            }
            return res.status(200).json({ message: 'Venda processada com sucesso.' });
        }

        // --- NOVA LÓGICA PARA CANCELAMENTO/REEMBOLSO ---
        if (status === 'refunded' || status === 'chargeback' || status === 'cancelled') {
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado para processar o cancelamento.' });
            }

            const sub = await subscriptionService.getUserSubscription(db, user.id);
            if (sub) {
                // Devolve 1 uso ao limite do plano
                await subscriptionService.decrementUsage(db, sub.id);
                console.log(`[Reembolso] 1 uso devolvido para o usuário ${user.email} (ID: ${user.id})`);

                // Opcional mas recomendado: Tenta encontrar e marcar o pedido como cancelado
                const telefoneCliente = (payload?.customer?.phone?.ddd || '') + (payload?.customer?.phone?.number || '');
                if (telefoneCliente) {
                    const pedido = await pedidoService.findPedidoByTelefone(db, telefoneCliente, user.id);
                    if (pedido) {
                        await pedidoService.updateCamposPedido(db, pedido.id, { statusInterno: 'pedido_cancelado' });
                    }
                }
            }
            return res.status(200).json({ message: 'Cancelamento processado e limite devolvido.' });
        }

        // Se o status não for nenhum dos acima, apenas ignoramos
        return res.status(200).json({ message: 'Evento recebido, mas nenhuma ação necessária.' });

    } catch (error) {
        console.error('Erro ao processar postback:', error);
        res.status(500).json({ error: 'Erro interno ao processar postback.' });
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
