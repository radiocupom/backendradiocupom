// src/modules/auth/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail } = require('./authRepository');

const autenticar = async (email, senha) => {
  // Validações
  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios');
  }
  
  // Buscar usuário
  const usuario = await findUserByEmail(email);
  if (!usuario) throw new Error('Usuário não encontrado');

  // Verificar senha
  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) throw new Error('Senha incorreta');

  // Verificar JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET não definido!');
    throw new Error('Erro de configuração do servidor');
  }

  // Gerar token
  const token = jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      role: usuario.role 
    },
    jwtSecret,
    { expiresIn: '8h' } // Aumentei para 8 horas
  );

  // Não retornar a senha
  const { senha: _, ...usuarioSemSenha } = usuario;
  
  return { 
    usuario: usuarioSemSenha, 
    token,
    expiresIn: '8h'
  };
};

module.exports = {
  autenticar
};