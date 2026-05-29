// server/src/database.js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'violeta.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tabela de usuários
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        salt TEXT NOT NULL,
        google_id TEXT UNIQUE,
        auth_provider TEXT DEFAULT 'email',
        encrypted_profile TEXT NOT NULL,
        totp_secret TEXT,
        totp_enabled INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );
`);

// Tabela de dossiês (estrutura COMPLETA)
db.exec(`
    CREATE TABLE IF NOT EXISTS dossiers (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        code TEXT NOT NULL DEFAULT '',
        category TEXT DEFAULT '',
        type TEXT DEFAULT '',
        description TEXT DEFAULT '',
        classification TEXT DEFAULT 'Público',
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'medium',
        dateCreated TEXT DEFAULT '',
        dateExpected TEXT DEFAULT '',
        dateCompleted TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        observations TEXT DEFAULT '',
        checklist TEXT DEFAULT '[]',
        archived INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

// Tabela de projetos
db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        encrypted_data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

// Tabela de anotações
db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        encrypted_data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

// Tabela de auditoria
db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

console.log('✅ Banco de dados inicializado com sucesso');
console.log('📋 Tabelas: users, dossiers, projects, notes, audit_log');

module.exports = db;