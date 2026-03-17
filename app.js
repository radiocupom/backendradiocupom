require('dotenv').config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const lojaRouter = require('./src/modules/loja/lojaRouter');
const usuarioRouter = require('./src/modules/usuario/usuarioRouter');
const clienteRouter = require('./src/modules/cliente/ClienteRouter');
const cupomRouter = require('./src/modules/cupom/CupomRouter');
const frontRouter = require('./src/modules/front/FrontRouter');
const dashboardRouter = require('./src/modules/dashboard/dashboard.routes');
const dashboardLojaRouter = require('./src/modules/dashboardLoja/dashboardLojaRouter');
const dashboardClienteRouter = require('./src/modules/clienteDashboard/dashboard.routes');
const { router: logsRouter } = require('./src/modules/logs/logsRouter');
const { interceptConsole } = require('./src/middlewares/logInterceptor');
const requestLogger = require('./src/middlewares/requestLogger'); 
const authRoutes = require('./src/modules/auth/authRouter');

const app = express();

// Ativar interceptor de logs do console
interceptConsole();

// CONFIGURAÇÃO CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ CONFIGURAÇÃO TRUST PROXY (resolve o erro do rate limit)
app.set('trust proxy', 1); // Para 1 proxy (Nginx, Heroku, etc)

// ================= RATE LIMITING GLOBAL =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP a cada 15 minutos
  message: { 
    success: false, 
    error: 'Muitas requisições deste IP, tente novamente após 15 minutos' 
  },
  standardHeaders: true, // Retorna headers RateLimit-*
  legacyHeaders: false,  // Desativa headers X-RateLimit-*
  skipSuccessfulRequests: false, // Conta todas as requisições
});

// Aplica rate limiting global para TODAS as rotas /api
app.use('/api', limiter);

// ================= RATE LIMITING ESPECÍFICO PARA LOGIN =================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // apenas 5 tentativas de login por IP
  message: { 
    success: false, 
    error: 'Muitas tentativas de login, tente novamente após 15 minutos' 
  },
  skipSuccessfulRequests: true, // Não conta se o login for bem-sucedido
});

// Aplica rate limiting específico para rota de login
app.use('/api/auth/login', loginLimiter);

// ================= RATE LIMITING PARA ROTAS SENSÍVEIS =================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requisições por minuto
  message: { 
    success: false, 
    error: 'Muitas requisições, aguarde um minuto' 
  },
});

// Aplica para rotas de dashboard (mais pesadas)
app.use('/api/dashboard', apiLimiter);
app.use('/api/dashboard-loja', apiLimiter);

// Logger de requisições HTTP
app.use(requestLogger);

// Middleware de debug (opcional)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - Origem: ${req.headers.origin || 'desconhecida'}`);
  next();
});

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());

// ROTA DE TESTE HELLO WORLD
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello World!',
    status: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.send('✅ API funcionando corretamente!');
});

app.get('/api/hello', (req, res) => {
  res.json({ 
    msg: 'Hello World!',
    data: new Date().toLocaleString('pt-BR')
  });
});

// Rotas
app.use('/api/auth', authRoutes);  
app.use('/api/lojas', lojaRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/clientes', clienteRouter);
app.use('/api/cupons', cupomRouter);
app.use('/api/front', frontRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dashboard-loja', dashboardLojaRouter);
app.use('/api/dashboard/cliente', dashboardClienteRouter);
app.use('/api/logs', logsRouter);

module.exports = app;