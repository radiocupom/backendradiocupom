const prisma = require("../../database/prismaClient.cjs");

class DashboardRepository {
  // ================= LOJAS =================
  countLojas() {
    return prisma.loja.count();
  }

  countLojasAtivas() {
    return prisma.loja.count({
      where: { payment: true }
    });
  }

  countLojasInativas() {
    return prisma.loja.count({
      where: { payment: false }
    });
  }

  // ================= USUÁRIOS =================
  countUsuarios() {
    return prisma.usuario.count();
  }

  // ================= CLIENTES =================
  countClientes() {
    return prisma.cliente.count();
  }

  // ================= CUPONS =================
  countTotalCupons() {
    return prisma.cupom.count();
  }

  countCuponsAtivos() {
    return prisma.cupom.count({
      where: { dataExpiracao: { gt: new Date() } }
    });
  }

  countCuponsExpirados() {
    return prisma.cupom.count({
      where: { dataExpiracao: { lt: new Date() } }
    });
  }

  countCuponsComPreco() {
    return prisma.cupom.count({
      where: { precoOriginal: { not: null } }
    });
  }

  async findCuponsMaisResgatados(limit = 5) {
    return prisma.cupom.findMany({
      take: limit,
      include: {
        _count: {
          select: { resgates: true }
        },
        loja: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        resgates: {
          _count: 'desc'
        }
      }
    });
  }

  // ================= RESGATES =================
  countTotalResgates() {
    return prisma.resgate.count();
  }

  countResgatesHoje() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return prisma.resgate.count({
      where: { resgatadoEm: { gte: start } }
    });
  }

  countResgatesSemana() {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    return prisma.resgate.count({
      where: { resgatadoEm: { gte: start } }
    });
  }

  countResgatesMes() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    return prisma.resgate.count({
      where: { resgatadoEm: { gte: start } }
    });
  }

  async findRecentResgates(limit = 10) {
    return prisma.resgate.findMany({
      take: limit,
      orderBy: { resgatadoEm: 'desc' },
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
            loja: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        qrCodes: {
          select: {
            id: true,
            validado: true,
            validadoEm: true
          }
        }
      }
    });
  }

  async findResgatesPorDia(dataInicio, dataFim) {
    return prisma.resgate.findMany({
      where: {
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
  }

  // ================= QR CODES =================
  countTotalQrCodes() {
    return prisma.qrCodeUsado.count();
  }

  countQrCodesValidados() {
    return prisma.qrCodeUsado.count({
      where: { validado: true }
    });
  }

  countQrCodesPendentes() {
    return prisma.qrCodeUsado.count({
      where: { validado: false }
    });
  }

  async countQrCodesPorPeriodo(dataInicio, dataFim = new Date(), validado = null) {
    const where = {
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

  async findQrCodesComTempoValidacao(limit = 1000) {
    return prisma.qrCodeUsado.findMany({
      where: {
        validado: true,
        validadoEm: { not: null }
      },
      select: {
        usadoEm: true,
        validadoEm: true
      },
      take: limit
    });
  }

  async findQrCodesResgatados(dataInicio = null, dataFim = null, limit = 50) {
    const where = {};

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
            nomeProduto: true,
            loja: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      },
      orderBy: {
        usadoEm: 'desc'
      },
      take: limit
    });
  }

  async findQrCodesValidados(dataInicio = null, dataFim = null, limit = 50) {
    const where = {
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
            nomeProduto: true,
            loja: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      },
      orderBy: {
        validadoEm: 'desc'
      },
      take: limit
    });
  }

  async findQrCodesWithFilters(filters = {}) {
    const {
      status,
      dataInicio,
      dataFim,
      lojaId,
      clienteId,
      cupomId,
      page = 1,
      limit = 20
    } = filters;

    const where = {};

    if (status === 'validado') where.validado = true;
    if (status === 'pendente') where.validado = false;

    if (dataInicio || dataFim) {
      where.usadoEm = {};
      if (dataInicio) where.usadoEm.gte = new Date(dataInicio);
      if (dataFim) where.usadoEm.lte = new Date(dataFim);
    }

    if (lojaId) {
      where.cupom = { lojaId };
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
              nomeProduto: true,
              loja: {
                select: {
                  id: true,
                  nome: true
                }
              }
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

  // ================= VALORES FINANCEIROS =================
  async getValorTotalResgatado() {
    const [result] = await prisma.$queryRaw`
      SELECT COALESCE(SUM(c.preco_original * r.quantidade), 0) as total
      FROM resgates r
      JOIN cupons c ON r.cupom_id = c.id
      WHERE c.preco_original IS NOT NULL
    `;
    return Number(result.total);
  }

  async getValorTotalVendido() {
    const [result] = await prisma.$queryRaw`
      SELECT COALESCE(SUM(c.preco_com_desconto), 0) as total
      FROM qrcodes_usados q
      JOIN cupons c ON q.cupom_id = c.id
      WHERE q.validado = true
        AND c.preco_com_desconto IS NOT NULL
    `;
    return Number(result.total);
  }

  async getValorTotalEconomizado() {
    const [totalBruto, totalVendido] = await Promise.all([
      this.getValorTotalResgatado(),
      this.getValorTotalVendido()
    ]);
    return totalBruto - totalVendido;
  }

  async getTicketMedio() {
    const [result] = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN COUNT(q.id) > 0 
          THEN COALESCE(SUM(c.preco_com_desconto) / COUNT(q.id), 0)
          ELSE 0
        END as ticket_medio
      FROM qrcodes_usados q
      JOIN cupons c ON q.cupom_id = c.id
      WHERE q.validado = true
        AND c.preco_com_desconto IS NOT NULL
    `;
    return Number(result.ticket_medio);
  }

  // ================= DISTRIBUIÇÃO =================
  async findStoreDistribution() {
    return prisma.loja.groupBy({
      by: ['categoria'],
      _count: { id: true }
    });
  }

  // ================= RANKING =================
  async findStoreRanking(limit = 5) {
    const ranking = await prisma.$queryRaw`
      SELECT 
        l.id as "lojaId",
        l.nome as "lojaNome",
        COUNT(r.id) as "totalResgates",
        COALESCE(SUM(c.preco_com_desconto * r.quantidade), 0) as "valorTotal",
        COUNT(DISTINCT r.cliente_id) as "clientesUnicos",
        COUNT(DISTINCT c.id) as "cuponsUtilizados"
      FROM resgates r
      JOIN cupons c ON r.cupom_id = c.id
      JOIN lojas l ON c.loja_id = l.id
      GROUP BY l.id, l.nome
      ORDER BY "totalResgates" DESC
      LIMIT ${limit}
    `;
    
    return ranking.map(item => ({
      lojaId: item.lojaId,
      lojaNome: item.lojaNome,
      totalResgates: Number(item.totalResgates),
      valorTotal: Number(item.valorTotal),
      clientesUnicos: Number(item.clientesUnicos),
      cuponsUtilizados: Number(item.cuponsUtilizados)
    }));
  }
}

module.exports = DashboardRepository;