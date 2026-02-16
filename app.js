const express = require("express");
const cors = require("cors"); // Importar o CORS
const lojaRouter = require('./src/modules/loja/lojaRouter');
const usuarioRouter = require('./src/modules/usuario/usuarioRouter');
const clienteRouter = require('./src/modules/cliente/ClienteRouter');
const cupomRouter = require('./src/modules/cupom/CupomRouter');
const frontRouter = require('./src/modules/front/FrontRouter');
const authRoutes = require('./src/modules/auth/authRouter');

const app = express();

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000', // URL do seu frontend
  credentials: true, // Permitir envio de cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

app.use('/api/auth', authRoutes);  
app.use('/api/lojas', lojaRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/clientes', clienteRouter);
app.use('/api/cupons', cupomRouter);
app.use('/api/front', frontRouter);

module.exports = app;