// server/src/middleware/encryption.js
module.exports = (req, res, next) => {
    // Garantir estritamente que os payloads criptografados enviados do cliente possuem o formato esperado
    const { encryptedData, iv } = req.body;
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.path.includes('/dossiers') || req.path.includes('/sync')) {
            if (!encryptedData || !iv) {
                return res.status(400).json({ message: 'Formato de carga criptografada inválido.' });
            }
        }
    }
    next();
};