const DashboardLojaService = require('./DashboardLojaService');

class DashboardLojaController {
  constructor() {
    this.service = new DashboardLojaService();
  }

  /**
   * KPIs principais da loja
   */
  getKPIs = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const kpis = await this.service.getKPIs(usuarioId);
      res.json(kpis);
    } catch (err) {
      console.error('Erro ao buscar KPIs:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Últimos resgates da loja
   */
  getUltimosResgates = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { limit = 10 } = req.query;
      const resgates = await this.service.getUltimosResgates(usuarioId, parseInt(limit));
      res.json(resgates);
    } catch (err) {
      console.error('Erro ao buscar últimos resgates:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Cupons mais resgatados da loja
   */
  getCuponsPopulares = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { limit = 5 } = req.query;
      const cupons = await this.service.getCuponsPopulares(usuarioId, parseInt(limit));
      res.json(cupons);
    } catch (err) {
      console.error('Erro ao buscar cupons populares:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Resgates por dia (últimos 7 dias)
   */
  getResgatesPorDia = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const dados = await this.service.getResgatesPorDia(usuarioId);
      res.json(dados);
    } catch (err) {
      console.error('Erro ao buscar resgates por dia:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Todos os dados do dashboard em uma única chamada
   */
  getDadosCompletos = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const dados = await this.service.getDadosCompletos(usuarioId);
      res.json(dados);
    } catch (err) {
      console.error('Erro ao buscar dados completos:', err);
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = DashboardLojaController;