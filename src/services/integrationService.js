function createIntegration(db, userId, platform, name, uniquePath, status = 'active') {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO integrations (user_id, platform, name, unique_path, status) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [userId, platform, name, uniquePath, status], function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID });
        });
    });
}

function findIntegrationByPath(db, uniquePath) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM integrations WHERE unique_path = ?', [uniquePath], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function listIntegrationsByUser(db, userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM integrations WHERE user_id = ?', [userId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = { createIntegration, findIntegrationByPath, listIntegrationsByUser };
