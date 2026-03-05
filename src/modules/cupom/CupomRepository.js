const prisma = require("../../database/prismaClient.cjs");

class CupomRepository {
  /**
   * Criar novo cupom
   */
  async create(data) {
    return prisma.cupom.create({ data });
  }

  /**
   * Listar todos os cupons
   */
  async findAll() {
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
        ativo: true,
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

  /**
   * Buscar cupom por ID
   */
  async findById(id) {
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
        ativo: true,
        lojaId: true,
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

  /**
   * Buscar cupom por ID com todas as relações para estatísticas
   */
  async findByIdWithStats(id) {
  return prisma.cupom.findUnique({
    where: { id },
    include: {
      loja: { select: { nome: true } },
      resgates: {
        select: {
          id: true,
          quantidade: true,
          resgatadoEm: true,
          clienteId: true,
          cupomId: true,
          cliente: { select: { nome: true, email: true } }
        },
        orderBy: { resgatadoEm: 'desc' }
      },
      qrCodesUsadosList: {
        where: { cupomId: id },
        select: {
          id: true,
          clienteId: true,
          cupomId: true,
          resgateId: true,  // ← ADICIONAR ESTE CAMPO!
          validado: true,
          validadoEm: true
        }
      }
    }
  });
}

  /**
   * Buscar cupons por loja
   */
  async findByLoja(lojaId) {
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
        ativo: true,
        createdAt: true,
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Buscar cupom por código
   */
  async findByCodigo(codigo) {
    return prisma.cupom.findUnique({
      where: { codigo }
    });
  }

  /**
   * Buscar cupons disponíveis (ativos, não expirados e com loja ativa)
   */
  async findDisponiveis() {
    const agora = new Date();
    
    return prisma.cupom.findMany({
      where: {
        ativo: true,
        dataExpiracao: { gt: agora },
        loja: { payment: true }
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
      orderBy: { dataExpiracao: 'asc' }
    });
  }

  /**
   * Atualizar cupom
   */
  async update(id, data) {
    return prisma.cupom.update({
      where: { id },
      data
    });
  }

  /**
   * Deletar cupom
   */
  async delete(id) {
    return prisma.cupom.delete({ where: { id } });
  }

  /**
   * Buscar loja pelo ID do usuário
   */
  async findLojaByUsuarioId(usuarioId) {
    return prisma.loja.findFirst({
      where: {
        usuario: { id: usuarioId }
      }
    });
  }

  /**
   * Buscar loja por ID
   */
  async findLojaById(lojaId) {
    return prisma.loja.findUnique({
      where: { id: lojaId }
    });
  }
}

module.exports = CupomRepository;