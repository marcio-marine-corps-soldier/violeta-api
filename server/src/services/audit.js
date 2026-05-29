// server/src/services/audit.js
const db = require('../database');

module.exports = (userId, action, ip, userAgent) => {
    try {
        const stmt = db.prepare('INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)');
        stmt.run(userId, action, ip, userAgent);
    } catch (err) {
        console.error('Falha crítica ao gravar log de auditoria do sistema:', err);
    }
};