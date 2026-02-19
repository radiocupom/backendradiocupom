const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DashboardLojaRepository {
  /**
   * Busca loja pelo ID do usuário
   */
  async findLojaByUsuarioId(usuarioId) {
    return prisma.loja.findFirst({
      where: { 
        usuario: {
          id: usuarioId
        }
      }
    });
  }

  /**
   * Conta total de cupons da loja
   */
  async countCupons(lojaId) {
    return prisma.cupom.count({
      where: { lojaId }
    });
  }

  /**
   * Conta cupons ativos (não expirados)
   */
  async countCuponsAtivos(lojaId) {
    return prisma.cupom.count({
      where: {
        lojaId,
        dataExpiracao: { gt: new Date() }
      }
    });
  }

  /**
   * Conta total de resgates da loja
   */
  async countResgates(lojaId, filtros = {}) {
    return prisma.resgate.count({
      where: {
        cupom: { lojaId },
        ...filtros
      }
    });
  }

  /**
   * Conta resgates por período
   */
  async countResgatesPorPeriodo(lojaId, dataInicio, dataFim = new Date()) {
    return prisma.resgate.count({
      where: {
        cupom: { lojaId },
        resgatadoEm: {
          gte: dataInicio,
          lte: dataFim
        }
      }
    });
  }

  /**
   * Conta total de QR Codes da loja - CORRIGIDO: QrCodeUsado
   */
  async countQrCodes(lojaId, validado = null) {
    const where = {
      cupom: { lojaId }
    };
    
    if (validado !== null) {
      where.validado = validado;
    }
    
    return prisma.qrCodeUsado.count({ where });
  }

  /**
   * Conta clientes únicos da loja
   */
  async countClientesUnicos(lojaId) {
    const clientes = await prisma.resgate.groupBy({
      by: ['clienteId'],
      where: {
        cupom: { lojaId }
      }
    });
    
    return clientes.length;
  }

  /**
   * Busca últimos resgates com detalhes
   */
  async findUltimosResgates(lojaId, limit = 10) {
    return prisma.resgate.findMany({
      where: {
        cupom: { lojaId }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            whatsapp: true
          }
        },
        cupom: {
          select: {
            id: true,
            descricao: true,
            codigo: true
          }
        }
      },
      orderBy: {
        resgatadoEm: 'desc'
      },
      take: limit
    });
  }

  /**
   * Busca cupons mais resgatados
   */
  async findCuponsMaisResgatados(lojaId, limit = 5) {
    return prisma.cupom.findMany({
      where: { lojaId },
      include: {
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: {
        resgates: {
          _count: 'desc'
        }
      },
      take: limit
    });
  }

  /**
   * Busca resgates agrupados por dia
   */
  async findResgatesPorDia(lojaId, dataInicio, dataFim) {
    const resgates = await prisma.resgate.groupBy({
      by: ['resgatadoEm'],
      where: {
        cupom: { lojaId },
        resgatadoEm: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      _count: true,
      orderBy: {
        resgatadoEm: 'asc'
      }
    });
    
    return resgates;
  }

  /**
   * Busca dados completos em paralelo (para performance)
   */
  async findDadosCompletos(lojaId) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioMes = new Date(hoje);
    inicioMes.setDate(1);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const dataInicioGrafico = new Date();
    dataInicioGrafico.setDate(dataInicioGrafico.getDate() - 6);
    dataInicioGrafico.setHours(0, 0, 0, 0);
    
    const [
      totalCupons,
      cuponsAtivos,
      totalResgates,
      resgatesHoje,
      resgatesSemana,
      resgatesMes,
      totalQrCodes,
      qrCodesValidados,
      totalClientes,
      ultimosResgates,
      cuponsPopulares,
      resgatesPorDia
    ] = await Promise.all([
      this.countCupons(lojaId),
      this.countCuponsAtivos(lojaId),
      this.countResgates(lojaId),
      this.countResgatesPorPeriodo(lojaId, hoje),
      this.countResgatesPorPeriodo(lojaId, inicioSemana),
      this.countResgatesPorPeriodo(lojaId, inicioMes),
      this.countQrCodes(lojaId),
      this.countQrCodes(lojaId, true),
      this.countClientesUnicos(lojaId),
      this.findUltimosResgates(lojaId, 5),
      this.findCuponsMaisResgatados(lojaId, 5),
      this.findResgatesPorDia(lojaId, dataInicioGrafico, new Date())
    ]);
    
    return {
      totais: {
        cupons: {
          total: totalCupons,
          ativos: cuponsAtivos,
          expirados: totalCupons - cuponsAtivos
        },
        resgates: {
          total: totalResgates,
          hoje: resgatesHoje,
          semana: resgatesSemana,
          mes: resgatesMes
        },
        qrCodes: {
          total: totalQrCodes,
          validados: qrCodesValidados,
          pendentes: totalQrCodes - qrCodesValidados
        },
        clientes: totalClientes
      },
      ultimosResgates,
      cuponsPopulares: cuponsPopulares.map(c => ({
        id: c.id,
        descricao: c.descricao,
        codigo: c.codigo,
        totalResgates: c._count.resgates,
        dataExpiracao: c.dataExpiracao
      })),
      resgatesPorDia
    };
  }
}

module.exports = DashboardLojaRepository;