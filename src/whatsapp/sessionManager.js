const { WebSocketServer } = require('ws');
const venom = require('venom-bot');
const jwt = require('jsonwebtoken');
const whatsappService = require('../services/whatsappService');
const pedidoService = require('../services/pedidoService');
const settingsService = require('../services/settingsService');

let appInstance;
let wss;
// Map: userId => Set<WebSocket>
const clients = new Map();

// Map: userId => { status, qrCode, botInfo }
const sessionData = new Map();
const activeSessions = new Map();

function broadcast(userId, data) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const jsonData = JSON.stringify(data);
  console.log(`[WebSocket] A transmitir para ${userId}: ${jsonData}`);
  for (const client of userClients) {
    if (client.readyState === client.OPEN) {
      client.send(jsonData);
    }
  }
}

function broadcastStatus(userId, newStatus, data = {}) {
  const info = sessionData.get(userId) || { status: 'DISCONNECTED', qrCode: null, botInfo: null };
  info.status = newStatus;
  if (Object.prototype.hasOwnProperty.call(data, 'qrCode')) info.qrCode = data.qrCode;
  if (data.botInfo) info.botInfo = data.botInfo;
  sessionData.set(userId, info);
  console.log(`Status do WhatsApp do usuário ${userId} alterado para: ${newStatus}`);
  broadcast(userId, { type: 'status_update', status: newStatus, ...data });
}

function setupWebSocket(server) {
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.close();
      return;
    }
    const userId = payload.id;
    console.log(`🔗 Painel conectado via WebSocket para usuário ${userId}.`);
    if (!clients.has(userId)) clients.set(userId, new Set());
    const set = clients.get(userId);
    set.add(ws);
    const info = sessionData.get(userId) || { status: 'DISCONNECTED', qrCode: null, botInfo: null };
    ws.send(
      JSON.stringify({
        type: 'status_update',
        status: info.status,
        qrCode: info.qrCode,
        botInfo: info.botInfo,
      })
    );
    ws.on('close', () => {
      set.delete(ws);
      if (set.size === 0) clients.delete(userId);
    });
  });
}

function init(app, server) {
  appInstance = app;
  setupWebSocket(server);
}

function getDb() {
  return appInstance.get('db');
}

function start(client, userId) {
  whatsappService.iniciarWhatsApp(client);

  client.onMessage(async (message) => {
    if (message.isGroupMsg || !message.body || message.from === 'status@broadcast') return;
    const telefoneCliente = message.from.replace('@c.us', '');
    console.log(`[onMessage] Mensagem de ${telefoneCliente}: "${message.body}"`);

    try {
      const db = getDb();
      let pedido = await pedidoService.findPedidoByTelefone(db, telefoneCliente, userId);

      if (!pedido) {
        const setting = await settingsService.getSetting(db, userId);
        if (setting) {
          const nomeContato = message.notifyName || message.pushName || telefoneCliente;
          const novoPedidoData = { nome: nomeContato, telefone: telefoneCliente };
          pedido = await pedidoService.criarPedido(db, novoPedidoData, client, userId);
          await pedidoService.updateCamposPedido(db, pedido.id, { mensagemUltimoStatus: 'boas_vindas' }, userId);
          broadcast(userId, { type: 'novo_contato', pedido });
        } else {
          console.log('Criação automática de contato desativada - ignorando mensagem.');
          return;
        }
      } else {
        await pedidoService.incrementarNaoLidas(db, pedido.id, userId);
      }
      await pedidoService.addMensagemHistorico(db, pedido.id, message.body, 'recebida', 'cliente', userId);
      broadcast(userId, { type: 'nova_mensagem', pedidoId: pedido.id });
    } catch (error) {
      console.error('[onMessage] Erro CRÍTICO ao processar mensagem:', error);
    }
  });

  console.log('✅ Cliente WhatsApp iniciado e pronto para receber mensagens.');
}

async function connectToWhatsApp(userId) {
  const current = sessionData.get(userId);
  if (activeSessions.has(userId) || (current && (current.status === 'CONNECTING' || current.status === 'CONNECTED'))) {
    console.warn(`⚠️ Tentativa de conectar com sessão já ativa para o usuário ${userId}.`);
    return;
  }
  console.log(`Iniciando conexão com o WhatsApp para usuário ${userId}...`);
  broadcastStatus(userId, 'CONNECTING');

  venom
    .create(
      {
        session: `whatsship-bot-${userId}`,
        useChrome: false,
        headless: 'new',
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      (base64Qr) => broadcastStatus(userId, 'QR_CODE', { qrCode: base64Qr }),
      (statusSession) => console.log('[Status da Sessão]', statusSession)
    )
    .then(async (client) => {
      console.log('✅ Cliente Venom criado com SUCESSO.');
      activeSessions.set(userId, client);

      try {
        const hostDevice = await client.getHostDevice();
        if (hostDevice && hostDevice.id && hostDevice.id._serialized) {
          const numeroBot = hostDevice.id.user;
          const nomeBot = hostDevice.pushname || hostDevice.verifiedName || 'Nome Indisponível';

          let fotoUrl = null;
          try {
            fotoUrl = await client.getProfilePicFromServer(hostDevice.id._serialized);
            console.log('✔️ Foto obtida com getProfilePicFromServer.');
          } catch (picError) {
            console.warn(
              '⚠️ Falha ao buscar foto com getProfilePicFromServer, tentando com eurl.',
              picError.message
            );
            fotoUrl = hostDevice.eurl || null;
          }

          const info = sessionData.get(userId) || { status: 'CONNECTING', qrCode: null, botInfo: null };
          info.botInfo = { numero: numeroBot, nome: nomeBot, fotoUrl };
          sessionData.set(userId, info);
          console.log('Informações do Bot Coletadas:', info.botInfo);
        }
      } catch (error) {
        console.error('❌ Erro ao obter dados do hostDevice:', error);
      } finally {
        start(client, userId);
        const info = sessionData.get(userId) || { botInfo: null };
        broadcastStatus(userId, 'CONNECTED', { botInfo: info.botInfo });
      }
    })
    .catch((erro) => {
      console.error('❌ Erro DETALHADO ao criar cliente Venom:', erro);
      broadcastStatus(userId, 'DISCONNECTED');
      activeSessions.delete(userId);
      sessionData.set(userId, { status: 'DISCONNECTED', qrCode: null, botInfo: null });
    });
}

async function disconnectFromWhatsApp(userId) {
  const client = activeSessions.get(userId);
  if (client) {
    try {
      await client.logout();
      await client.close();
    } catch (error) {
      console.error('Erro ao desconectar o cliente:', error);
    } finally {
      activeSessions.delete(userId);
      sessionData.set(userId, { status: 'DISCONNECTED', qrCode: null, botInfo: null });
      broadcastStatus(userId, 'DISCONNECTED');
      console.log('🔌 Cliente WhatsApp desconectado.');
    }
  }
}

module.exports = {
  init,
  connectToWhatsApp,
  disconnectFromWhatsApp,
  broadcast,
  getStatus: (userId) => (sessionData.get(userId) || { status: 'DISCONNECTED' }).status,
  getQrCode: (userId) => (sessionData.get(userId) || {}).qrCode || null,
  getBotInfo: (userId) => (sessionData.get(userId) || {}).botInfo || null,
  activeSessions,
};
