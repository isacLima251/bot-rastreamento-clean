// src/database/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, '../../automaza.db');

const initDb = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error("❌ Erro ao conectar ao banco de dados:", err.message);
                return reject(err);
            }
            console.log('✅ Conectado ao banco de dados SQLite.');

            db.serialize(() => {
                // Tabela de Pedidos (sem alterações)
                db.run(`
                    CREATE TABLE IF NOT EXISTS pedidos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome TEXT,
                        telefone TEXT NOT NULL UNIQUE,
                        produto TEXT,
                        codigoRastreio TEXT,
                        dataPostagem TEXT,
                        statusInterno TEXT,
                        ultimaAtualizacao TEXT,
                        ultimaLocalizacao TEXT,
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

                // Tabela de Histórico (sem alterações)
                db.run(`
                    CREATE TABLE IF NOT EXISTS historico_mensagens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        pedido_id INTEGER NOT NULL,
                        mensagem TEXT NOT NULL,
                        tipo_mensagem TEXT,
                        origem TEXT NOT NULL,
                        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) return reject(err);
                });

                // Tabela de Automações
                db.run(`
                    CREATE TABLE IF NOT EXISTS automacoes (
                        gatilho TEXT PRIMARY KEY,
                        ativo INTEGER NOT NULL DEFAULT 0,
                        mensagem TEXT
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
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (err) => {
                        if (err) {
                            console.error("❌ Erro ao criar tabela 'users':", err.message);
                            return reject(err);
                        }
                        console.log("✔️ Tabela 'users' pronta.");
                    });

                    // Insere os dados padrão para garantir que a tabela tenha conteúdo inicial
                    const stmt = db.prepare("INSERT OR IGNORE INTO automacoes (gatilho, ativo, mensagem) VALUES (?, ?, ?)");
                    const automationsData = [
                        ['boas_vindas', 1, 'Olá {{primeiro_nome}}! Bem-vindo(a). Agradecemos o seu contato!'],
                        ['envio_rastreio', 0, 'Olá {{primeiro_nome}}, o seu pedido foi enviado! O seu código de rastreio é: {{codigo_rastreio}}'],
                        ['pedido_a_caminho', 1, 'Boas notícias, {{primeiro_nome}}! O seu pedido está a caminho. Pode acompanhar com o código: {{codigo_rastreio}}'],
                        ['pedido_atrasado', 1, 'Olá {{primeiro_nome}}, notamos um possível atraso na entrega do seu pedido. Já estamos a verificar o que aconteceu. Código: {{codigo_rastreio}}'],
                        ['pedido_devolvido', 1, 'Atenção {{primeiro_nome}}, o seu pedido foi devolvido ao remetente. Por favor, entre em contato connosco para resolvermos a situação. Código: {{codigo_rastreio}}'],
                        // --- NOVAS LINHAS AQUI ---
                        ['pedido_a_espera', 1, 'Olá {{primeiro_nome}}! O seu pedido está a espera. Agradecemos o seu contato!'],
                        ['pedido_cancelado', 1, 'Olá {{primeiro_nome}}! seu pedido foi cancelado. Agradecemos o seu contato!']
                    ];
                    
                    for (const data of automationsData) {
                        stmt.run(data);
                    }
                    stmt.finalize((err) => {
                        if (!err) {
                            console.log("✔️ Dados padrão de automação garantidos.");
                        }
                    });
                });

                resolve(db);
            });
        });
    });
};

module.exports = { initDb };
