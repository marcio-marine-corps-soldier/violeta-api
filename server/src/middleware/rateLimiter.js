// server/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: { message: 'Muitas requisições originadas deste IP.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: { message: 'Limite de tentativas de autenticação esgotado por esta hora.' }
});

module.exports = { generalLimiter, authLimiter };