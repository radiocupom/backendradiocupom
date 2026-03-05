const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DashboardLojaRepository {
  // ================= LOJA =================
  
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

  // ================= CUPONS =================

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
   * Conta cupons que possuem preço definido
   */
  async countCuponsComPreco(lojaId) {
    return prisma.cupom.count({
      where: {
        lojaId,
        precoOriginal: { not: null }
      }
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

  // ================= RESGATES =================

  /**
   * Conta total de resgates da loja
   */
  async countResgates(lojaId) {
    return prisma.resgate.count({
      where: {
        cupom: { lojaId }
      }
    });
  }

  /**
   * Conta resgates em um período
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
 * Busca últimos resgates com QR codes (AGORA COM INCLUDE DIRETO)
 */
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
          whatsapp: true,
          cidade: true,
          estado: true
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
      },
      qrCodes: {  // ← AGORA FUNCIONA GRAÇAS À MIGRAÇÃO!
        select: {
          id: true,
          validado: true,
          validadoEm: true,
          usadoEm: true
        }
      }
    },
    orderBy: {
      resgatadoEm: 'desc'
    },
    take: limit
  });

  return resgates;
}

  /**
   * Busca resgates por período para gráfico
   */
  async findResgatesPorDia(lojaId, dataInicio, dataFim) {
    return prisma.resgate.findMany({
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
            id: true,
            precoComDesconto: true,
            precoOriginal: true
          }
        }
      },
      orderBy: {
        resgatadoEm: 'asc'
      }
    });
  }

  /**
   * Busca todos os resgates com valores para cálculos financeiros
   */
  async findResgatesComValores(lojaId) {
    return prisma.resgate.findMany({
      where: {
        cupom: { lojaId }
      },
      include: {
        cupom: {
          select: {
            precoOriginal: true,
            precoComDesconto: true
          }
        }
      }
    });
  }

  // ================= QR CODES =================

  /**
   * Conta QR codes da loja
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
   * Conta QR codes por período
   */
  async countQrCodesPorPeriodo(lojaId, dataInicio, dataFim = new Date(), validado = null) {
    const where = {
      cupom: { lojaId },
      usadoEm: {
        gte: dataInicio,
        lte: dataFim
      }
    };

    if (validado !== null) {
      where.validado = validado;
    }

    return prisma.qrCodeUsado.count({ where });
  }

 /**
 * Busca QR codes com tempo de validação (AGORA USA A RELAÇÃO)
 */
async findQrCodesComTempoValidacao(lojaId, limit = 1000) {
  return prisma.qrCodeUsado.findMany({
    where: {
      cupom: { lojaId },
      validado: true,
      validadoEm: { not: null },
      resgateId: { not: null }  // ← FILTRA QUEM TEM RESGATE
    },
    select: {
      usadoEm: true,
      validadoEm: true,
      resgate: {  // ← USA A RELAÇÃO PARA PEGAR DATA MAIS PRECISA
        select: {
          resgatadoEm: true
        }
      }
    },
    take: limit
  });
}

  /**
   * Busca QR codes resgatados
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
   * Busca QR codes validados
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
   * Busca QR codes com filtros avançados
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

  // ================= CLIENTES =================

  /**
   * Conta clientes únicos que resgataram na loja
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

  // ================= DADOS COMPLETOS =================

  /**
   * Busca todos os dados necessários para o dashboard
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
      this.countCuponsComPreco(lojaId),
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
        financeiro: {} // Será preenchido pelo service
      },
      ultimosResgates,
      cuponsPopulares,
      resgatesPorDia
    };
  }

  /**
 * Busca resgates que possuem PELO MENOS UM QR code validado
 * Usado para cálculos financeiros precisos
 */
async findResgatesComQRValidados(lojaId) {
  return prisma.resgate.findMany({
    where: {
      cupom: { lojaId },
      qrCodes: {
        some: { validado: true } // Pelo menos um QR code validado
      }
    },
    include: {
      cupom: {
        select: {
          precoOriginal: true,
          precoComDesconto: true
        }
      },
      qrCodes: {
        where: { validado: true },
        select: { validado: true }
      }
    }
  });
}

}

module.exports = DashboardLojaRepository;