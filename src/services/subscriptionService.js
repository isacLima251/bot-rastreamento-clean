const moment = require('moment');

function getUserSubscription(db, userId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT s.*, p.monthly_limit FROM subscriptions s
                     JOIN plans p ON p.id = s.plan_id
                     WHERE s.user_id = ?`;
        db.get(sql, [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function incrementUsage(db, subscriptionId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE subscriptions SET usage = usage + 1 WHERE id = ?', [subscriptionId], function(err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
        });
    });
}

function resetUsageIfNeeded(db, subscriptionId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT usage, renewal_date FROM subscriptions WHERE id = ?', [subscriptionId], (err, sub) => {
            if (err) return reject(err);
            if (!sub) return resolve();
            const now = moment();
            if (!sub.renewal_date || moment(sub.renewal_date).isBefore(now)) {
                const next = now.clone().add(1, 'month').startOf('day');
                db.run('UPDATE subscriptions SET usage = 0, renewal_date = ? WHERE id = ?', [next.format('YYYY-MM-DD'), subscriptionId], (e) => {
                    if (e) return reject(e);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

function createSubscription(db, userId, planId) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO subscriptions (user_id, plan_id, status, usage) VALUES (?, ?, "active", 0)';
        db.run(sql, [userId, planId], function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID });
        });
    });
}

function updateUserPlan(db, userId, planId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE subscriptions SET plan_id = ? WHERE user_id = ?', [planId, userId], function(err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
        });
    });
}

function updateSubscriptionStatus(db, userId, status) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE subscriptions SET status = ? WHERE user_id = ?', [status, userId], function(err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
        });
    });
}

module.exports = { getUserSubscription, incrementUsage, resetUsageIfNeeded, createSubscription, updateUserPlan, updateSubscriptionStatus };
