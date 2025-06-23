const bcrypt = require('bcryptjs');

function createUser(db, email, password) {
    return new Promise((resolve, reject) => {
        const hashed = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
        stmt.run(email, hashed, function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, email });
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

module.exports = { createUser, findUserByEmail };
