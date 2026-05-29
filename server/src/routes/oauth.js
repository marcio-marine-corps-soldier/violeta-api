// server/src/routes/oauth.js
const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../database');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google/verify', async (req, res) => {
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        if (!user) {
            // Se for usuário novo via OAuth, cria credenciais sob salt fixado para derivar chave mestra local posterior
            const placeholderSalt = crypto.randomBytes(16).toString('hex');
            const placeholderIv = crypto.randomBytes(12).toString('hex');
            const emptyProfile = JSON.stringify({ ciphertext: '', iv: placeholderIv });
            
            const stmt = db.prepare('INSERT INTO users (name, email, salt, google_id, auth_provider, encrypted_profile) VALUES (?, ?, ?, ?, ?, ?)');
            const info = stmt.run(payload.name, email, placeholderSalt, payload.sub, 'google', emptyProfile);
            user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, salt: user.salt, encryptedProfile: JSON.parse(user.encrypted_profile) });
    } catch (error) {
        res.status(400).json({ message: 'Token do Google inválido.' });
    }
});

module.exports = router;