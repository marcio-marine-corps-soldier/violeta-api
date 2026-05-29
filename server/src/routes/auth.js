// server/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database');

// Obter salt do usuário
router.get('/salt/:email', (req, res) => {
    try {
        const user = db.prepare('SELECT salt FROM users WHERE email = ?').get(req.params.email);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ salt: user.salt });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar salt' });
    }
});

// Registro
router.post('/register', (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validação
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        // Verificar se e-mail já existe
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        // Gerar salt e hash
        const salt = crypto.randomBytes(16).toString('hex');
        const passHash = bcrypt.hashSync(password, 10);

        // Perfil criptografado (simples, depois o frontend melhora)
        const encryptedProfile = JSON.stringify({ name, email });

        // Inserir usuário
        const result = db.prepare(
            'INSERT INTO users (name, email, password, salt, encrypted_profile, auth_provider) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(name, email, passHash, salt, encryptedProfile, 'email');

        // Gerar token
        const token = jwt.sign(
            { id: result.lastInsertRowid, email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: result.lastInsertRowid,
                name,
                email
            },
            salt
        });

    } catch (err) {
        console.error('Erro no registro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuário
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            salt: user.salt,
            encryptedProfile: JSON.parse(user.encrypted_profile || '{}')
        });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;