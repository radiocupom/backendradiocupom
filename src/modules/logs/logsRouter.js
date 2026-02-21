const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');

// Armazena as conexões ativas
let clients = [];

/**
 * @route   GET /api/logs/stream
 * @desc    Stream de logs em tempo real (SSE)
 * @access  Private (superadmin)
 */
router.get('/stream', 
  authenticateToken, 
  authorizeRoles('superadmin'),
  (req, res) => {
    console.log('📡 Nova conexão SSE recebida');
    console.log('   - Usuário:', req.user.id);
    console.log('   - Role:', req.user.role);
    
    // Configurar headers para SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000'
    });
    
    // Enviar keep-alive a cada 30 segundos
    const intervalId = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);
    
    // Adicionar cliente à lista
    const clientId = Date.now();
    const newClient = {
      id: clientId,
      res
    };
    clients.push(newClient);
    
    console.log(`🟢 Cliente ${clientId} conectado ao stream de logs`);
    
    // Enviar mensagem de boas-vindas
    const welcomeLog = {
      type: 'info',
      level: 'info',
      message: 'Conectado ao stream de logs',
      timestamp: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(welcomeLog)}\n\n`);
    
    // Remover cliente quando a conexão fechar
    req.on('close', () => {
      console.log(`🔴 Cliente ${clientId} desconectado`);
      clients = clients.filter(client => client.id !== clientId);
      clearInterval(intervalId);
    });
  }
);

/**
 * Função para enviar logs para todos os clientes conectados
 */
function enviarLog(log) {
  clients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(log)}\n\n`);
    } catch (err) {
      console.error('Erro ao enviar log para cliente:', err);
      // Remove cliente com erro
      clients = clients.filter(c => c.id !== client.id);
    }
  });
}

module.exports = { router, enviarLog };