const prisma = require("../../database/prismaClient.cjs");

class CupomRepository {
  create(data) {
    return prisma.cupom.create({ data });
  }

  findAll() {
    return prisma.cupom.findMany({
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            logo: true,
            payment: true
          }
        },
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(id) {
    return prisma.cupom.findUnique({
      where: { id },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            logo: true,
            payment: true
          }
        },
        _count: {
          select: { resgates: true }
        }
      }
    });
  }

  findByLoja(lojaId) {
    return prisma.cupom.findMany({
      where: { lojaId },
      include: {
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findByCodigo(codigo) {
    return prisma.cupom.findUnique({
      where: { codigo }
    });
  }

  update(id, data) {
    return prisma.cupom.update({
      where: { id },
      data
    });
  }

  delete(id) {
    return prisma.cupom.delete({ where: { id } });
  }

  findDisponiveis() {
    return prisma.cupom.findMany({
      where: {
        dataExpiracao: {
          gt: new Date()
        },
        loja: {
          payment: true
        }
      },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            logo: true
          }
        }
      },
      orderBy: {
        dataExpiracao: 'asc'
      }
    });
  }
}

module.exports = CupomRepository;