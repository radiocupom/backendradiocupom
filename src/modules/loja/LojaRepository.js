// src/modules/loja/lojaRepository.js - VERSÃO OTIMIZADA
const prisma = require("../../database/prismaClient.cjs");

class LojaRepository {
  create(data) {
    return prisma.loja.create({ data });
  }

  findAll() {
    return prisma.loja.findMany({
      select: { // 🔥 SELECT específico
        id: true,
        nome: true,
        email: true,
        logo: true,
        payment: true,
        categoria: true,
        descricao: true,
        createdAt: true,
        updatedAt: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        _count: {
          select: { cupons: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(id) {
    return prisma.loja.findUnique({ 
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        logo: true,
        payment: true,
        categoria: true,
        descricao: true,
        createdAt: true,
        updatedAt: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        _count: {
          select: { cupons: true }
        }
      }
    });
  }

  findByIdCompleto(id) {
    return prisma.loja.findUnique({ 
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        cupons: {
          select: {
            id: true,
            codigo: true,
            descricao: true,
            dataExpiracao: true,
            _count: {
              select: {
                resgates: true
              }
            }
          }
        }
      }
    });
  }

  findByEmail(email) {
    return prisma.loja.findUnique({ 
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        payment: true
      }
    });
  }

  findFirstByUsuarioId(usuarioId) {
    return prisma.loja.findFirst({
      where: { 
        usuario: {
          id: usuarioId
        }
      },
      include: {
        usuario: true
      }
    });
  }

  update(id, data) {
    return prisma.loja.update({ 
      where: { id }, 
      data 
    });
  }

  delete(id) {
    return prisma.loja.delete({ where: { id } });
  }
}

module.exports = LojaRepository;