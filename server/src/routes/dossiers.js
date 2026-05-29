// server/src/routes/dossiers.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// Listar dossiers ativos
router.get('/', (req, res) => {
    try {
        const dossiers = db.prepare(
            "SELECT * FROM dossiers WHERE user_id = ? AND archived = 0 AND deleted = 0 ORDER BY created_at DESC"
        ).all(req.userId);
        res.json(dossiers);
    } catch (err) {
        console.error('Erro ao listar:', err);
        res.status(500).json({ error: 'Erro ao carregar dossiers' });
    }
});

// Criar dossier
router.post('/', (req, res) => {
    try {
        const data = req.body;
        const id = data.id || ('d_' + Date.now());
        db.prepare(`
            INSERT INTO dossiers (id, user_id, name, code, category, type, description, classification, status, priority, dateCreated, dateExpected, dateCompleted, tags, observations, checklist, archived, deleted, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))
        `).run(
            id,
            req.userId,
            data.name || '',
            data.code || '',
            data.category || '',
            data.type || '',
            data.description || '',
            data.classification || '',
            data.status || 'active',
            data.priority || 'medium',
            data.dateCreated || '',
            data.dateExpected || '',
            data.dateCompleted || '',
            JSON.stringify(data.tags || []),
            data.observations || '',
            JSON.stringify(data.checklist || [])
        );
        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Erro ao criar:', err);
        res.status(500).json({ error: 'Erro ao criar dossier' });
    }
});

// Atualizar dossier
router.put('/:id', (req, res) => {
    try {
        const data = req.body;
        db.prepare(`
            UPDATE dossiers SET 
                name=?, code=?, category=?, type=?, description=?, 
                classification=?, status=?, priority=?, 
                dateCreated=?, dateExpected=?, dateCompleted=?, 
                tags=?, observations=?, checklist=?,
                updated_at=datetime('now')
            WHERE id=? AND user_id=?
        `).run(
            data.name || '', data.code || '', data.category || '', data.type || '',
            data.description || '', data.classification || '', data.status || 'active',
            data.priority || 'medium', data.dateCreated || '', data.dateExpected || '',
            data.dateCompleted || '', JSON.stringify(data.tags || []),
            data.observations || '', JSON.stringify(data.checklist || []),
            req.params.id, req.userId
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar:', err);
        res.status(500).json({ error: 'Erro ao atualizar dossier' });
    }
});

// Soft delete (mover para lixeira)
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare(
            "UPDATE dossiers SET deleted=1, updated_at=datetime('now') WHERE id=? AND user_id=?"
        ).run(req.params.id, req.userId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Dossiê não encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir:', err);
        res.status(500).json({ error: 'Erro ao excluir dossier' });
    }
});

// Arquivar
router.patch('/:id/archive', (req, res) => {
    try {
        const result = db.prepare(
            "UPDATE dossiers SET archived=1, updated_at=datetime('now') WHERE id=? AND user_id=?"
        ).run(req.params.id, req.userId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Dossiê não encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao arquivar:', err);
        res.status(500).json({ error: 'Erro ao arquivar dossier' });
    }
});

// Restaurar (da lixeira ou arquivo)
router.patch('/:id/restore', (req, res) => {
    try {
        const result = db.prepare(
            "UPDATE dossiers SET archived=0, deleted=0, updated_at=datetime('now') WHERE id=? AND user_id=?"
        ).run(req.params.id, req.userId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Dossiê não encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao restaurar:', err);
        res.status(500).json({ error: 'Erro ao restaurar dossier' });
    }
});

// Listar arquivados
router.get('/archived', (req, res) => {
    try {
        const dossiers = db.prepare(
            "SELECT * FROM dossiers WHERE user_id=? AND archived=1 AND deleted=0"
        ).all(req.userId);
        res.json(dossiers);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar arquivados' });
    }
});

// Listar lixeira
router.get('/trash', (req, res) => {
    try {
        const dossiers = db.prepare(
            "SELECT * FROM dossiers WHERE user_id=? AND deleted=1"
        ).all(req.userId);
        res.json(dossiers);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar lixeira' });
    }
});

// Esvaziar lixeira
router.delete('/trash/empty', (req, res) => {
    try {
        db.prepare("DELETE FROM dossiers WHERE user_id=? AND deleted=1").run(req.userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao esvaziar lixeira' });
    }
});

module.exports = router;