const prisma = require('../../database/prismaClient.cjs');

const createUsuario = (data) => prisma.usuario.create({ data });

const findAllUsuarios = () => prisma.usuario.findMany({
  select: {
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

const findUsuarioById = (id) => prisma.usuario.findUnique({ 
  where: { id },
  select: {
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

const findUsuarioByEmail = (email) => prisma.usuario.findUnique({ 
  where: { email } 
});

const findUsuarioByEmailWithLoja = (email) => prisma.usuario.findUnique({
  where: { email },
  include: {
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

const updateUsuario = (id, data) => prisma.usuario.update({ 
  where: { id }, 
  data 
});

const deleteUsuario = (id) => prisma.usuario.delete({ where: { id } });

module.exports = {
  createUsuario,
  findAllUsuarios,
  findUsuarioById,
  findUsuarioByEmail,
  findUsuarioByEmailWithLoja,
  updateUsuario,
  deleteUsuario,
};