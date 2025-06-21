// src/services/automationService.js

// Busca todas as automações e formata num objeto para fácil acesso
exports.getAutomations = (db) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM automacoes", [], (err, rows) => {
            if (err) return reject(err);
            
            const automationsMap = rows.reduce((acc, row) => {
                acc[row.gatilho] = {
                    ativo: Boolean(row.ativo),
                    mensagem: row.mensagem
                };
                return acc;
            }, {});

            resolve(automationsMap);
        });
    });
};

// Salva todas as configurações de automação recebidas do frontend
exports.saveAutomations = (db, configs) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT OR REPLACE INTO automacoes (gatilho, ativo, mensagem) VALUES (?, ?, ?)");
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            for (const gatilho in configs) {
                const config = configs[gatilho];
                stmt.run(gatilho, config.ativo ? 1 : 0, config.mensagem);
            }
            db.run("COMMIT", (err) => {
                if(err) return reject(err);
                resolve({ message: "Configurações salvas com sucesso." });
            });
        });

        stmt.finalize();
    });
};