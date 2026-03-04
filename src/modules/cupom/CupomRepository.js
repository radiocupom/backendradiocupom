const prisma = require("../../database/prismaClient.cjs");

class CupomRepository {
  create(data) {
    return prisma.cupom.create({ data });
  }

  // 🔥 VERSÃO OTIMIZADA
  findAll() {
    return prisma.cupom.findMany({
      select: {
        id: true,
        codigo: true,
        descricao: true,
        quantidadePorCliente: true,
        dataExpiracao: true,
        logo: true,
        precoOriginal: true,
        precoComDesconto: true,
        percentualDesconto: true,
        nomeProduto: true,
        totalQrCodes: true,
        qrCodesUsados: true,
        createdAt: true,
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

  // 🔥 VERSÃO OTIMIZADA
  findById(id) {
    return prisma.cupom.findUnique({
      where: { id },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        quantidadePorCliente: true,
        dataExpiracao: true,
        logo: true,
        precoOriginal: true,
        precoComDesconto: true,
        percentualDesconto: true,
        nomeProduto: true,
        totalQrCodes: true,
        qrCodesUsados: true,
        createdAt: true,
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

  // 🔥 VERSÃO OTIMIZADA
  findByLoja(lojaId) {
    return prisma.cupom.findMany({
      where: { lojaId },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        quantidadePorCliente: true,
        dataExpiracao: true,
        logo: true,
        precoOriginal: true,
        precoComDesconto: true,
        percentualDesconto: true,
        nomeProduto: true,
        totalQrCodes: true,
        qrCodesUsados: true,
        createdAt: true,
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

  // 🔥 VERSÃO OTIMIZADA
  findDisponiveis() {
    const agora = new Date();
    
    return prisma.cupom.findMany({
      where: {
        dataExpiracao: {
          gt: agora
        },
        loja: {
          payment: true
        }
      },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        quantidadePorCliente: true,
        dataExpiracao: true,
        logo: true,
        precoOriginal: true,
        precoComDesconto: true,
        percentualDesconto: true,
        nomeProduto: true,
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