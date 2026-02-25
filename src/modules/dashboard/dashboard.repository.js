const prisma = require("../../database/prismaClient.cjs");

class DashboardRepository {
  // ================= CONTAGENS BÁSICAS =================
  countLojas() {
    return prisma.loja.count();
  }

  countLojasAtivas() {
    return prisma.loja.count({
      where: { payment: true }
    });
  }

  countUsuarios() {
    return prisma.usuario.count();
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

  countResgatesHoje() {
    const start = new Date();
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

  // ================= VALORES FINANCEIROS =================
  async getValorTotalResgatado() {
  // 🔥 SOMA TODOS OS RESGATES com preço original
  const result = await prisma.resgate.aggregate({
    _sum: {
      quantidade: true
    },
    where: {
      cupom: {
        precoOriginal: { not: null }
      }
    }
  });

  // Buscar todos os cupons com preço
  const cupons = await prisma.cupom.findMany({
    where: { precoOriginal: { not: null } },
    select: { id: true, precoOriginal: true }
  });

  // Mapear preços por cupom
  const precosPorCupom = {};
  cupons.forEach(c => precosPorCupom[c.id] = c.precoOriginal);

  // Buscar todos os resgates
  const resgates = await prisma.resgate.findMany({
    where: {
      cupom: {
        precoOriginal: { not: null }
      }
    },
    select: {
      cupomId: true,
      quantidade: true
    }
  });

  // Calcular total
  let total = 0;
  for (const resgate of resgates) {
    total += (precosPorCupom[resgate.cupomId] || 0) * resgate.quantidade;
  }

  return total;
}

  async getValorTotalVendido() {
  // 🔥 SOMA TODOS OS RESGATES (não apenas validados)
  const result = await prisma.resgate.aggregate({
    _sum: {
      quantidade: true
    },
    where: {
      cupom: {
        precoComDesconto: { not: null }
      }
    }
  });

  // Buscar todos os cupons com preço
  const cupons = await prisma.cupom.findMany({
    where: { precoComDesconto: { not: null } },
    select: { id: true, precoComDesconto: true, precoOriginal: true }
  });

  // Mapear preços por cupom
  const precosPorCupom = {};
  cupons.forEach(c => precosPorCupom[c.id] = c.precoComDesconto || c.precoOriginal);

  // Buscar todos os resgates
  const resgates = await prisma.resgate.findMany({
    where: {
      cupom: {
        precoComDesconto: { not: null }
      }
    },
    select: {
      cupomId: true,
      quantidade: true
    }
  });

  // Calcular total
  let total = 0;
  for (const resgate of resgates) {
    total += (precosPorCupom[resgate.cupomId] || 0) * resgate.quantidade;
  }

  return total;
}

async getValorTotalEconomizado() {
  const totalBruto = await this.getValorTotalResgatado();
  const totalVendido = await this.getValorTotalVendido();
  return totalBruto - totalVendido;
}

async getTicketMedio() {
  const totalVendido = await this.getValorTotalVendido();
  const totalResgates = await prisma.resgate.count(); // Todos os resgates, não só validados
  
  return totalResgates > 0 ? totalVendido / totalResgates : 0;
}

  async getValorTotalEconomizado() {
  const totalBruto = await this.getValorTotalResgatado();
  const totalVendido = await this.getValorTotalVendido();
  return totalBruto - totalVendido;
}

async getTicketMedio() {
  const totalVendido = await this.getValorTotalVendido();
  const totalResgates = await prisma.resgate.count(); // Todos os resgates, não só validados
  
  return totalResgates > 0 ? totalVendido / totalResgates : 0;
}
  async getCuponsComPreco() {
    return prisma.cupom.count({
      where: {
        precoOriginal: { not: null }
      }
    });
  }

  // ================= RESGATES RECENTES =================
  async getRecentResgates() {
    return prisma.resgate.findMany({
      take: 10,
      orderBy: { resgatadoEm: 'desc' },
      include: {
        cliente: true,
        cupom: {
          include: { loja: true }
        }
      }
    });
  }

  // ================= DISTRIBUIÇÃO =================
  async getStoreDistribution() {
    return prisma.loja.groupBy({
      by: ['categoria'],
      _count: { id: true }
    });
  }

  // ================= RANKING =================
  async getStoreRanking() {
    const ranking = await prisma.resgate.groupBy({
      by: ['cupomId'],
      _sum: { quantidade: true }
    });

    const cupomIds = ranking.map(r => r.cupomId);

    const cupons = await prisma.cupom.findMany({
      where: { id: { in: cupomIds } },
      include: { loja: true }
    });

    const lojaMap = {};

    ranking.forEach(item => {
      const cupom = cupons.find(c => c.id === item.cupomId);
      if (!cupom) return;

      const lojaId = cupom.loja.id;

      if (!lojaMap[lojaId]) {
        lojaMap[lojaId] = {
          lojaId,
          lojaNome: cupom.loja.nome,
          totalResgates: 0,
          valorTotal: 0
        };
      }

      lojaMap[lojaId].totalResgates += item._sum.quantidade || 0;
      lojaMap[lojaId].valorTotal += (cupom.precoComDesconto || cupom.precoOriginal || 0) * (item._sum.quantidade || 0);
    });

    const result = Object.values(lojaMap)
      .sort((a, b) => b.totalResgates - a.totalResgates)
      .slice(0, 5);

    return result;
  }

  // ================= MÉTRICAS DE CRESCIMENTO =================
  async getGrowthMetrics() {
    const totalLojas = await prisma.loja.count();
    const totalClientes = await prisma.cliente.count();
    const totalResgates = await prisma.resgate.count();

    return {
      totalLojas,
      totalClientes,
      totalResgates
    };
  }
}

module.exports = DashboardRepository;