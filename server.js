const app = require("./app");
const http = require('http');
const setupWebSocketServer = require('./src/websocket/websocketServer');

const PORT = process.env.PORT || 3003;
const server = http.createServer(app);

// Configurar WebSocket
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`WebSocket rodando em ws://localhost:${PORT}/ws/logs`);
});