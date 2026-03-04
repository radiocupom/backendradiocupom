// src/middlewares/authCliente.js
const jwt = require('jsonwebtoken');

const SECRET_CLIENTE = process.env.JWT_SECRET_CLIENTE;

if (!SECRET_CLIENTE) {
  console.error('❌ JWT_SECRET_CLIENTE não definido no .env');
}

const authenticateCliente = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'Faça login para continuar'
    });
  }

  jwt.verify(token, SECRET_CLIENTE, (err, decoded) => {
    if (err) {
      console.error('Erro na verificação do token do cliente:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          message: 'Faça login novamente'
        });
      }
      
      return res.status(403).json({ 
        error: 'Token inválido',
        message: 'Token de autenticação inválido'
      });
    }
    
    // Adicionar dados do cliente à requisição
    req.cliente = {
      id: decoded.id,
      email: decoded.email,
      tipo: 'cliente'
    };
    
    next();
  });
};

module.exports = {
  authenticateCliente,
  SECRET_CLIENTE
};