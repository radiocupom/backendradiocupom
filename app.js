const express = require("express");
const path = require("path");
const cors = require("cors");
const lojaRouter = require('./src/modules/loja/lojaRouter');
const usuarioRouter = require('./src/modules/usuario/usuarioRouter');
const clienteRouter = require('./src/modules/cliente/ClienteRouter');
const cupomRouter = require('./src/modules/cupom/CupomRouter');
const frontRouter = require('./src/modules/front/FrontRouter');
const dashboardRouter = require('./src/modules/dashboard/dashboard.routes');
const dashboardLojaRouter = require('./src/modules/dashboardLoja/dashboardLojaRouter');
const { router: logsRouter } = require('./src/modules/logs/logsRouter');
const { interceptConsole } = require('./src/middlewares/logInterceptor');
const requestLogger = require('./src/middlewares/requestLogger'); // ← FALTAVA ESSA LINHA!
const authRoutes = require('./src/modules/auth/authRouter');

const app = express();

// Ativar interceptor de logs do console (deve ser antes de tudo)
interceptConsole(); // ← FALTAVA ESSA LINHA!

// Configuração do CORS
// Configuração do CORS - AGORA ACEITANDO MÚLTIPLAS PORTAS
app.use(cors({
  origin: function(origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002'
    ];
    
    // Permitir requisições sem origin (como Postman, Insomnia)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Logger de requisições HTTP
app.use(requestLogger);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);  
app.use('/api/lojas', lojaRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/clientes', clienteRouter);
app.use('/api/cupons', cupomRouter);
app.use('/api/front', frontRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dashboard-loja', dashboardLojaRouter);
app.use('/api/logs', logsRouter);

module.exports = app;