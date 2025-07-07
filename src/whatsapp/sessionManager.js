const { WebSocketServer } = require('ws');
const venom = require('venom-bot');
const whatsappService = require('../services/whatsappService');
const pedidoService = require('../services/pedidoService');
const settingsService = require('../services/settingsService');

let appInstance;
let wss;
const clients = new Set();

let whatsappStatus = 'DISCONNECTED';
let qrCodeData = null;
let botInfo = null;
const activeSessions = new Map();

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

function setupWebSocket(server) {
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    console.log('🔗 Novo painel conectado via WebSocket.');
    clients.add(ws);
    ws.send(
      JSON.stringify({
        type: 'status_update',
        status: whatsappStatus,
        qrCode: qrCodeData,
        botInfo,
      })
    );
    ws.on('close', () => clients.delete(ws));
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
          broadcast({ type: 'novo_contato', pedido });
        } else {
          console.log('Criação automática de contato desativada - ignorando mensagem.');
          return;
        }
      } else {
        await pedidoService.incrementarNaoLidas(db, pedido.id, userId);
      }
      await pedidoService.addMensagemHistorico(db, pedido.id, message.body, 'recebida', 'cliente', userId);
      broadcast({ type: 'nova_mensagem', pedidoId: pedido.id });
    } catch (error) {
      console.error('[onMessage] Erro CRÍTICO ao processar mensagem:', error);
    }
  });

  console.log('✅ Cliente WhatsApp iniciado e pronto para receber mensagens.');
}

async function connectToWhatsApp(userId) {
  if (activeSessions.has(userId) || whatsappStatus === 'CONNECTING' || whatsappStatus === 'CONNECTED') {
    console.warn(`⚠️ Tentativa de conectar com sessão já ativa para o usuário ${userId}.`);
    return;
  }
  console.log(`Iniciando conexão com o WhatsApp para usuário ${userId}...`);
  broadcastStatus('CONNECTING');

  venom
    .create(
      {
        session: `whatsship-bot-${userId}`,
        useChrome: false,
        headless: 'new',
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      (base64Qr) => broadcastStatus('QR_CODE', { qrCode: base64Qr }),
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

          botInfo = { numero: numeroBot, nome: nomeBot, fotoUrl };
          console.log('Informações do Bot Coletadas:', botInfo);
        }
      } catch (error) {
        console.error('❌ Erro ao obter dados do hostDevice:', error);
      } finally {
        start(client, userId);
        broadcastStatus('CONNECTED', { botInfo });
      }
    })
    .catch((erro) => {
      console.error('❌ Erro DETALHADO ao criar cliente Venom:', erro);
      broadcastStatus('DISCONNECTED');
      activeSessions.delete(userId);
      botInfo = null;
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
      botInfo = null;
      broadcastStatus('DISCONNECTED');
      console.log('🔌 Cliente WhatsApp desconectado.');
    }
  }
}

module.exports = {
  init,
  connectToWhatsApp,
  disconnectFromWhatsApp,
  broadcast,
  getStatus: () => whatsappStatus,
  getQrCode: () => qrCodeData,
  getBotInfo: () => botInfo,
  activeSessions,
};
