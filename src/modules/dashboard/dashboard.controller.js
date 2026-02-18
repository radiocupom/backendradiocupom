const DashboardService = require('./dashboard.service');

class DashboardController {
  constructor() {
    this.service = new DashboardService();
  }

  getKPIs = async (req, res) => {
    try {
      const data = await this.service.getKPIs();
      return res.json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
  };

  getRecentTransactions = async (req, res) => {
    try {
      const data = await this.service.getRecentTransactions();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  };

  getStoreDistribution = async (req, res) => {
    try {
      const data = await this.service.getStoreDistribution();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Erro na distribuição' });
    }
  };

  getStoreRanking = async (req, res) => {
    try {
      const data = await this.service.getStoreRanking();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Erro no ranking' });
    }
  };

  getGrowthMetrics = async (req, res) => {
    try {
      const data = await this.service.getGrowthMetrics();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Erro nas métricas' });
    }
  };
}

module.exports = DashboardController;
