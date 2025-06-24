// server.js (VERSÃO FINAL E OTIMIZADA)
require('dotenv').config();
const express = require('express');
const venom = require('venom-bot');
const http = require('http');
const { WebSocketServer } = require('ws');
const { initDb } = require('./src/database/database.js');

// --- Importações dos controllers e serviços ---
const reportsController = require('./src/controllers/reportsController');
const pedidosController = require('./src/controllers/pedidosController');
const envioController = require('./src/controllers/envioController');
const rastreamentoController = require('./src/controllers/rastreamentoController');
const automationsController = require('./src/controllers/automationsController');
const integrationsController = require('./src/controllers/integrationsController'); // Apenas um import para integrações
const logsController = require('./src/controllers/logsController');
const whatsappService = require('./src/services/whatsappService');
const pedidoService = require('./src/services/pedidoService');
const paymentController = require('./src/controllers/paymentController');
const webhookRastreioController = require('./src/controllers/webhookRastreioController');
const authController = require('./src/controllers/authController');
const adminController = require('./src/controllers/adminController');
const authMiddleware = require('./src/middleware/auth');
const apiKeyMiddleware = require('./src/middleware/apiKey');
const planCheck = require('./src/middleware/planCheck');
const adminCheck = require('./src/middleware/adminCheck');


// --- GERENCIAMENTO DE ESTADO ---
let whatsappStatus = 'DISCONNECTED';
let qrCodeData = null;
let venomClient = null;
let botInfo = null;

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set();

// --- Funções de Broadcast e WebSocket ---
function broadcast(data) {
    const jsonData = JSON.stringify(data);
    console.log(`[WebSocket] A transmitir: ${jsonData}`);
    for (const client of clients) {
        if (client.readyState === client.OPEN) {
            client.send(jsonData);
        }
    }
}

function broadcastStatus(newStatus, data = {}) {
    whatsappStatus = newStatus;
    qrCodeData = data.qrCode || null;
    console.log(`Status do WhatsApp alterado para: ${newStatus}`);
    broadcast({ type: 'status_update', status: newStatus, ...data });
}

wss.on('connection', (ws) => {
    console.log('🔗 Novo painel conectado via WebSocket.');
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'status_update', status: whatsappStatus, qrCode: qrCodeData, botInfo: botInfo }));
    ws.on('close', () => clients.delete(ws));
});

// --- Lógica de Conexão e Desconexão do WhatsApp ---
async function connectToWhatsApp() {
    if (venomClient || whatsappStatus === 'CONNECTING' || whatsappStatus === 'CONNECTED') {
        console.warn('⚠️ Tentativa de conectar com sessão já ativa ou em andamento.');
        return;
    }
    console.log('Iniciando conexão com o WhatsApp...');
    broadcastStatus('CONNECTING');

    venom.create({
        session: 'automaza-bot',
        useChrome: false,
        headless: 'new',
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    (base64Qr) => broadcastStatus('QR_CODE', { qrCode: base64Qr }),
    (statusSession) => console.log('[Status da Sessão]', statusSession)
    )
    .then(async (client) => {
        console.log('✅ Cliente Venom criado com SUCESSO.');
        venomClient = client;
        
        try {
            const hostDevice = await client.getHostDevice();
            if (hostDevice && hostDevice.id && hostDevice.id._serialized) {
                const numeroBot = hostDevice.id.user;
                const nomeBot = hostDevice.pushname || hostDevice.verifiedName || 'Nome Indisponível';
                
                // Tentativa mais robusta de obter a foto de perfil
                let fotoUrl = null;
                try {
                    fotoUrl = await client.getProfilePicFromServer(hostDevice.id._serialized);
                    console.log("✔️ Foto obtida com getProfilePicFromServer.");
                } catch (picError) {
                    console.warn("⚠️ Falha ao buscar foto com getProfilePicFromServer, tentando com eurl.", picError.message);
                    fotoUrl = hostDevice.eurl || null; // Fallback para a propriedade 'eurl'
                }

                botInfo = { numero: numeroBot, nome: nomeBot, fotoUrl: fotoUrl };
                console.log('Informações do Bot Coletadas:', botInfo);
            }
        } catch (error) {
            console.error('❌ Erro ao obter dados do hostDevice:', error);
        } finally {
            start(client);
            broadcastStatus('CONNECTED', { botInfo });
        }
    })
    .catch((erro) => {
        console.error('❌ Erro DETALHADO ao criar cliente Venom:', erro);
        broadcastStatus('DISCONNECTED');
        venomClient = null;
        botInfo = null;
    });
}

async function disconnectFromWhatsApp() {
    if (venomClient) {
        try {
            await venomClient.logout();
            await venomClient.close();
        } catch (error) {
            console.error('Erro ao desconectar o cliente:', error);
        } finally {
            venomClient = null;
            botInfo = null;
            broadcastStatus('DISCONNECTED');
            console.log('🔌 Cliente WhatsApp desconectado.');
        }
    }
}

// --- Função 'start' que configura as rotinas do bot ---
function start(client) {
    whatsappService.iniciarWhatsApp(client);
    
    client.onMessage(async (message) => {
        if (message.isGroupMsg || !message.body || message.from === 'status@broadcast') return;
        const telefoneCliente = message.from.replace('@c.us', '');
        console.log(`[onMessage] Mensagem de ${telefoneCliente}: "${message.body}"`);
        
        try {
            const db = app.get('db');
            let pedido = await pedidoService.findPedidoByTelefone(db, telefoneCliente);
            
            if (!pedido) {
                const nomeContato = message.notifyName || message.pushName || telefoneCliente;
                const novoPedidoData = { nome: nomeContato, telefone: telefoneCliente };
                pedido = await pedidoService.criarPedido(db, novoPedidoData, client);
                broadcast({ type: 'novo_contato', pedido });
            } else {
                await pedidoService.incrementarNaoLidas(db, pedido.id);
            }
            await pedidoService.addMensagemHistorico(db, pedido.id, message.body, 'recebida', 'cliente');
            broadcast({ type: 'nova_mensagem', pedidoId: pedido.id });
        } catch (error) {
            console.error("[onMessage] Erro CRÍTICO ao processar mensagem:", error);
        }
    });
    
    console.log('✅ Cliente WhatsApp iniciado e pronto para receber mensagens.');
}

// --- Função Principal da Aplicação ---
const startApp = async () => {
    try {
        const db = await initDb();
        app.set('db', db);
        console.log("Banco de dados pronto.");

        // Webhook precisa do corpo raw para validação
        app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

        app.use(express.json());
        app.use(express.static('public'));

        app.use((req, res, next) => {
            req.db = db;
            req.venomClient = venomClient;
            req.broadcast = broadcast;
            next();
        });

        // Rotas públicas de autenticação
        app.post('/api/register', authController.register);
        app.post('/api/login', authController.login);

        // Postback - validação por API Key + controle de plano
        app.post('/api/postback', apiKeyMiddleware, planCheck, integrationsController.receberPostback);

        // Middleware de autenticação para rotas abaixo
        app.use(authMiddleware);

        // Rotas administrativas
        app.get('/api/admin/clients', adminCheck, adminController.listClients);
        app.post('/api/admin/clients', adminCheck, adminController.createClient);
        app.put('/api/admin/clients/:id', adminCheck, adminController.updateClient);
        app.put('/api/admin/clients/:id/active', adminCheck, adminController.toggleActive);

        // Rotas de planos (seleção e gestão)
        app.get('/api/plans', (req, res) => {
            req.db.all('SELECT * FROM plans ORDER BY price', [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ data: rows });
            });
        });
        app.post('/api/subscribe/:planId', (req, res) => {
            const userId = req.user.id;
            const planId = parseInt(req.params.planId);
            const stmt = req.db.prepare('INSERT OR REPLACE INTO subscriptions (id, user_id, plan_id, status) VALUES ((SELECT id FROM subscriptions WHERE user_id = ?), ?, ?, "active")');
            stmt.run(userId, userId, planId, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Plano contratado com sucesso' });
            });
        });
        app.post('/api/payment/checkout', paymentController.createCheckout);


        console.log("✔️ Registrando rotas da API...");
        
        // Rotas de Pedidos
        app.get('/api/pedidos', planCheck, pedidosController.listarPedidos);
        app.post('/api/pedidos', planCheck, pedidosController.criarPedido);
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

        // Rotas de Logs
        app.get('/api/logs', planCheck, logsController.listarLogs);

        // Rotas de Integrações (UNIFICADAS)
        app.get('/api/integrations/info', planCheck, integrationsController.getIntegrationInfo);
        app.post('/api/integrations/regenerate', planCheck, integrationsController.regenerateApiKey);
        app.put('/api/integrations/settings', planCheck, integrationsController.updateIntegrationSettings);

        // Rotas do WhatsApp
        app.get('/api/whatsapp/status', (req, res) => res.json({ status: whatsappStatus, qrCode: qrCodeData, botInfo: botInfo }));
        app.post('/api/whatsapp/connect', planCheck, (req, res) => {
            connectToWhatsApp();
            res.status(202).json({ message: "Processo de conexão iniciado." });
        });
        app.post('/api/whatsapp/disconnect', planCheck, async (req, res) => {
            await disconnectFromWhatsApp();
            res.status(200).json({ message: "Desconectado com sucesso." });
        });

        // Tarefas em Background
        setInterval(() => { if (venomClient) rastreamentoController.verificarRastreios(db, broadcast) }, 300000);
        setInterval(() => { if (venomClient) envioController.enviarMensagensComRegras(db) }, 60000);
        
        server.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));

    } catch (error) {
        console.error("❌ Falha fatal ao iniciar a aplicação:", error);
        process.exit(1);
    }
};

startApp();
