// src/middlewares/auth.js
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'sua_chave_super_secreta';

function authenticateToken(req, res, next) {
  // 🔒 APENAS do header - forma segura e padrão
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Verificar se o token foi enviado
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido. Envie no header Authorization: Bearer <token>' });
  }

  // Verificar formato (deve ser Bearer)
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato inválido. Use: Authorization: Bearer <token>' });
  }

  // Verificar se o token é válido
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error('Erro na verificação do token:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Token expirado. Faça login novamente.' });
      }
      
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    // Token válido - adiciona usuário à requisição
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, SECRET };