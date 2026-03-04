const DashboardLojaService = require('./DashboardLojaService');

class DashboardLojaController {
  constructor() {
    this.service = new DashboardLojaService();
  }

  /**
   * KPIs principais da loja com dados financeiros
   */
  getKPIs = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;

    try {
      console.log(`📊 [KPIs] Iniciando busca para lojista: ${email} (${usuarioId})`);

      const kpis = await this.service.getKPIs(usuarioId);

      console.log(`✅ [KPIs] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: kpis
      });

    } catch (error) {
      console.error(`❌ [KPIs] Erro para lojista ${email}:`, {
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
   * Últimos resgates da loja com status de validação
   */
  getUltimosResgates = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;
    const { limit = 10 } = req.query;

    try {
      console.log(`📊 [UltimosResgates] Iniciando para lojista: ${email} (limit: ${limit})`);

      const resgates = await this.service.getUltimosResgates(usuarioId, Number(limit));

      console.log(`✅ [UltimosResgates] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: resgates
      });

    } catch (error) {
      console.error(`❌ [UltimosResgates] Erro:`, {
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
   * Cupons mais resgatados da loja
   */
  getCuponsPopulares = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;
    const { limit = 5 } = req.query;

    try {
      console.log(`📊 [CuponsPopulares] Iniciando para lojista: ${email} (limit: ${limit})`);

      const cupons = await this.service.getCuponsPopulares(usuarioId, Number(limit));

      console.log(`✅ [CuponsPopulares] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupons
      });

    } catch (error) {
      console.error(`❌ [CuponsPopulares] Erro:`, {
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
    const { id: usuarioId, email } = req.user;

    try {
      console.log(`📊 [ResgatesPorDia] Iniciando para lojista: ${email}`);

      const dados = await this.service.getResgatesPorDia(usuarioId);

      console.log(`✅ [ResgatesPorDia] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: dados
      });

    } catch (error) {
      console.error(`❌ [ResgatesPorDia] Erro:`, {
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
    const { id: usuarioId, email } = req.user;
    const { limit = 50 } = req.query;

    try {
      console.log(`📊 [QrCodesResgatados] Iniciando para lojista: ${email} (limit: ${limit})`);

      const qrCodes = await this.service.getQrCodesResgatados(usuarioId, Number(limit));

      console.log(`✅ [QrCodesResgatados] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [QrCodesResgatados] Erro:`, {
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
    const { id: usuarioId, email } = req.user;
    const { limit = 50 } = req.query;

    try {
      console.log(`📊 [QrCodesValidados] Iniciando para lojista: ${email} (limit: ${limit})`);

      const qrCodes = await this.service.getQrCodesValidados(usuarioId, Number(limit));

      console.log(`✅ [QrCodesValidados] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [QrCodesValidados] Erro:`, {
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
    const { id: usuarioId, email } = req.user;

    try {
      console.log(`📊 [QrCodeStats] Iniciando para lojista: ${email}`);

      const stats = await this.service.getQrCodeStats(usuarioId);

      console.log(`✅ [QrCodeStats] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error(`❌ [QrCodeStats] Erro:`, {
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
    const { id: usuarioId, email } = req.user;

    try {
      const filters = {
        status: req.query.status,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        clienteId: req.query.clienteId,
        cupomId: req.query.cupomId,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20
      };

      console.log(`📊 [QrCodesWithFilters] Iniciando para lojista: ${email}`, filters);

      const result = await this.service.getQrCodesWithFilters(usuarioId, filters);

      console.log(`✅ [QrCodesWithFilters] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error(`❌ [QrCodesWithFilters] Erro:`, {
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
    const { id: usuarioId, email } = req.user;
    const { dataInicio, dataFim, limit = 50 } = req.query;

    try {
      console.log(`📊 [QrCodesResgatadosPorPeriodo] Iniciando para lojista: ${email}`);

      const qrCodes = await this.service.getQrCodesResgatadosPorPeriodo(
        usuarioId,
        dataInicio ? new Date(dataInicio) : null,
        dataFim ? new Date(dataFim) : null,
        Number(limit)
      );

      console.log(`✅ [QrCodesResgatadosPorPeriodo] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [QrCodesResgatadosPorPeriodo] Erro:`, {
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
    const { id: usuarioId, email } = req.user;
    const { dataInicio, dataFim, limit = 50 } = req.query;

    try {
      console.log(`📊 [QrCodesValidadosPorPeriodo] Iniciando para lojista: ${email}`);

      const qrCodes = await this.service.getQrCodesValidadosPorPeriodo(
        usuarioId,
        dataInicio ? new Date(dataInicio) : null,
        dataFim ? new Date(dataFim) : null,
        Number(limit)
      );

      console.log(`✅ [QrCodesValidadosPorPeriodo] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: qrCodes
      });

    } catch (error) {
      console.error(`❌ [QrCodesValidadosPorPeriodo] Erro:`, {
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
   * Calcula a taxa de validação da loja
   */
  getTaxaValidacao = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;

    try {
      console.log(`📊 [TaxaValidacao] Iniciando para lojista: ${email}`);

      const taxa = await this.service.getTaxaValidacao(usuarioId);

      console.log(`✅ [TaxaValidacao] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: { taxa }
      });

    } catch (error) {
      console.error(`❌ [TaxaValidacao] Erro:`, {
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
   * Calcula o tempo médio de validação
   */
  getTempoMedioValidacao = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;

    try {
      console.log(`📊 [TempoMedioValidacao] Iniciando para lojista: ${email}`);

      const tempoMedio = await this.service.getTempoMedioValidacao(usuarioId);

      console.log(`✅ [TempoMedioValidacao] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: { tempoMedio }
      });

    } catch (error) {
      console.error(`❌ [TempoMedioValidacao] Erro:`, {
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
   * Busca resgates com status de validação
   */
  getResgatesComValidacao = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;
    const { limit = 10 } = req.query;

    try {
      console.log(`📊 [ResgatesComValidacao] Iniciando para lojista: ${email} (limit: ${limit})`);

      const resgates = await this.service.getResgatesComValidacao(usuarioId, Number(limit));

      console.log(`✅ [ResgatesComValidacao] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: resgates
      });

    } catch (error) {
      console.error(`❌ [ResgatesComValidacao] Erro:`, {
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
   * Todos os dados do dashboard em uma única chamada
   */
  getDadosCompletos = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email } = req.user;

    try {
      console.log(`📊 [DadosCompletos] Iniciando para lojista: ${email}`);

      const dados = await this.service.getDadosCompletos(usuarioId);

      console.log(`✅ [DadosCompletos] Finalizado em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: dados
      });

    } catch (error) {
      console.error(`❌ [DadosCompletos] Erro:`, {
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

module.exports = DashboardLojaController;