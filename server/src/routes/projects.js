// server/src/routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// Listar projetos
router.get('/', (req, res) => {
    try {
        const projects = db.prepare(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC'
        ).all(req.userId);
        
        // Descriptografar dados
        const result = projects.map(p => {
            try {
                const data = JSON.parse(p.encrypted_data);
                return {
                    id: p.id,
                    name: data.name || 'Sem nome',
                    description: data.description || '',
                    status: data.status || 'in-progress',
                    priority: data.priority || 'medium',
                    relatedDossier: data.relatedDossier || '',
                    createdAt: p.created_at
                };
            } catch(e) {
                return { id: p.id, name: 'Erro ao carregar', description: '' };
            }
        });
        
        res.json(result);
    } catch (err) {
        console.error('Erro ao listar projetos:', err);
        res.status(500).json({ error: 'Erro ao carregar projetos' });
    }
});

// Criar projeto
router.post('/', (req, res) => {
    try {
        const { name, description, status, priority, relatedDossier } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
        }
        
        const projectId = 'p_' + Date.now();
        const encryptedData = JSON.stringify({
            name,
            description: description || '',
            status: status || 'in-progress',
            priority: priority || 'medium',
            relatedDossier: relatedDossier || ''
        });
        
        db.prepare(
            'INSERT INTO projects (id, user_id, encrypted_data, created_at) VALUES (?, ?, ?, ?)'
        ).run(projectId, req.userId, encryptedData, new Date().toISOString());
        
        res.json({ success: true, id: projectId });
    } catch (err) {
        console.error('Erro ao criar projeto:', err);
        res.status(500).json({ error: 'Erro ao criar projeto' });
    }
});

// Excluir projeto
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare(
            'DELETE FROM projects WHERE id = ? AND user_id = ?'
        ).run(req.params.id, req.userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir projeto:', err);
        res.status(500).json({ error: 'Erro ao excluir projeto' });
    }
});

module.exports = router;