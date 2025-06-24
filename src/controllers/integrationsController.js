// src/controllers/integrationsController.js (VERSÃO CORRETA E UNIFICADA)
const pedidoService = require('../services/pedidoService');
const userService = require('../services/userService');

// Num sistema SaaS, esta chave viria do banco de dados de um utilizador específico.
// Aqui é lida de uma variável de ambiente para facilitar a configuração
const CHAVE_SECRETA_DA_PLATAFORMA = process.env.BRAIP_SECRET || '';

/**
 * Função 1: Recebe o postback de uma plataforma externa.
 */
exports.receberPostback = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    
    const { 
        basic_authentication,
        client_name,
        client_cell,
        product_name
    } = req.body;

    if (basic_authentication !== CHAVE_SECRETA_DA_PLATAFORMA) {
        console.warn(`[Integração] Recebida requisição com chave de autenticação inválida.`);
        return res.status(401).json({ error: "Chave de autenticação inválida." });
    }

    if (!client_name || !client_cell) {
        console.warn('⚠️ [Integração] Recebida requisição sem nome ou celular do cliente.');
        return res.status(400).json({ error: "Dados insuficientes." });
    }

    console.log(`✨ [Integração] Recebido novo pedido: ${client_name}, Produto: ${product_name || 'Não informado'}`);

    try {
        const novoPedido = { nome: client_name, telefone: client_cell, produto: product_name };
        const pedidoCriado = await pedidoService.criarPedido(db, novoPedido, req.venomClient, clienteId);
        
        req.broadcast({ type: 'novo_contato', pedido: pedidoCriado });
        res.status(201).json({ message: "Pedido recebido e criado com sucesso!", data: pedidoCriado });

    } catch (error) {
        if (error.message && error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
            return res.status(409).json({ error: `O telefone '${client_cell}' já está cadastrado.` });
        }
        console.error('❌ [Integração] Erro ao salvar pedido:', error.message);
        return res.status(500).json({ error: "Erro interno ao processar o pedido." });
    }
};

/**
 * Função 2: Envia as informações necessárias para a página de integração.
 */
exports.getIntegrationInfo = async (req, res) => {
    try {
        const user = await userService.findUserById(req.db, req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.status(200).json({ apiKey: user.api_key });
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