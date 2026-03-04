const prisma = require("../../database/prismaClient.cjs");

class DashboardClienteRepository {
  // ================= RESUMO =================
  async countTotalResgates(clienteId) {
    return prisma.resgate.count({
      where: { clienteId }
    });
  }

  async countCuponsUnicos(clienteId) {
    const resgates = await prisma.resgate.findMany({
      where: { clienteId },
      select: { cupomId: true },
      distinct: ['cupomId']
    });
    return resgates.length;
  }

  async countQrCodes(clienteId) {
    return prisma.qrCodeUsado.count({
      where: { clienteId }
    });
  }

  async countQrCodesValidados(clienteId) {
    return prisma.qrCodeUsado.count({
      where: { 
        clienteId,
        validado: true
      }
    });
  }

  async getUltimoResgate(clienteId) {
    return prisma.resgate.findFirst({
      where: { clienteId },
      orderBy: { resgatadoEm: 'desc' },
      include: {
        cupom: {
          include: {
            loja: true
          }
        }
      }
    });
  }

  // ================= RESGATES =================
  async findResgates(clienteId, { skip, limit }) {
    return prisma.resgate.findMany({
      where: { clienteId },
      skip,
      take: limit,
      orderBy: { resgatadoEm: 'desc' },
      include: {
        cupom: {
          include: {
            loja: true
          }
        }
      }
    });
  }

  async countResgates(clienteId) {
    return prisma.resgate.count({
      where: { clienteId }
    });
  }

  async findResgateById(clienteId, resgateId) {
    return prisma.resgate.findFirst({
      where: { 
        id: resgateId,
        clienteId 
      },
      include: {
        cupom: {
          include: {
            loja: true
          }
        }
      }
    });
  }

  // ================= QR CODES =================
  async findQrCodes(clienteId) {
    return prisma.qrCodeUsado.findMany({
      where: { clienteId },
      orderBy: { usadoEm: 'desc' },
      include: {
        cupom: {
          include: {
            loja: true
          }
        }
      }
    });
  }

  async findQrCodeById(clienteId, qrCodeId) {
    return prisma.qrCodeUsado.findFirst({
      where: { 
        id: qrCodeId,
        clienteId 
      },
      include: {
        cupom: {
          include: {
            loja: true
          }
        }
      }
    });
  }

  async findQrCodeByResgate(clienteId, cupomId) {
    return prisma.qrCodeUsado.findFirst({
      where: { 
        clienteId,
        cupomId
      },
      orderBy: { usadoEm: 'desc' }
    });
  }

  // ================= ESTATÍSTICAS =================
  async getResgatesPorMes(clienteId) {
    const resgates = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM resgatado_em) as ano,
        EXTRACT(MONTH FROM resgatado_em) as mes,
        COUNT(*) as total
      FROM resgates
      WHERE cliente_id = ${clienteId}::uuid
      GROUP BY ano, mes
      ORDER BY ano DESC, mes DESC
      LIMIT 6
    `;
    
    return resgates.map(r => ({
      ano: Number(r.ano),
      mes: Number(r.mes),
      total: Number(r.total)
    }));
  }

  async getResgatesPorLoja(clienteId) {
    const resgates = await prisma.resgate.groupBy({
      by: ['cupomId'],
      where: { clienteId },
      _count: true
    });

    const cupons = await prisma.cupom.findMany({
      where: {
        id: { in: resgates.map(r => r.cupomId) }
      },
      include: {
        loja: true
      }
    });

    return cupons.map(c => ({
      lojaId: c.loja.id,
      lojaNome: c.loja.nome,
      total: resgates.find(r => r.cupomId === c.id)?._count || 0
    }));
  }

  async getHorarioPreferido(clienteId) {
    const horarios = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM resgatado_em) as hora,
        COUNT(*) as total
      FROM resgates
      WHERE cliente_id = ${clienteId}::uuid
      GROUP BY hora
      ORDER BY total DESC
      LIMIT 1
    `;
    
    return horarios[0] ? {
      hora: Number(horarios[0].hora),
      total: Number(horarios[0].total)
    } : null;
  }

  // ================= PERFIL =================
  async findCliente(clienteId) {
    return prisma.cliente.findUnique({
      where: { id: clienteId }
    });
  }

  async updateCliente(clienteId, dados) {
    return prisma.cliente.update({
      where: { id: clienteId },
      data: dados
    });
  }
  // ================= ECONOMIA =================
async getEconomiaTotal(clienteId) {
    const resgates = await prisma.resgate.findMany({
      where: { clienteId },
      include: {
        cupom: {
          select: {
            precoOriginal: true,
            precoComDesconto: true
          }
        }
      }
    });

    console.log('💰 Resgates para economia total:', resgates); // 🔥 LOG

    let economiaTotal = 0;
    resgates.forEach(resgate => {
      const economiaPorItem = (resgate.cupom.precoOriginal || 0) - (resgate.cupom.precoComDesconto || 0);
      economiaTotal += economiaPorItem * resgate.quantidade;
      
      console.log('   Item:', { // 🔥 LOG
        precoOriginal: resgate.cupom.precoOriginal,
        precoComDesconto: resgate.cupom.precoComDesconto,
        economiaPorItem,
        quantidade: resgate.quantidade,
        subtotal: economiaPorItem * resgate.quantidade
      });
    });

    console.log('💰 Economia total calculada:', economiaTotal);
    return economiaTotal;
  }

async getEconomiaPorLoja(clienteId) {
  const resgates = await prisma.resgate.findMany({
    where: { clienteId },
    include: {
      cupom: {
        include: {
          loja: {
            select: {
              id: true,
              nome: true,
              logo: true
            }
          }
        }
        // ❌ REMOVA este select completamente
      }
    }
  });

  const economiaPorLoja = {};

  resgates.forEach(resgate => {
    const lojaId = resgate.cupom.loja.id;
    const lojaNome = resgate.cupom.loja.nome;
    const lojaLogo = resgate.cupom.loja.logo;
    const precoOriginal = resgate.cupom.precoOriginal || 0;
    const precoComDesconto = resgate.cupom.precoComDesconto || 0;
    
    if (!economiaPorLoja[lojaId]) {
      economiaPorLoja[lojaId] = {
        lojaId,
        lojaNome,
        lojaLogo,
        totalEconomia: 0,
        totalResgates: 0,
        cuponsUtilizados: new Set()
      };
    }

    const economiaPorItem = precoOriginal - precoComDesconto;
    economiaPorLoja[lojaId].totalEconomia += economiaPorItem * resgate.quantidade;
    economiaPorLoja[lojaId].totalResgates += resgate.quantidade;
    economiaPorLoja[lojaId].cuponsUtilizados.add(resgate.cupomId);
  });

  return Object.values(economiaPorLoja).map(loja => ({
    ...loja,
    cuponsUtilizados: loja.cuponsUtilizados.size
  }));
}

}

module.exports = DashboardClienteRepository;