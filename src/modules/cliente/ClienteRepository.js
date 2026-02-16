const prisma = require("../../database/prismaClient.cjs");

class ClienteRepository {
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

  // Buscar cliente com seus resgates
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

  // Buscar estatísticas do cliente
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
}

module.exports = ClienteRepository;