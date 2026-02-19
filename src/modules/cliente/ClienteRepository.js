const prisma = require("../../database/prismaClient.cjs");

class ClienteRepository {
  // ... seus métodos existentes ...

  create(data) {
    return prisma.cliente.create({ data });
  }

  findAll() {
    return prisma.cliente.findMany();
  }

  findById(id) {
    return prisma.cliente.findUnique({ where: { id } });
  }

  findByEmail(email) {
    return prisma.cliente.findUnique({ where: { email } });
  }

  update(id, data) {
    return prisma.cliente.update({ where: { id }, data });
  }

  delete(id) {
    return prisma.cliente.delete({ where: { id } });
  }

  findWithResgates(id) {
    return prisma.cliente.findUnique({
      where: { id },
      include: {
        resgates: {
          include: {
            cupom: {
              include: {
                loja: {
                  select: { nome: true, logo: true }
                }
              }
            }
          },
          orderBy: { resgatadoEm: 'desc' }
        }
      }
    });
  }

  findEstatisticas(id) {
    return prisma.cliente.findUnique({
      where: { id },
      include: {
        resgates: {
          select: {
            id: true,
            quantidade: true,
            resgatadoEm: true,
            cupomId: true
          }
        }
      }
    });
  }

  // 🔥 NOVOS MÉTODOS:

  async findUsuarioWithLoja(userId) {
    return prisma.usuario.findUnique({
      where: { id: userId },
      include: { loja: true }
    });
  }

  async findClientesByLoja(lojaId) {
    return prisma.cliente.findMany({
      where: {
        resgates: {
          some: {
            cupom: {
              lojaId: lojaId
            }
          }
        }
      },
      include: {
        resgates: {
          where: {
            cupom: {
              lojaId: lojaId
            }
          },
          include: {
            cupom: true
          }
        }
      }
    });
  }
}

module.exports = ClienteRepository;