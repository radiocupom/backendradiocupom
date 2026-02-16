// src/modules/usuario/usuarioRepository.js
const prisma = require('../../database/prismaClient.cjs');

const createUsuario = (data) => prisma.usuario.create({ data });
const findAllUsuarios = () => prisma.usuario.findMany();
const findUsuarioById = (id) => prisma.usuario.findUnique({ where: { id } });
const findUsuarioByEmail = (email) => prisma.usuario.findUnique({ where: { email } });
const updateUsuario = (id, data) => prisma.usuario.update({ where: { id }, data });
const deleteUsuario = (id) => prisma.usuario.delete({ where: { id } });

module.exports = {
  createUsuario,
  findAllUsuarios,
  findUsuarioById,
  findUsuarioByEmail,
  updateUsuario,
  deleteUsuario,
};
