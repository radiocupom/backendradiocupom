// src/modules/usuario/usuarioController.js
const {
  criarUsuario,
  autenticar,  // ← Isso agora retorna { usuario, token }
  findAllUsuarios,
  findUsuarioById,
  updateUsuario,
  deleteUsuario,
} = require('./usuarioService');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;
    const usuario = await criarUsuario(nome, email, senha, role);
    
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(201).json(usuarioSemSenha);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ MÉTODO LOGIN AJUSTADO (se existir no controller de usuário)
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const { usuario, token } = await autenticar(email, senha);
    
    res.json({ 
      message: 'Login realizado com sucesso',
      usuario,
      token 
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const usuarios = await findAllUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await findUsuarioById(id);
    if (!usuario) throw new Error('Usuário não encontrado');
    res.json(usuario);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 10);
    }
    
    const usuarioAtualizado = await updateUsuario(id, data);
    const { senha, ...usuarioSemSenha } = usuarioAtualizado;
    res.json(usuarioSemSenha);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUsuario(id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getPerfil = async (req, res) => {
  try {
    const usuario = await findUsuarioById(req.user.id);
    if (!usuario) throw new Error('Usuário não encontrado');
    res.json(usuario);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,  // ← Se você tiver rota de login no usuário
  getAll,
  getById,
  update,
  getPerfil,
  remove,
};