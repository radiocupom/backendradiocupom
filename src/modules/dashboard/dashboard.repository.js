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
    const cupons = await prisma.cupom.findMany({
      where: {
        precoOriginal: { not: null }
      }
    });

    return cupons.reduce((total, cupom) => total + (cupom.precoOriginal || 0), 0);
  }

  async getValorTotalVendido() {
    const qrCodesValidados = await prisma.qrCodeUsado.findMany({
      where: { validado: true },
      include: { cupom: true }
    });

    return qrCodesValidados.reduce((total, qr) => {
      return total + (qr.cupom.precoComDesconto || qr.cupom.precoOriginal || 0);
    }, 0);
  }

  async getValorTotalEconomizado() {
    const valorTotal = await this.getValorTotalResgatado();
    const valorVendido = await this.getValorTotalVendido();
    return valorTotal - valorVendido;
  }

  async getTicketMedio() {
    const resgatesValidados = await prisma.qrCodeUsado.count({
      where: { validado: true }
    });

    if (resgatesValidados === 0) return 0;

    const valorVendido = await this.getValorTotalVendido();
    return valorVendido / resgatesValidados;
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