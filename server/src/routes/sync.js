// server/src/routes/sync.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.post('/push', auth, (req, res) => {
    const { type, encryptedData, iv } = req.body;
    const id = `${req.userId}_${type}`;
    const timestamp = Date.now();

    const stmt = db.prepare('INSERT INTO sync_store (id, user_id, type, encrypted_data, iv, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET encrypted_data=excluded.encrypted_data, iv=excluded.iv, updated_at=excluded.updated_at');
    stmt.run(id, req.userId, type, encryptedData, iv, timestamp);
    res.json({ success: true, timestamp });
});

router.get('/pull', auth, (req, res) => {
    const { type } = req.query;
    const rows = db.prepare('SELECT encrypted_data, iv, updated_at FROM sync_store WHERE user_id = ? AND type = ?').all(req.userId, type);
    res.json(rows);
});

module.exports = router;