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
      resgatesMes
    ] = await Promise.all([
      this.repository.countLojas(),
      this.repository.countLojasAtivas(),
      this.repository.countUsuarios(),
      this.repository.countCuponsAtivos(),
      this.repository.countCuponsExpirados(),
      this.repository.countResgatesHoje(),
      this.repository.countResgatesMes()
    ]);

    return {
      totalLojas,
      lojasAtivas,
      totalUsuarios,
      cuponsAtivos,
      cuponsExpirados,
      resgatesHoje,
      resgatesMes
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
