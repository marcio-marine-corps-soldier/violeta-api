// server/src/routes/notes.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// Listar anotações
router.get('/', (req, res) => {
    try {
        const notes = db.prepare(
            'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC'
        ).all(req.userId);
        
        const result = notes.map(n => {
            try {
                const data = JSON.parse(n.encrypted_data);
                return {
                    id: n.id,
                    title: data.title || 'Sem título',
                    content: data.content || '',
                    date: data.date || '',
                    createdAt: n.created_at
                };
            } catch(e) {
                return { id: n.id, title: 'Erro ao carregar', content: '' };
            }
        });
        
        res.json(result);
    } catch (err) {
        console.error('Erro ao listar anotações:', err);
        res.status(500).json({ error: 'Erro ao carregar anotações' });
    }
});

// Criar anotação
router.post('/', (req, res) => {
    try {
        const { title, content, date } = req.body;
        
        if (!title && !content) {
            return res.status(400).json({ error: 'Título ou conteúdo é obrigatório' });
        }
        
        const noteId = 'n_' + Date.now();
        const encryptedData = JSON.stringify({
            title: title || 'Sem título',
            content: content || '',
            date: date || new Date().toISOString().split('T')[0]
        });
        
        db.prepare(
            'INSERT INTO notes (id, user_id, encrypted_data, created_at) VALUES (?, ?, ?, ?)'
        ).run(noteId, req.userId, encryptedData, new Date().toISOString());
        
        res.json({ success: true, id: noteId });
    } catch (err) {
        console.error('Erro ao criar anotação:', err);
        res.status(500).json({ error: 'Erro ao criar anotação' });
    }
});

// Excluir anotação
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare(
            'DELETE FROM notes WHERE id = ? AND user_id = ?'
        ).run(req.params.id, req.userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Anotação não encontrada' });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir anotação:', err);
        res.status(500).json({ error: 'Erro ao excluir anotação' });
    }
});

// ⚠️ IMPORTANTE: Exportar o ROUTER, não um objeto
module.exports = router;