const DashboardRepository = require('./dashboard.repository');

class DashboardService {
  constructor() {
    this.repository = new DashboardRepository();
  }

  async getKPIs() {
    const [
      totalLojas,
      lojasAtivas,
      totalUsuarios,
      cuponsAtivos,
      cuponsExpirados,
      resgatesHoje,
      resgatesMes,
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      ticketMedio,
      cuponsComPreco
    ] = await Promise.all([
      this.repository.countLojas(),
      this.repository.countLojasAtivas(),
      this.repository.countUsuarios(),
      this.repository.countCuponsAtivos(),
      this.repository.countCuponsExpirados(),
      this.repository.countResgatesHoje(),
      this.repository.countResgatesMes(),
      this.repository.getValorTotalResgatado(),
      this.repository.getValorTotalVendido(),
      this.repository.getValorTotalEconomizado(),
      this.repository.getTicketMedio(),
      this.repository.getCuponsComPreco()
    ]);

    return {
      // Métricas básicas
      totalLojas,
      lojasAtivas,
      totalUsuarios,
      cuponsAtivos,
      cuponsExpirados,
      resgatesHoje,
      resgatesMes,
      
      // 🔥 NOVAS MÉTRICAS FINANCEIRAS
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      ticketMedio,
      cuponsComPreco
    };
  }

  async getRecentTransactions() {
    return this.repository.getRecentResgates();
  }

  async getStoreDistribution() {
    return this.repository.getStoreDistribution();
  }

  async getStoreRanking() {
    return this.repository.getStoreRanking();
  }

  async getGrowthMetrics() {
    return this.repository.getGrowthMetrics();
  }
}

module.exports = DashboardService;