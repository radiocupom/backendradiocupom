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

  // ================= CUPONS =================
  async countCupons(lojaId) {
    return prisma.cupom.count({
      where: { lojaId }
    });
  }

  async countCuponsAtivos(lojaId) {
    return prisma.cupom.count({
      where: {
        lojaId,
        dataExpiracao: { gt: new Date() }
      }
    });
  }

  // ================= RESGATES =================
  async countResgates(lojaId, filtros = {}) {
    return prisma.resgate.count({
      where: {
        cupom: { lojaId },
        ...filtros
      }
    });
  }

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

  // ================= QR CODES =================
  async countQrCodes(lojaId, validado = null) {
    const where = {
      cupom: { lojaId }
    };
    
    if (validado !== null) {
      where.validado = validado;
    }
    
    return prisma.qrCodeUsado.count({ where });
  }

  // ================= CLIENTES =================
  async countClientesUnicos(lojaId) {
    const clientes = await prisma.resgate.groupBy({
      by: ['clienteId'],
      where: {
        cupom: { lojaId }
      }
    });
    
    return clientes.length;
  }

  // ================= DADOS FINANCEIROS =================
  async getValorTotalResgatado(lojaId) {
    const cupons = await prisma.cupom.findMany({
      where: { 
        lojaId,
        precoOriginal: { not: null }
      }
    });

    return cupons.reduce((total, cupom) => total + (cupom.precoOriginal || 0), 0);
  }

  async getValorTotalVendido(lojaId) {
    const qrCodesValidados = await prisma.qrCodeUsado.findMany({
      where: { 
        validado: true,
        cupom: { lojaId }
      },
      include: { cupom: true }
    });

    return qrCodesValidados.reduce((total, qr) => {
      return total + (qr.cupom.precoComDesconto || qr.cupom.precoOriginal || 0);
    }, 0);
  }

  async getValorTotalEconomizado(lojaId) {
    const [valorTotal, valorVendido] = await Promise.all([
      this.getValorTotalResgatado(lojaId),
      this.getValorTotalVendido(lojaId)
    ]);
    return valorTotal - valorVendido;
  }

  async getTicketMedio(lojaId) {
    const resgatesValidados = await prisma.qrCodeUsado.count({
      where: { 
        validado: true,
        cupom: { lojaId }
      }
    });

    if (resgatesValidados === 0) return 0;

    const valorVendido = await this.getValorTotalVendido(lojaId);
    return valorVendido / resgatesValidados;
  }

  async getCuponsComPreco(lojaId) {
    return prisma.cupom.count({
      where: { 
        lojaId,
        precoOriginal: { not: null }
      }
    });
  }

  async getResgatesComValores(lojaId, limit = 10) {
    const resgates = await prisma.resgate.findMany({
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
            codigo: true,
            precoOriginal: true,
            precoComDesconto: true,
            percentualDesconto: true,
            nomeProduto: true
          }
        }
      },
      orderBy: {
        resgatadoEm: 'desc'
      },
      take: limit
    });

    return resgates.map(resgate => ({
      ...resgate,
      valorOriginal: resgate.cupom.precoOriginal || 0,
      valorPago: resgate.cupom.precoComDesconto || 0,
      economia: (resgate.cupom.precoOriginal || 0) - (resgate.cupom.precoComDesconto || 0)
    }));
  }

  // ================= ÚLTIMOS RESGATES =================
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
            codigo: true,
            precoOriginal: true,
            precoComDesconto: true,
            percentualDesconto: true,
            nomeProduto: true
          }
        }
      },
      orderBy: {
        resgatadoEm: 'desc'
      },
      take: limit
    });
  }

  // ================= CUPONS POPULARES =================
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

  // ================= RESGATES POR DIA =================
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
      _sum: {
        quantidade: true
      },
      orderBy: {
        resgatadoEm: 'asc'
      }
    });
    
    return resgates;
  }

  // ================= DADOS COMPLETOS =================
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
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      ticketMedio,
      cuponsComPreco,
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
      this.getValorTotalResgatado(lojaId),
      this.getValorTotalVendido(lojaId),
      this.getValorTotalEconomizado(lojaId),
      this.getTicketMedio(lojaId),
      this.getCuponsComPreco(lojaId),
      this.findUltimosResgates(lojaId, 5),
      this.findCuponsMaisResgatados(lojaId, 5),
      this.findResgatesPorDia(lojaId, dataInicioGrafico, new Date())
    ]);
    
    return {
      totais: {
        cupons: {
          total: totalCupons,
          ativos: cuponsAtivos,
          expirados: totalCupons - cuponsAtivos,
          comPreco: cuponsComPreco
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
        clientes: totalClientes,
        financeiro: {
          valorTotalResgatado,
          valorTotalVendido,
          valorTotalEconomizado,
          ticketMedio
        }
      },
      ultimosResgates,
      cuponsPopulares: cuponsPopulares.map(c => ({
        id: c.id,
        descricao: c.descricao,
        codigo: c.codigo,
        precoOriginal: c.precoOriginal,
        precoComDesconto: c.precoComDesconto,
        percentualDesconto: c.percentualDesconto,
        nomeProduto: c.nomeProduto,
        totalResgates: c._count.resgates,
        dataExpiracao: c.dataExpiracao
      })),
      resgatesPorDia
    };
  }
}

module.exports = DashboardLojaRepository;