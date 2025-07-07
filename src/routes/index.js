const express = require('express');
const path = require('path');

const reportsController = require('../controllers/reportsController');
const pedidosController = require('../controllers/pedidosController');
const automationsController = require('../controllers/automationsController');
const integrationsController = require('../controllers/integrationsController');
const logsController = require('../controllers/logsController');
const paymentController = require('../controllers/paymentController');
const webhookRastreioController = require('../controllers/webhookRastreioController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const settingsController = require('../controllers/settingsController');
const subscriptionService = require('../services/subscriptionService');
const userController = require('../controllers/userController');

const authMiddleware = require('../middleware/auth');
const planCheck = require('../middleware/planCheck');
const adminCheck = require('../middleware/adminCheck');

module.exports = function setupRoutes(app, db, sessionManager) {
  const {
    activeSessions,
    connectToWhatsApp,
    disconnectFromWhatsApp,
    getStatus,
    getQrCode,
    getBotInfo,
    broadcast,
  } = sessionManager;

  // Webhook precisa do corpo raw para validação
  app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.handleWebhook
  );

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Rotas públicas de autenticação
  app.post('/api/register', authController.register);
  app.post('/api/login', authController.login);

  // Postback dinâmico por caminho único
  app.post('/api/postback/:unique_path', integrationsController.receberPostback);

  // Rota da página de administração (verificação feita no frontend)
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'admin.html'));
  });

  // ROTA DE TESTE PÚBLICA PARA DIAGNÓSTICO
  app.get('/api/teste-conexao', (req, res) => {
    console.log('✅ SUCESSO! A rota de teste foi acessada!');
    res
      .status(200)
      .json({ message: 'Se voce esta vendo isso, a conexao com o servidor Node.js esta funcionando.' });
  });

  // Middleware de autenticação para rotas abaixo
  app.use(authMiddleware);
  app.use((req, res, next) => {
    req.venomClient = activeSessions.get(req.user.id) || null;
    req.broadcast = (data) => broadcast(req.user.id, data);
    next();
  });

  // Rotas administrativas protegidas
  app.get('/api/admin/clients', adminCheck, adminController.listClients);
  app.post('/api/admin/clients', adminCheck, adminController.createClient);
  app.put('/api/admin/clients/:id', adminCheck, adminController.updateClient);
  app.put('/api/admin/clients/:id/active', adminCheck, adminController.toggleActive);
  app.get('/api/admin/stats', adminCheck, adminController.getStats);

  // Detalhes da assinatura do usuário logado
  app.get('/api/subscription', async (req, res) => {
    try {
      let sub = await subscriptionService.getUserSubscription(req.db, req.user.id);
      if (!sub) return res.status(404).json({ error: 'Nenhum plano encontrado' });
      await subscriptionService.resetUsageIfNeeded(req.db, sub.id);
      sub = await subscriptionService.getUserSubscription(req.db, req.user.id);
      res.json({ subscription: sub });
    } catch (err) {
      console.error('Erro ao obter assinatura:', err);
      res.status(500).json({ error: 'Falha ao consultar assinatura' });
    }
  });

  // Rotas de planos (seleção e gestão)
  app.get('/api/plans', (req, res) => {
    req.db.all('SELECT * FROM plans ORDER BY price', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows });
    });
  });
  app.post('/api/subscribe/:planId', async (req, res) => {
    const userId = req.user.id;
    const planId = parseInt(req.params.planId);
    try {
      await subscriptionService.updateUserPlan(req.db, userId, planId);
      res.json({ message: 'Plano contratado com sucesso' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log('✔️ Registrando rotas da API...');

  // Rotas de Pedidos
  app.get('/api/pedidos', planCheck, pedidosController.listarPedidos);
  app.post('/api/pedidos', planCheck, pedidosController.criarPedido);
  app.post('/api/pedidos/importar', planCheck, pedidosController.importarPedidos);
  app.put('/api/pedidos/:id', planCheck, pedidosController.atualizarPedido);
  app.delete('/api/pedidos/:id', planCheck, pedidosController.deletarPedido);
  app.get('/api/pedidos/:id/historico', planCheck, pedidosController.getHistoricoDoPedido);
  app.post('/api/pedidos/:id/enviar-mensagem', planCheck, pedidosController.enviarMensagemManual);
  app.post('/api/pedidos/:id/atualizar-foto', planCheck, pedidosController.atualizarFotoDoPedido);
  app.put('/api/pedidos/:id/marcar-como-lido', planCheck, pedidosController.marcarComoLido);

  // Rotas de SITE RASTREIO
  app.post('/api/webhook-site-rastreio', webhookRastreioController.receberWebhook);
  // Rotas de Automações
  app.get('/api/automations', planCheck, automationsController.listarAutomacoes);
  app.post('/api/automations', planCheck, automationsController.salvarAutomacoes);

  // Rotas de Relatórios
  app.get('/api/reports/summary', planCheck, reportsController.getReportSummary);
  app.get('/api/billing/history', planCheck, reportsController.getBillingHistory);

  // Rotas de Logs
  app.get('/api/logs', planCheck, logsController.listarLogs);

  // Rotas de Integrações (UNIFICADAS)
  app.get('/api/integrations', integrationsController.listarIntegracoes);
  app.get('/api/integrations/info', planCheck, integrationsController.getIntegrationInfo);
  app.post('/api/integrations', planCheck, integrationsController.criarIntegracao);
  app.put('/api/integrations/:id', planCheck, integrationsController.atualizarIntegracao);
  app.delete('/api/integrations/:id', integrationsController.deletarIntegracao);
  app.post('/api/integrations/regenerate', planCheck, integrationsController.regenerateApiKey);
  app.put('/api/integrations/settings', planCheck, integrationsController.updateIntegrationSettings);
  app.get('/api/integrations/history', planCheck, integrationsController.listarHistorico);

  // Rotas de Configurações de Usuário
  app.get('/api/settings/contact-creation', planCheck, settingsController.getContactCreationSetting);
  app.put('/api/settings/contact-creation', planCheck, settingsController.updateContactCreationSetting);

  // Conta do usuário
  app.delete('/api/users/me', userController.deleteMe);
  app.put('/api/users/me/password', userController.updatePassword);

  // Rotas do WhatsApp
  app.get('/api/whatsapp/status', (req, res) =>
    res.json({ status: getStatus(req.user.id), qrCode: getQrCode(req.user.id), botInfo: getBotInfo(req.user.id) })
  );
  app.post('/api/whatsapp/connect', planCheck, (req, res) => {
    connectToWhatsApp(req.user.id);
    res.status(202).json({ message: 'Processo de conexão iniciado.' });
  });
  app.post('/api/whatsapp/disconnect', planCheck, async (req, res) => {
    await disconnectFromWhatsApp(req.user.id);
    res.status(200).json({ message: 'Desconectado com sucesso.' });
  });
};
