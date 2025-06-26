// src/controllers/reportsController.js

const subscriptionService = require('../services/subscriptionService');
const pedidoService = require('../services/pedidoService');

// Função auxiliar para executar consultas SQL e retornar uma Promise
const runQuery = (dbInstance, sql, params = []) => {
    return new Promise((resolve, reject) => {
        dbInstance.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

exports.getReportSummary = async (req, res) => {
    try {
        const db = req.db;
        const clienteId = req.user.id;

        // Executa todas as consultas necessárias em paralelo para mais eficiência
        const [
            totalContactsRows,
            messagesSentRows,
            statusDistributionRows,
            newContactsLast7DaysRows
        ] = await Promise.all([
            runQuery(db, `SELECT COUNT(id) as count FROM pedidos WHERE cliente_id = ?`, [clienteId]),
            runQuery(db, `SELECT COUNT(id) as count FROM historico_mensagens WHERE origem = 'bot' AND cliente_id = ?`, [clienteId]),
            runQuery(db, `SELECT statusInterno, COUNT(id) as count FROM pedidos WHERE statusInterno IS NOT NULL AND cliente_id = ? GROUP BY statusInterno`, [clienteId]),
            runQuery(db, `SELECT strftime('%Y-%m-%d', dataCriacao) as dia, COUNT(id) as count FROM pedidos WHERE cliente_id = ? AND dataCriacao >= date('now', '-7 days') GROUP BY dia ORDER BY dia ASC`, [clienteId])
        ]);

        // Formata os resultados num único objeto JSON
        const summary = {
            totalContacts: totalContactsRows[0]?.count || 0,
            messagesSent: messagesSentRows[0]?.count || 0,
            ordersDelivered: statusDistributionRows.find(row => row.statusInterno === 'entregue')?.count || 0,
            statusDistribution: statusDistributionRows,
            newContactsLast7Days: newContactsLast7DaysRows
        };

        res.status(200).json(summary);

    } catch (error) {
        console.error("ERRO DETALHADO AO GERAR RELATÓRIO:", error);
        res.status(500).json({ error: "Falha ao gerar o resumo do relatório." });
    }
};

exports.getBillingHistory = async (req, res) => {
    try {
        const db = req.db;
        const userId = req.user.id;
        const sub = await subscriptionService.getUserSubscription(db, userId);
        if (!sub) return res.status(404).json({ error: 'Nenhum plano encontrado' });

        const usage = await subscriptionService.calculateUsage(db, sub);
        const end = require('moment')(sub.renewal_date);
        const start = end.clone().subtract(1, 'month');
        const pedidos = await pedidoService.getPedidosComCodigoAtivo(
            db,
            userId,
            start.format('YYYY-MM-DD'),
            end.format('YYYY-MM-DD')
        );

        res.json({ usage, pedidos });
    } catch (err) {
        console.error('Erro ao obter histórico de faturamento:', err);
        res.status(500).json({ error: 'Falha ao buscar histórico de faturamento' });
    }
};

