const userService = require('../services/userService');
const integrationConfigService = require('../services/integrationConfigService');
const integrationService = require('../services/integrationService');
const subscriptionService = require('../services/subscriptionService');
const integrationHistoryService = require('../services/integrationHistoryService');
const pedidoService = require('../services/pedidoService');

// Dicionário de tradutores para cada plataforma
const platformMappers = {
    braip: (payload) => {
        let eventType = 'UNKNOWN';
        if (payload.type === 'TRACKING_CODE_ADDED') {
            eventType = 'RASTREIO_ADICIONADO';
        } else if (payload.trans_status === 'Pagamento Aprovado' || payload.trans_status === 'Agendado') {
            eventType = 'VENDA_APROVADA';
        } else if (['Cancelada', 'Chargeback', 'Devolvida'].includes(payload.trans_status)) {
            eventType = 'VENDA_CANCELADA';
        }

        return {
            eventType,
            clientEmail: payload.client_email,
            clientName: payload.client_name,
            clientPhone: payload.client_cel,
            productName: payload.product_name,
            trackingCode: payload.tracking_code,
            transactionId: payload.trans_key // ID único da transação
        };
    },
    // ... adicione aqui os mappers para Kiwify, Hotmart, etc.
};

exports.receberPostback = async (req, res) => {
    const { unique_path } = req.params;
    const payload = req.body;

    try {
        const integracao = await integrationService.findIntegrationByPath(req.db, unique_path);
        if (!integracao) {
            return res.status(404).json({ error: 'Integração não encontrada.' });
        }
        const nossoUsuario = await userService.findUserById(req.db, integracao.user_id);
        if (!nossoUsuario) {
            return res.status(404).json({ error: 'Usuário dono da integração não encontrado.' });
        }

        const mapper = platformMappers[integracao.platform];
        if (!mapper) {
            return res.status(400).json({ error: 'Plataforma não suportada.' });
        }

        const dados = mapper(payload);

        switch (dados.eventType) {
            case 'RASTREIO_ADICIONADO':
                const pedido = await pedidoService.findPedidoByEmail(req.db, dados.clientEmail, nossoUsuario.id);
                // etc...
                break;
        }

        res.status(200).json({ message: 'Webhook processado.' });

    } catch (error) {
        console.error(`[Webhook Erro] Para o caminho ${unique_path}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
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
    const { platform, name } = req.body;
    const clienteId = req.user.id;
    try {
        const novaIntegracao = await integrationService.createIntegration(req.db, clienteId, platform, name);
        res.status(201).json(novaIntegracao);
    } catch (err) {
        res.status(500).json({ error: 'Falha ao criar integração.' });
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
