const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/logs' });

  wss.on('connection', (ws, req) => {
    try {
      // Pega o token da query string (primeiro handshake apenas)
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const token = urlParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Token não fornecido');
        return;
      }

      // Verifica o token
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err || user.role !== 'superadmin') {
          ws.close(1008, 'Acesso negado');
          return;
        }

        console.log(`🟢 Superadmin ${user.id} conectado ao WebSocket`);
        ws.userId = user.id;
        ws.role = user.role;

        // Envia mensagem de boas-vindas
        ws.send(JSON.stringify({
          type: 'info',
          level: 'info',
          message: 'Conectado ao stream de logs',
          timestamp: new Date().toISOString()
        }));

        // Adiciona à lista de clientes
        global.logClients = global.logClients || [];
        global.logClients.push(ws);

        ws.on('close', () => {
          console.log(`🔴 Superadmin ${user.id} desconectado`);
          global.logClients = global.logClients.filter(client => client !== ws);
        });
      });
    } catch (error) {
      console.error('Erro na conexão WebSocket:', error);
      ws.close(1011, 'Erro interno');
    }
  });

  // Função para enviar logs para todos os clientes
  global.sendLog = (log) => {
    if (global.logClients) {
      const message = JSON.stringify(log);
      global.logClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  };

  return wss;
}

module.exports = setupWebSocketServer;