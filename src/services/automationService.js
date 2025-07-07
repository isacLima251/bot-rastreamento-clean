// src/services/automationService.js

// Busca todas as automações e formata num objeto para fácil acesso
exports.getAutomations = async (db, clienteId = null) => {
    const rows = await db('automacoes')
        .modify(q => { if (clienteId !== null) q.where('cliente_id', clienteId); })
        .select();
    return rows.reduce((acc, row) => {
        acc[row.gatilho] = {
            ativo: Boolean(row.ativo),
            mensagem: row.mensagem
        };
        return acc;
    }, {});
};

// Salva todas as configurações de automação recebidas do frontend
exports.saveAutomations = async (db, configs, clienteId = null) => {
    await db.transaction(async trx => {
        for (const gatilho in configs) {
            const config = configs[gatilho];
            await trx('automacoes')
                .insert({ gatilho, cliente_id: clienteId, ativo: config.ativo ? 1 : 0, mensagem: config.mensagem })
                .onConflict(['gatilho','cliente_id'])
                .merge();
        }
    });
    return { message: 'Configurações salvas com sucesso.' };
};
