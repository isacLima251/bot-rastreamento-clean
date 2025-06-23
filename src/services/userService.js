const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateApiKey() {
    return crypto.randomBytes(20).toString('hex');
}

function createUser(db, email, password) {
    return new Promise((resolve, reject) => {
        const hashed = bcrypt.hashSync(password, 10);
        const apiKey = generateApiKey();
        const stmt = db.prepare('INSERT INTO users (email, password, api_key) VALUES (?, ?, ?)');
        stmt.run(email, hashed, apiKey, function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, email, api_key: apiKey });
        });
        stmt.finalize();
    });
}

function findUserByEmail(db, email) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function findUserById(db, id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function findUserByApiKey(db, apiKey) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE api_key = ?', [apiKey], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function regenerateApiKey(db, userId) {
    return new Promise((resolve, reject) => {
        const newKey = generateApiKey();
        db.run('UPDATE users SET api_key = ? WHERE id = ?', [newKey, userId], function(err) {
            if (err) return reject(err);
            resolve(newKey);
        });
    });
}

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    findUserByApiKey,
    regenerateApiKey
};
