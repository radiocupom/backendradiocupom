const DashboardLojaService = require('./DashboardLojaService');

class DashboardLojaController {
  constructor() {
    this.service = new DashboardLojaService();
  }

  /**
   * KPIs principais da loja com dados financeiros
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

  // ================= NOVOS MÉTODOS PARA QR CODES =================

  /**
   * Busca QR codes resgatados
   */
  getQrCodesResgatados = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { limit = 50 } = req.query;
      const qrCodes = await this.service.getQrCodesResgatados(usuarioId, parseInt(limit));
      res.json(qrCodes);
    } catch (err) {
      console.error('Erro ao buscar QR codes resgatados:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca QR codes validados
   */
  getQrCodesValidados = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { limit = 50 } = req.query;
      const qrCodes = await this.service.getQrCodesValidados(usuarioId, parseInt(limit));
      res.json(qrCodes);
    } catch (err) {
      console.error('Erro ao buscar QR codes validados:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca estatísticas de validação de QR codes
   */
  getQrCodeStats = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const stats = await this.service.getQrCodeStats(usuarioId);
      res.json(stats);
    } catch (err) {
      console.error('Erro ao buscar estatísticas de QR codes:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca QR codes com filtros avançados
   */
  getQrCodesWithFilters = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const filters = {
        status: req.query.status,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        clienteId: req.query.clienteId,
        cupomId: req.query.cupomId,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20
      };
      
      const result = await this.service.getQrCodesWithFilters(usuarioId, filters);
      res.json(result);
    } catch (err) {
      console.error('Erro ao buscar QR codes com filtros:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca QR codes resgatados por período
   */
  getQrCodesResgatadosPorPeriodo = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { dataInicio, dataFim, limit = 50 } = req.query;
      
      const qrCodes = await this.service.getQrCodesResgatadosPorPeriodo(
        usuarioId, 
        dataInicio ? new Date(dataInicio) : null, 
        dataFim ? new Date(dataFim) : null, 
        parseInt(limit)
      );
      
      res.json(qrCodes);
    } catch (err) {
      console.error('Erro ao buscar QR codes resgatados por período:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca QR codes validados por período
   */
  getQrCodesValidadosPorPeriodo = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { dataInicio, dataFim, limit = 50 } = req.query;
      
      const qrCodes = await this.service.getQrCodesValidadosPorPeriodo(
        usuarioId, 
        dataInicio ? new Date(dataInicio) : null, 
        dataFim ? new Date(dataFim) : null, 
        parseInt(limit)
      );
      
      res.json(qrCodes);
    } catch (err) {
      console.error('Erro ao buscar QR codes validados por período:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Calcula a taxa de validação da loja
   */
  getTaxaValidacao = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const taxa = await this.service.getTaxaValidacao(usuarioId);
      res.json({ taxa });
    } catch (err) {
      console.error('Erro ao calcular taxa de validação:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Calcula o tempo médio de validação
   */
  getTempoMedioValidacao = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const tempoMedio = await this.service.getTempoMedioValidacao(usuarioId);
      res.json({ tempoMedio });
    } catch (err) {
      console.error('Erro ao calcular tempo médio de validação:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca resgates com status de validação
   */
  getResgatesComValidacao = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { limit = 10 } = req.query;
      const resgates = await this.service.getResgatesComValidacao(usuarioId, parseInt(limit));
      res.json(resgates);
    } catch (err) {
      console.error('Erro ao buscar resgates com validação:', err);
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

  /**
 * Buscar dados completos de uma loja específica por ID (para admin)
 */
getDadosCompletosPorLojaId = async (req, res) => {
  try {
    const { lojaId } = req.params;
    
    console.log(`🔍 Admin buscando dashboard da loja: ${lojaId}`);
    
    // 🔥 Reutiliza o service, mas adaptamos para receber lojaId
    const dados = await this.service.getDadosCompletosPorLojaId(lojaId);
    
    res.json(dados);
    
  } catch (err) {
    console.error('Erro ao buscar dashboard da loja:', err);
    res.status(400).json({ error: err.message });
  }
};

}

module.exports = DashboardLojaController;