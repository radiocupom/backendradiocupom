const express = require("express");
const path = require("path"); // ← ADICIONAR!
const cors = require("cors");
const lojaRouter = require('./src/modules/loja/lojaRouter');
const usuarioRouter = require('./src/modules/usuario/usuarioRouter');
const clienteRouter = require('./src/modules/cliente/ClienteRouter');
const cupomRouter = require('./src/modules/cupom/CupomRouter');
const frontRouter = require('./src/modules/front/FrontRouter');
const dashboardRouter = require('./src/modules/dashboard/dashboard.routes');
const dashboardLojaRouter = require('./src/modules/dashboardLoja/dashboardLojaRouter');
const authRoutes = require('./src/modules/auth/authRouter');

const app = express();

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🔥 IMPORTANTE: Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());

app.use('/api/auth', authRoutes);  
app.use('/api/lojas', lojaRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/clientes', clienteRouter);
app.use('/api/cupons', cupomRouter);
app.use('/api/front', frontRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dashboard-loja', dashboardLojaRouter);


module.exports = app;