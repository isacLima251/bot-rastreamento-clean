function addEntry(db, userId, clientName, clientCell, productName, status) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO integration_history (user_id, client_name, client_cell, product_name, status) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [userId, clientName, clientCell, productName, status], function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID });
        });
    });
}

function getPaginated(db, userId, limit, offset) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM integration_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        db.all(sql, [userId, limit, offset], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function countAll(db, userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM integration_history WHERE user_id = ?', [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row.total || 0);
        });
    });
}

module.exports = { addEntry, getPaginated, countAll };
