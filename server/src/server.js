// server/src/server.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Importar rotas
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const dossierRoutes = require('./routes/dossiers');
const projectRoutes = require('./routes/projects');
const notesRoutes = require('./routes/notes');
const syncRoutes = require('./routes/sync');

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/ping', function(req, res) {
    res.status(200).send('PONG');
});

// Erro 404 para API
app.use('/api/*', function(req, res) {
    res.status(404).json({ error: 'Rota não encontrada: ' + req.originalUrl });
});

// Erro global
app.use(function(err, req, res, next) {
    console.error('❌ Erro:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log('🚀 Servidor Violeta rodando na porta ' + PORT);
    console.log('📍 Health check: http://localhost:' + PORT + '/ping');
    console.log('📋 Rotas: auth, oauth, dossiers, projects, notes, sync');
});