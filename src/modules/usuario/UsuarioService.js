// src/modules/usuario/usuarioService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  createUsuario,
  findAllUsuarios,
  findUsuarioById,
  findUsuarioByEmail,
  findUsuarioByEmailWithLoja, // ← ADICIONADO!
  updateUsuario,
  deleteUsuario,
} = require('./usuarioRepository');

const criarUsuario = async (nome, email, senha, role = 'loja') => { // ← role padrão 'loja'
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
  const usuario = await createUsuario({ nome, email, senha: hashedSenha, role });
  
  // ✅ Não retornar a senha
  const { senha: _, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
};

const autenticar = async (email, senha) => {
  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios');
  }
  
  // 🔥 AGORA USA O MÉTODO QUE TRAZ A LOJA JUNTO!
  const usuario = await findUsuarioByEmailWithLoja(email);
  
  if (!usuario) throw new Error('Usuário não encontrado');

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) throw new Error('Senha incorreta');

  // 🔥 TOKEN AGORA INCLUI O lojaId
  const token = jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      role: usuario.role,
      lojaId: usuario.lojaId
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' } // ← AUMENTADO PARA 8 HORAS
  );

  // ✅ Não retornar a senha
  const { senha: _, ...usuarioSemSenha } = usuario;
  return { usuario: usuarioSemSenha, token };
};

// ✅ Wrapper para remover senhas automaticamente
const findAllUsuariosSemSenha = async () => {
  const usuarios = await findAllUsuarios();
  return usuarios.map(({ senha, ...rest }) => rest);
};

const findUsuarioByIdSemSenha = async (id) => {
  const usuario = await findUsuarioById(id);
  if (!usuario) return null;
  const { senha, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
};

module.exports = {
  criarUsuario,
  autenticar,
  findAllUsuarios: findAllUsuariosSemSenha,
  findUsuarioById: findUsuarioByIdSemSenha,
  updateUsuario,
  deleteUsuario,
};