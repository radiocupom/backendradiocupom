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

 /**
 * Conta QR codes por período com opção de filtro por validação
 */
async countQrCodesPorPeriodo(lojaId, dataInicio, dataFim = new Date(), validado = null) {
  const where = {
    cupom: { lojaId },
    usadoEm: {
      gte: dataInicio,
      lte: dataFim  // ← CORRIGIDO: usando dataFim em vez de DateTime
    }
  };
  
  if (validado !== null) {
    where.validado = validado;
  }
  
  return prisma.qrCodeUsado.count({ where });
}

  /**
   * Calcula a taxa de validação
   */
  async getTaxaValidacao(lojaId) {
    const total = await this.countQrCodes(lojaId);
    if (total === 0) return 0;
    
    const validados = await this.countQrCodes(lojaId, true);
    return (validados / total) * 100;
  }

  /**
   * Calcula o tempo médio entre resgate e validação (em horas)
   */
  async getTempoMedioValidacao(lojaId) {
    const qrCodes = await prisma.qrCodeUsado.findMany({
      where: {
        cupom: { lojaId },
        validado: true,
        validadoEm: { not: null }
      },
      select: {
        usadoEm: true,
        validadoEm: true
      }
    });

    if (qrCodes.length === 0) return 0;

    const totalHoras = qrCodes.reduce((acc, qr) => {
      const diffMs = new Date(qr.validadoEm) - new Date(qr.usadoEm);
      const diffHoras = diffMs / (1000 * 60 * 60);
      return acc + diffHoras;
    }, 0);

    return totalHoras / qrCodes.length;
  }

  /**
   * Busca estatísticas de validação de QR codes
   */
  async getQrCodeStats(lojaId) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);
    
    const inicioMes = new Date(hoje);
    inicioMes.setDate(hoje.getDate() - 30);

    const [
      totalResgatados,
      totalValidados,
      resgatadosHoje,
      validadosHoje,
      resgatadosSemana,
      validadosSemana,
      resgatadosMes,
      validadosMes,
      taxaValidacao,
      tempoMedioValidacao
    ] = await Promise.all([
      // Totais
      this.countQrCodes(lojaId),
      this.countQrCodes(lojaId, true),
      
    // Hoje
this.countQrCodesPorPeriodo(lojaId, hoje, new Date(), false),  // ← dataFim = new Date()
this.countQrCodesPorPeriodo(lojaId, hoje, new Date(), true),

// Semana
this.countQrCodesPorPeriodo(lojaId, inicioSemana, new Date(), false),
this.countQrCodesPorPeriodo(lojaId, inicioSemana, new Date(), true),

// Mês
this.countQrCodesPorPeriodo(lojaId, inicioMes, new Date(), false),
this.countQrCodesPorPeriodo(lojaId, inicioMes, new Date(), true),
      
      // Taxa de validação
      this.getTaxaValidacao(lojaId),
      
      // Tempo médio entre resgate e validação
      this.getTempoMedioValidacao(lojaId)
    ]);

    return {
      totais: {
        resgatados: totalResgatados,
        validados: totalValidados,
        pendentes: totalResgatados - totalValidados
      },
      hoje: {
        resgatados: resgatadosHoje,
        validados: validadosHoje,
        pendentes: resgatadosHoje - validadosHoje
      },
      semana: {
        resgatados: resgatadosSemana,
        validados: validadosSemana,
        pendentes: resgatadosSemana - validadosSemana
      },
      mes: {
        resgatados: resgatadosMes,
        validados: validadosMes,
        pendentes: resgatadosMes - validadosMes
      },
      taxaValidacao,
      tempoMedioValidacao: tempoMedioValidacao || 0
    };
  }

  /**
 * Busca resgates por dia com valores totais
 */
async findResgatesPorDiaComValores(lojaId, dataInicio, dataFim) {
  const resgates = await prisma.resgate.findMany({
    where: {
      cupom: { lojaId },
      resgatadoEm: {
        gte: dataInicio,
        lte: dataFim
      }
    },
    include: {
      cupom: {
        select: {
          precoComDesconto: true
        }
      }
    },
    orderBy: {
      resgatadoEm: 'asc'
    }
  });
  
  return resgates;
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

    // 🔥 ADICIONAR INFORMAÇÃO DE VALIDAÇÃO PARA CADA RESGATE
    const resgatesComValidacao = await Promise.all(
      resgates.map(async (resgate) => {
        const qrCode = await prisma.qrCodeUsado.findFirst({
          where: {
            clienteId: resgate.clienteId,
            cupomId: resgate.cupomId,
            usadoEm: {
              gte: new Date(new Date(resgate.resgatadoEm).getTime() - 24 * 60 * 60 * 1000), // 24h antes
              lte: new Date(new Date(resgate.resgatadoEm).getTime() + 24 * 60 * 60 * 1000) // 24h depois
            }
          },
          select: {
            validado: true,
            validadoEm: true,
            usadoEm: true
          }
        });

        return {
          id: resgate.id,
          clienteId: resgate.clienteId,
          cupomId: resgate.cupomId,
          quantidade: resgate.quantidade,
          resgatadoEm: resgate.resgatadoEm,
          cliente: resgate.cliente,
          cupom: resgate.cupom,
          // 🔥 CAMPOS DE VALIDAÇÃO
          qrCodeValidado: qrCode?.validado || false,
          qrCodeValidadoEm: qrCode?.validadoEm || null,
          qrCodeUsadoEm: qrCode?.usadoEm || null,
          valorOriginal: resgate.cupom.precoOriginal || 0,
          valorPago: resgate.cupom.precoComDesconto || 0,
          economia: (resgate.cupom.precoOriginal || 0) - (resgate.cupom.precoComDesconto || 0)
        };
      })
    );

    return resgatesComValidacao;
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

  // ================= QR CODES COM FILTROS =================
  /**
   * Busca QR codes resgatados por período
   */
  async findQrCodesResgatados(lojaId, dataInicio = null, dataFim = null, limit = 50) {
    const where = {
      cupom: { lojaId }
    };
    
    if (dataInicio || dataFim) {
      where.usadoEm = {};
      if (dataInicio) where.usadoEm.gte = dataInicio;
      if (dataFim) where.usadoEm.lte = dataFim;
    }
    
    return prisma.qrCodeUsado.findMany({
      where,
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
        usadoEm: 'desc'
      },
      take: limit
    });
  }

  /**
   * Busca QR codes validados por período
   */
  async findQrCodesValidados(lojaId, dataInicio = null, dataFim = null, limit = 50) {
    const where = {
      cupom: { lojaId },
      validado: true
    };
    
    if (dataInicio || dataFim) {
      where.validadoEm = {};
      if (dataInicio) where.validadoEm.gte = dataInicio;
      if (dataFim) where.validadoEm.lte = dataFim;
    }
    
    return prisma.qrCodeUsado.findMany({
      where,
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
        validadoEm: 'desc'
      },
      take: limit
    });
  }

  /**
   * Busca todos os QR codes com filtros avançados
   */
  async findQrCodesWithFilters(lojaId, filters = {}) {
    const {
      status,
      dataInicio,
      dataFim,
      clienteId,
      cupomId,
      page = 1,
      limit = 20
    } = filters;

    const where = {
      cupom: { lojaId }
    };

    if (status === 'validado') where.validado = true;
    if (status === 'pendente') where.validado = false;
    
    if (dataInicio || dataFim) {
      where.usadoEm = {};
      if (dataInicio) where.usadoEm.gte = new Date(dataInicio);
      if (dataFim) where.usadoEm.lte = new Date(dataFim);
    }
    
    if (clienteId) where.clienteId = clienteId;
    if (cupomId) where.cupomId = cupomId;

    const skip = (page - 1) * limit;

    const [qrCodes, total] = await Promise.all([
      prisma.qrCodeUsado.findMany({
        where,
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
          usadoEm: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.qrCodeUsado.count({ where })
    ]);

    return {
      data: qrCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
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

  /**
 * Busca loja pelo ID
 */
async findLojaById(lojaId) {
  return prisma.loja.findUnique({
    where: { id: lojaId },
    select: { 
      id: true, 
      nome: true 
    }
  });
}

}

module.exports = DashboardLojaRepository;