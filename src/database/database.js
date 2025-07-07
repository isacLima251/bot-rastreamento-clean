const path = require('path');
const knex = require('knex');

function createKnex() {
  const client = process.env.DB_CLIENT || 'sqlite3';
  let connection;
  if (client === 'sqlite3') {
    connection = { filename: process.env.DB_PATH || path.join(__dirname, '../../whatsship.db') };
  } else {
    connection = process.env.DATABASE_URL || process.env.DB_CONNECTION;
  }
  return knex({
    client,
    connection,
    useNullAsDefault: client === 'sqlite3'
  });
}

async function initDb() {
  const db = createKnex();
  await db.migrate.latest({ directory: path.join(__dirname, '../../migrations') });
  // Attach helpers for backwards compatibility
  db.all = (sql, params, cb) => {
    db.raw(sql, params).then(res => cb(null, res.rows || res)).catch(cb);
  };
  db.get = (sql, params, cb) => {
    db.raw(sql, params).then(res => {
      const rows = res.rows || res;
      cb(null, rows[0]);
    }).catch(cb);
  };
  db.run = (sql, params, cb) => {
    db.raw(sql, params).then(res => cb && cb(null, res)).catch(err => cb && cb(err));
  };
  return db;
}

module.exports = { initDb };
