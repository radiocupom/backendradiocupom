// src/modules/usuario/usuarioService.js
const prisma = require('../../database/prismaClient.cjs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cache = require('../../cache/cacheHelper');
const {
  createUsuario,
  findAllUsuarios,
  findUsuarioById,
  findUsuarioByEmail,
  findUsuarioByEmailWithLoja,
  updateUsuario,
  deleteUsuario,
} = require('./usuarioRepository');

// 🔥 Função utilitária para remover senha
const removeSenha = (usuario) => {
  if (!usuario) return null;
  const { senha, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
};

const criarUsuario = async (nome, email, senha, role = 'loja') => {
  // ✅ Validações básicas
  if (!nome || !email || !senha) {
    throw new Error('Nome, email e senha são obrigatórios');
  }
  
  if (senha.length < 6) {
    throw new Error('Senha deve ter no mínimo 6 caracteres');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Email inválido');
  }
  
  const existing = await findUsuarioByEmail(email);
  if (existing) throw new Error('Email já cadastrado');

  const hashedSenha = await bcrypt.hash(senha, 10);
  const usuario = await createUsuario({ 
    nome, 
    email, 
    senha: hashedSenha, 
    role 
  });
  
  // Invalida cache gravemente impactado por usuários novos
  await cache.delCacheByPrefix('usuarios:');

  return removeSenha(usuario);
};

const autenticar = async (email, senha) => {
  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios');
  }
  
  // 🔥 Busca usuário com dados da loja
  const usuario = await findUsuarioByEmailWithLoja(email);
  
  if (!usuario) throw new Error('Usuário não encontrado');

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) throw new Error('Senha incorreta');

  // 🔥 Token com dados completos
  const token = jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      role: usuario.role,
      lojaId: usuario.lojaId,
      loja: usuario.loja ? {
        id: usuario.loja.id,
        nome: usuario.loja.nome,
        payment: usuario.loja.payment
      } : null
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { 
    usuario: removeSenha(usuario), 
    token 
  };
};

// 🔥 Versões otimizadas com SELECT específico
const findAllUsuariosSemSenha = async () => {
  const cacheKey = 'usuarios:all';
  const cached = await cache.getCache(cacheKey);
  if (cached) return cached;

  const usuarios = await prisma.usuario.findMany({
    select: { // 🔥 SELECT específico
      id: true,
      nome: true,
      email: true,
      role: true,
      lojaId: true,
      createdAt: true,
      updatedAt: true,
      loja: {
        select: {
          id: true,
          nome: true,
          logo: true,
          payment: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  await cache.setCache(cacheKey, usuarios, 30);
  return usuarios;
};

const findUsuarioByIdSemSenha = async (id) => {
  const cacheKey = `usuarios:id:${id}`;
  const cached = await cache.getCache(cacheKey);
  if (cached) return cached;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { // 🔥 SELECT específico
      id: true,
      nome: true,
      email: true,
      role: true,
      lojaId: true,
      createdAt: true,
      updatedAt: true,
      loja: {
        select: {
          id: true,
          nome: true,
          logo: true,
          payment: true
        }
      }
    }
  });
  
  if (usuario) {
    await cache.setCache(cacheKey, usuario, 60);
  }
  return usuario;
};

// 🔥 Versão otimizada de update
const updateUsuarioCompleto = async (id, data) => {
  // Invalidate cache antes de atualizar
  await cache.delCacheByPrefix('usuarios:');

  // Se tiver senha, fazer hash
  if (data.senha) {
    if (data.senha.length < 6) {
      throw new Error('Senha deve ter no mínimo 6 caracteres');
    }
    data.senha = await bcrypt.hash(data.senha, 10);
  }

  const usuario = await updateUsuario(id, data);
  return removeSenha(usuario);
};

const deleteUsuarioCompleto = async (id) => {
  // Invalidate cache ao remover usuário
  await cache.delCacheByPrefix('usuarios:');
  return deleteUsuario(id);
};

module.exports = {
  criarUsuario,
  autenticar,
  findAllUsuarios: findAllUsuariosSemSenha,
  findUsuarioById: findUsuarioByIdSemSenha,
  updateUsuario: updateUsuarioCompleto,
  deleteUsuario: deleteUsuarioCompleto,
};