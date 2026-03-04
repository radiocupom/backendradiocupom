const DashboardService = require('./dashboard.service');

class DashboardController {
  constructor() {
 this.service = new DashboardService();
  }

  /**
   * KPIs principais do sistema
   */
  getKPIs = async (req, res) => {
    const startTime = Date.now();
    const { email, role } = req.user;

    try {
      console.log(`📊 [Admin KPIs] Iniciando para admin: ${email} (${role})`);

      const kpis = await this.service.getKPIs();

      console.log(`✅ [Admin KPIs] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: kpis
      });

    } catch (error) {
      console.error(`❌ [Admin KPIs] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Últimas transações do sistema
   */
  getRecentTransactions = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { limit = 10 } = req.query;

    try {
      console.log(`📊 [Admin RecentTransactions] Iniciando para admin: ${email} (limit: ${limit})`);

      const transactions = await this.service.getRecentTransactions(Number(limit));

      console.log(`✅ [Admin RecentTransactions] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error(`❌ [Admin RecentTransactions] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Cupons mais resgatados do sistema
   */
  getCuponsPopulares = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { limit = 5 } = req.query;

    try {
      console.log(`📊 [Admin CuponsPopulares] Iniciando para admin: ${email} (limit: ${limit})`);

      const cupons = await this.service.getCuponsPopulares(Number(limit));

      console.log(`✅ [Admin CuponsPopulares] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupons
      });

    } catch (error) {
      console.error(`❌ [Admin CuponsPopulares] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Resgates por dia (últimos 7 dias)
   */
  getResgatesPorDia = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin ResgatesPorDia] Iniciando para admin: ${email}`);

      const dados = await this.service.getResgatesPorDia();

      console.log(`✅ [Admin ResgatesPorDia] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: dados
      });

    } catch (error) {
      console.error(`❌ [Admin ResgatesPorDia] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Busca QR codes resgatados
   */
  getQrCodesResgatados = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { limit = 50 } = req.query;

    try {
      console.log(`📊 [Admin QrCodesResgatados] Iniciando para admin: ${email} (limit: ${limit})`);

      const qrCodes = await this.service.getQrCodesResgatados(Number(limit));

      console.log(`✅ [Admin QrCodesResgatados] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [Admin QrCodesResgatados] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Busca QR codes validados
   */
  getQrCodesValidados = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { limit = 50 } = req.query;

    try {
      console.log(`📊 [Admin QrCodesValidados] Iniciando para admin: ${email} (limit: ${limit})`);

      const qrCodes = await this.service.getQrCodesValidados(Number(limit));

      console.log(`✅ [Admin QrCodesValidados] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [Admin QrCodesValidados] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Busca estatísticas de validação de QR codes
   */
  getQrCodeStats = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin QrCodeStats] Iniciando para admin: ${email}`);

      const stats = await this.service.getQrCodeStats();

      console.log(`✅ [Admin QrCodeStats] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error(`❌ [Admin QrCodeStats] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Busca QR codes com filtros avançados
   */
  getQrCodesWithFilters = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      const filters = {
        status: req.query.status,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        lojaId: req.query.lojaId,
        clienteId: req.query.clienteId,
        cupomId: req.query.cupomId,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20
      };

      console.log(`📊 [Admin QrCodesWithFilters] Iniciando para admin: ${email}`, filters);

      const result = await this.service.getQrCodesWithFilters(filters);

      console.log(`✅ [Admin QrCodesWithFilters] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error(`❌ [Admin QrCodesWithFilters] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Busca QR codes resgatados por período
   */
  getQrCodesResgatadosPorPeriodo = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { dataInicio, dataFim, limit = 50 } = req.query;

    try {
      console.log(`📊 [Admin QrCodesResgatadosPorPeriodo] Iniciando para admin: ${email}`);

      const qrCodes = await this.service.getQrCodesResgatadosPorPeriodo(
        dataInicio ? new Date(dataInicio) : null,
        dataFim ? new Date(dataFim) : null,
        Number(limit)
      );

      console.log(`✅ [Admin QrCodesResgatadosPorPeriodo] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [Admin QrCodesResgatadosPorPeriodo] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Busca QR codes validados por período
   */
  getQrCodesValidadosPorPeriodo = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { dataInicio, dataFim, limit = 50 } = req.query;

    try {
      console.log(`📊 [Admin QrCodesValidadosPorPeriodo] Iniciando para admin: ${email}`);

      const qrCodes = await this.service.getQrCodesValidadosPorPeriodo(
        dataInicio ? new Date(dataInicio) : null,
        dataFim ? new Date(dataFim) : null,
        Number(limit)
      );

      console.log(`✅ [Admin QrCodesValidadosPorPeriodo] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [Admin QrCodesValidadosPorPeriodo] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Calcula a taxa de validação global
   */
  getTaxaValidacao = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin TaxaValidacao] Iniciando para admin: ${email}`);

      const taxa = await this.service.getTaxaValidacao();

      console.log(`✅ [Admin TaxaValidacao] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: { taxa }
      });

    } catch (error) {
      console.error(`❌ [Admin TaxaValidacao] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Calcula o tempo médio de validação global
   */
  getTempoMedioValidacao = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin TempoMedioValidacao] Iniciando para admin: ${email}`);

      const tempoMedio = await this.service.getTempoMedioValidacao();

      console.log(`✅ [Admin TempoMedioValidacao] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: { tempoMedio }
      });

    } catch (error) {
      console.error(`❌ [Admin TempoMedioValidacao] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Distribuição de lojas por categoria
   */
  getStoreDistribution = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin StoreDistribution] Iniciando para admin: ${email}`);

      const distribution = await this.service.getStoreDistribution();

      console.log(`✅ [Admin StoreDistribution] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: distribution
      });

    } catch (error) {
      console.error(`❌ [Admin StoreDistribution] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Ranking de lojas por resgates
   */
  getStoreRanking = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;
    const { limit = 5 } = req.query;

    try {
      console.log(`📊 [Admin StoreRanking] Iniciando para admin: ${email} (limit: ${limit})`);

      const ranking = await this.service.getStoreRanking(Number(limit));

      console.log(`✅ [Admin StoreRanking] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: ranking
      });

    } catch (error) {
      console.error(`❌ [Admin StoreRanking] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Métricas de crescimento
   */
  getGrowthMetrics = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin GrowthMetrics] Iniciando para admin: ${email}`);

      const metrics = await this.service.getGrowthMetrics();

      console.log(`✅ [Admin GrowthMetrics] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error(`❌ [Admin GrowthMetrics] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Todos os dados do dashboard admin em uma única chamada
   */
  getDadosCompletos = async (req, res) => {
    const startTime = Date.now();
    const { email } = req.user;

    try {
      console.log(`📊 [Admin DadosCompletos] Iniciando para admin: ${email}`);

      const dados = await this.service.getDadosCompletos();

      console.log(`✅ [Admin DadosCompletos] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: dados
      });

    } catch (error) {
      console.error(`❌ [Admin DadosCompletos] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };
}

module.exports = DashboardController;