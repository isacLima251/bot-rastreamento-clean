// src/controllers/integrationsController.js (VERSÃO CORRETA E UNIFICADA)
const userService = require('../services/userService');
const integrationService = require('../services/integrationConfigService');
const subscriptionService = require('../services/subscriptionService');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const integrationHistoryService = require('../services/integrationHistoryService');

/**
 * Função 1: Recebe o postback de uma plataforma externa.
 */
exports.receberPostback = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;

    const payload = req.body;
    const tictoToken = req.headers['x-ticto-token'];
    const email = payload.customer_email || payload.email;
    const planId = payload.product_id || payload.plan_id;
    const status = (payload.transaction_status || payload.status || '').toLowerCase();
    const clientName = payload.client_name || payload.customer_name || '';
    const clientCell = payload.client_cell || payload.customer_phone || '';

    const config = await integrationService.getConfig(db, clienteId);
    const secret = (config && config.postback_secret) || process.env.TICTO_SECRET || '';

    if (tictoToken !== secret) {
        console.warn(`[Integração] Recebida requisição com token inválido.`);
        return res.status(401).json({ error: 'Token inválido' });
    }

    if (!email || !planId || status !== 'approved') {
        return res.status(400).json({ error: 'Dados insuficientes ou status inválido.' });
    }

    try {
        let user = await userService.findUserByEmail(db, email);
        const generatedPassword = crypto.randomBytes(8).toString('hex');

        if (user) {
            await subscriptionService.updateUserPlan(db, user.id, planId);
        } else {
            user = await userService.createUser(db, email, generatedPassword);
            await subscriptionService.updateUserPlan(db, user.id, planId);
            await emailService.sendWelcomeEmail(email, generatedPassword);
        }

        await integrationHistoryService.addEntry(db, clienteId, clientName, clientCell, String(planId), status);

        res.status(200).json({ message: 'Postback processado com sucesso' });
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
