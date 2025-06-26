// src/database/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../automaza.db');

const initDb = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error("❌ Erro ao conectar ao banco de dados:", err.message);
                return reject(err);
            }
            console.log('✅ Conectado ao banco de dados SQLite.');

            db.serialize(() => {
                // Tabela de Pedidos com suporte a multitenancy
                db.run(`
                    CREATE TABLE IF NOT EXISTS pedidos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        cliente_id INTEGER,
                        nome TEXT,
                        telefone TEXT NOT NULL UNIQUE,
                        produto TEXT,
                        codigoRastreio TEXT,
                        dataPostagem TEXT,
                        statusInterno TEXT,
                        ultimaAtualizacao TEXT,
                        ultimaLocalizacao TEXT,
                        origemUltimaMovimentacao TEXT,
                        destinoUltimaMovimentacao TEXT,
                        descricaoUltimoEvento TEXT,
                        mensagemUltimoStatus TEXT,
                        fotoPerfilUrl TEXT,
                        dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        mensagensNaoLidas INTEGER DEFAULT 0 NOT NULL,
                        ultimaMensagem TEXT,
                        dataUltimaMensagem DATETIME
                    )
                `, (err) => {
                    if (err) return reject(err);
                });

                // Tabela de Histórico
                db.run(`
                    CREATE TABLE IF NOT EXISTS historico_mensagens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        pedido_id INTEGER NOT NULL,
                        cliente_id INTEGER,
                        mensagem TEXT NOT NULL,
                        tipo_mensagem TEXT,
                        origem TEXT NOT NULL,
                        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) return reject(err);
                });

                // Tabela de Logs de Uso
                db.run(`
                    CREATE TABLE IF NOT EXISTS logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        cliente_id INTEGER,
                        acao TEXT NOT NULL,
                        detalhe TEXT,
                        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) return reject(err);
                });

                // Tabela de Histórico de Integrações
                db.run(`
                    CREATE TABLE IF NOT EXISTS integration_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        client_name TEXT,
                        client_cell TEXT,
                        product_name TEXT,
                        status TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) return reject(err);
                });

                // Tabela de Automações com chave composta (cliente + gatilho)
                db.run(`
                    CREATE TABLE IF NOT EXISTS automacoes (
                        gatilho TEXT,
                        cliente_id INTEGER,
                        ativo INTEGER NOT NULL DEFAULT 0,
                        mensagem TEXT,
                        PRIMARY KEY (gatilho, cliente_id)
                    )
                `, (err) => {
                    if (err) {
                        console.error("❌ Erro ao criar tabela 'automacoes':", err.message);
                        return reject(err);
                    }
                    console.log("✔️ Tabela 'automacoes' pronta.");

                    // Tabela de Usuários
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT NOT NULL UNIQUE,
                        password TEXT NOT NULL,
                        api_key TEXT UNIQUE,
                        is_admin INTEGER NOT NULL DEFAULT 0,
                        is_active INTEGER NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error("❌ Erro ao criar tabela 'users':", err.message);
                        return reject(err);
                    }
                    console.log("✔️ Tabela 'users' pronta.");

                    // Garantir colunas obrigatórias
                    db.run("ALTER TABLE users ADD COLUMN api_key TEXT", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                        db.all('SELECT id FROM users WHERE api_key IS NULL', [], (err, rows) => {
                            if (err) return reject(err);
                            const stmt = db.prepare('UPDATE users SET api_key = ? WHERE id = ?');
                            for (const row of rows) {
                                const key = require('crypto').randomBytes(20).toString('hex');
                                stmt.run(key, row.id);
                            }
                            stmt.finalize((err) => {
                                if (err) return reject(err);
                            });
                        });
                    });
                    db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                    });
                    db.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                    });

                    // Garante registros padrão nas tabelas de configurações
                    db.all('SELECT id FROM users', [], (err, rows) => {
                        if (err) return reject(err);
                        const stmtIntegration = db.prepare('INSERT OR IGNORE INTO integration_settings (user_id) VALUES (?)');
                        const stmtUserSettings = db.prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)');
                        for (const row of rows) {
                            stmtIntegration.run(row.id);
                            stmtUserSettings.run(row.id);
                        }
                        stmtIntegration.finalize((err) => {
                            if (err) return reject(err);
                            stmtUserSettings.finalize((err2) => {
                                if (err2) return reject(err2);
                                resolve(db);
                            });
                        });
                    });
                });

                    // Tabela de Planos
                    db.run(`
                        CREATE TABLE IF NOT EXISTS plans (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            price REAL NOT NULL,
                            monthly_limit INTEGER NOT NULL
                        )
                    `, (err) => {
                        if (err) {
                            console.error("❌ Erro ao criar tabela 'plans':", err.message);
                            return reject(err);
                        }
                        console.log("✔️ Tabela 'plans' pronta.");

                        // Planos padrão
                        const planStmt = db.prepare("INSERT OR REPLACE INTO plans (id, name, price, monthly_limit) VALUES (?, ?, ?, ?)");
                        const plansData = [
                            [1, 'Gr\u00e1tis', 0, 10],
                            [2, 'Start', 39, 50],
                            [3, 'Basic', 59, 100],
                            [4, 'Pro', 99, 250],
                            [5, 'Pro Plus', 0, 600]
                        ];
                        for (const data of plansData) planStmt.run(data);
                        planStmt.finalize();
                    });

                    // Tabela de Assinaturas
                db.run(`
                    CREATE TABLE IF NOT EXISTS subscriptions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        plan_id INTEGER NOT NULL,
                        status TEXT NOT NULL DEFAULT 'active',
                        usage INTEGER NOT NULL DEFAULT 0,
                        renewal_date TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (plan_id) REFERENCES plans(id)
                    )
                `, (err) => {
                    if (err) {
                        console.error("❌ Erro ao criar tabela 'subscriptions':", err.message);
                        return reject(err);
                    }
                    console.log("✔️ Tabela 'subscriptions' pronta.");
                    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`);
                });

                    // Tabela de Configurações de Integração
                    db.run(`
                        CREATE TABLE IF NOT EXISTS integration_settings (
                            user_id INTEGER PRIMARY KEY,
                            postback_secret TEXT,
                            rastreio_api_key TEXT,
                            webhook_url TEXT,
                            FOREIGN KEY (user_id) REFERENCES users(id)
                        )
                    `, (err) => {
                        if (err) {
                            console.error("❌ Erro ao criar tabela 'integration_settings':", err.message);
                            return reject(err);
                        }
                        console.log("✔️ Tabela 'integration_settings' pronta.");
                    });

                    // Tabela de Configurações de Usuário
                    db.run(`
                        CREATE TABLE IF NOT EXISTS user_settings (
                            user_id INTEGER PRIMARY KEY,
                            create_contact_on_message INTEGER DEFAULT 1,
                            FOREIGN KEY (user_id) REFERENCES users(id)
                        )
                    `, (err) => {
                        if (err) {
                            console.error("❌ Erro ao criar tabela 'user_settings':", err.message);
                            return reject(err);
                        }
                        console.log("✔️ Tabela 'user_settings' pronta.");
                    });

                    // Insere os dados padrão para garantir que a tabela tenha conteúdo inicial
                    const stmt = db.prepare("INSERT OR IGNORE INTO automacoes (gatilho, cliente_id, ativo, mensagem) VALUES (?, ?, ?, ?)");
                    const automationsData = [
                        ['boas_vindas', 1, 1, 'Olá {{primeiro_nome}}! Bem-vindo(a). Agradecemos o seu contato!'],
                        ['envio_rastreio', 1, 0, 'Olá {{primeiro_nome}}, o seu pedido foi enviado! O seu código de rastreio é: {{codigo_rastreio}}'],
                        ['pedido_a_caminho', 1, 1, 'Boas notícias, {{primeiro_nome}}! O seu pedido está a caminho. Pode acompanhar com o código: {{codigo_rastreio}}'],
                        ['pedido_atrasado', 1, 1, 'Olá {{primeiro_nome}}, notamos um possível atraso na entrega do seu pedido. Já estamos a verificar o que aconteceu. Código: {{codigo_rastreio}}'],
                        ['pedido_devolvido', 1, 1, 'Atenção {{primeiro_nome}}, o seu pedido foi devolvido ao remetente. Por favor, entre em contato connosco para resolvermos a situação. Código: {{codigo_rastreio}}'],
                        // --- NOVAS LINHAS AQUI ---
                        ['pedido_a_espera', 1, 1, 'Olá {{primeiro_nome}}! O seu pedido está a espera. Agradecemos o seu contato!'],
                        ['pedido_cancelado', 1, 1, 'Olá {{primeiro_nome}}! seu pedido foi cancelado. Agradecemos o seu contato!']
                    ];

                    for (const data of automationsData) {
                        stmt.run(data);
                    }
                    stmt.finalize((err) => {
                        if (err) return reject(err);
                        console.log("✔️ Dados padrão de automação garantidos.");
                    });

                    // Garante que as colunas de multitenancy existam em bancos antigos
                    db.run("ALTER TABLE pedidos ADD COLUMN cliente_id INTEGER", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                        db.run("UPDATE pedidos SET cliente_id = 1 WHERE cliente_id IS NULL");
                    });
                    db.run("ALTER TABLE historico_mensagens ADD COLUMN cliente_id INTEGER", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                        db.run("UPDATE historico_mensagens SET cliente_id = 1 WHERE cliente_id IS NULL");
                    });
                    db.run("ALTER TABLE automacoes ADD COLUMN cliente_id INTEGER", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                        db.run("UPDATE automacoes SET cliente_id = 1 WHERE cliente_id IS NULL");
                    });

                    // Novas colunas para detalhes de rastreio
                    db.run("ALTER TABLE pedidos ADD COLUMN origemUltimaMovimentacao TEXT", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                    });
                    db.run("ALTER TABLE pedidos ADD COLUMN destinoUltimaMovimentacao TEXT", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                    });
                    db.run("ALTER TABLE pedidos ADD COLUMN descricaoUltimoEvento TEXT", [], (e) => {
                        if (e && !e.message.includes('duplicate')) return reject(e);
                    });

                    // Bloco movido para dentro da criação da tabela 'users'

                });
            });
        });
    });
};

module.exports = { initDb };

