// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token inválido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // IMPORTANTE: o token contém { id: 1, email: "..." }
        req.userId = decoded.id;
        
        console.log('✅ Auth OK - userId:', req.userId);
        next();
    } catch (err) {
        console.error('❌ Token inválido:', err.message);
        return res.status(401).json({ error: 'Token expirado ou inválido' });
    }
};