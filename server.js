require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const path = require('path');

const { initDb } = require('./src/database/database.js');
const logger = require('./src/logger');

const rastreamentoController = require('./src/controllers/rastreamentoController');
const envioController = require('./src/controllers/envioController');

const sessionManager = require('./src/whatsapp/sessionManager');
const setupRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const startApp = async () => {
  try {
    const db = await initDb();
    app.set('db', db);
    logger.info('Banco de dados pronto.');

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
            'img-src': ["'self'", 'data:', 'blob:', 'https://i.imgur.com'],
            'connect-src': ["'self'", 'wss:', 'ws:'],
          },
        },
      })
    );
    app.use(express.json());
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'landing.html'));
    });
    app.use(express.static('public'));

    sessionManager.init(app, server);
    setupRoutes(app, db, sessionManager);

    setInterval(() => {
      if (sessionManager.activeSessions.size > 0)
        rastreamentoController.verificarRastreios(db, sessionManager.broadcast);
    }, 300000);
    setInterval(() => {
      if (sessionManager.activeSessions.size > 0)
        envioController.enviarMensagensComRegras(
          db,
          sessionManager.broadcast,
          sessionManager.activeSessions
        );
    }, 60000);

    server.listen(PORT, () =>
      logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`)
    );
  } catch (error) {
    logger.error('❌ Falha fatal:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startApp();
