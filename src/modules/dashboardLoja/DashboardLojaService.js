const DashboardLojaRepository = require('./DashboardLojaRepository');
const cache = require('../../cache/cacheHelper');

class DashboardLojaService {
  constructor() {
    this.repository = new DashboardLojaRepository();
  }

  /**
   * Busca a loja pelo ID do usuário
   */
  async getLojaByUsuarioId(usuarioId) {
    const loja = await this.repository.findLojaByUsuarioId(usuarioId);

    if (!loja) {
      throw new Error('Loja não encontrada para este usuário');
    }

    return loja;
  }

/**
 * KPIs principais da loja com dados financeiros
 */
async getKPIs(usuarioId) {
    const cacheKey = `dashboard-loja:${usuarioId}:kpis`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const loja = await this.getLojaByUsuarioId(usuarioId);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje);
  inicioMes.setDate(1);

  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());

  // Buscar dados CRUS do repository
  const [
    totalCupons,
    cuponsAtivos,
    totalResgates,
    resgatesHoje,
    resgatesSemana,
    resgatesMes,
    totalQrCodes,
    qrCodesValidados,
    totalClientes,
    resgatesComValores,
    qrCodesValidadosLista,
    resgatesComQRValidados
  ] = await Promise.all([
    this.repository.countCupons(loja.id),
    this.repository.countCuponsAtivos(loja.id),
    this.repository.countResgates(loja.id),
    this.repository.countResgatesPorPeriodo(loja.id, hoje),
    this.repository.countResgatesPorPeriodo(loja.id, inicioSemana),
    this.repository.countResgatesPorPeriodo(loja.id, inicioMes),
    this.repository.countQrCodes(loja.id),
    this.repository.countQrCodes(loja.id, true),
    this.repository.countClientesUnicos(loja.id),
    this.repository.findResgatesComValores(loja.id),
    this.repository.findQrCodesValidados(loja.id, null, null, 10000),
    this.repository.findResgatesComQRValidados(loja.id)
  ]);

  // ================= REGRAS DE NEGÓCIO: Cálculos financeiros =================

  // 1. Valor Total Resgatado (SOMA DE TODOS OS RESGATES - preço original)
  const valorTotalResgatado = resgatesComValores.reduce((acc, r) => {
    return acc + (r.cupom.precoOriginal || 0) * (r.quantidade || 1);
  }, 0);

  // 2. Valor Total Vendido e Economia Real (APENAS resgates validados)
  let valorTotalVendido = 0;
  let valorTotalEconomizado = 0; // ← AGORA CALCULADO CORRETAMENTE

  resgatesComQRValidados.forEach(resgate => {
    // Filtrar APENAS os QR codes validados deste resgate
    const qrCodesValidados = resgate.qrCodes?.filter(qr => qr.validado) || [];
    const quantidadeValidada = qrCodesValidados.length;
    
    const precoOriginal = resgate.cupom.precoOriginal || 0;
    const precoComDesconto = resgate.cupom.precoComDesconto || precoOriginal;
    
    // Valor vendido (preço com desconto * quantidade validada)
    valorTotalVendido += precoComDesconto * quantidadeValidada;
    
    // 🔥 ECONOMIA REAL = (preço original - preço com desconto) * quantidade validada
    const economiaPorItem = (precoOriginal - precoComDesconto) * quantidadeValidada;
    valorTotalEconomizado += economiaPorItem;
  });

  // 3. Ticket Médio (apenas considerando validações)
  const ticketMedio = qrCodesValidados > 0 
    ? valorTotalVendido / qrCodesValidados 
    : 0;

  // 4. Cupons com preço
  const cuponsComPreco = await this.repository.countCuponsComPreco(loja.id);

  // ================= LOG PARA DEBUG =================
  console.log('📊 [getKPIs] Cálculos financeiros:', {
    valorTotalResgatado,
    valorTotalVendido,
    valorTotalEconomizado,
    ticketMedio,
    qrCodesValidados,
    totalResgatesComValidacao: resgatesComQRValidados.length
  });

  // ================= RETORNO =================
  const result = {
    loja: {
      id: loja.id,
      nome: loja.nome
    },
    cupons: {
      total: totalCupons,
      ativos: cuponsAtivos,
      expirados: totalCupons - cuponsAtivos,
      comPreco: cuponsComPreco
    },
    resgates: {
      total: totalResgates,
      hoje: resgatesHoje,
      semana: resgatesSemana,
      mes: resgatesMes
    },
    qrCodes: {
      total: totalQrCodes,
      validados: qrCodesValidados,
      pendentes: totalQrCodes - qrCodesValidados
    },
    clientes: {
      total: totalClientes
    },
    financeiro: {
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado, // ← AGORA É O DESCONTO REAL
      ticketMedio
    }
  };

  // Cache curto para aliviar consultas pesadas ao banco
  await cache.setCache(cacheKey, result, 60); // ttl: 60s
  return result;
}
 /**
 * Últimos resgates da loja com valores e status
 */
async getUltimosResgates(usuarioId, limit = 10) {
  const cacheKey = `dashboard-loja:${usuarioId}:ultimos-resgates:${limit}`;
  const cached = await cache.getCache(cacheKey);
  if (cached) return cached;

  const loja = await this.getLojaByUsuarioId(usuarioId);
  
  // Buscar resgates com qrCodes já inclusos pelo repository
  const resgates = await this.repository.findUltimosResgates(loja.id, limit);
  
  const result = resgates.map(resgate => {
    const qrCodesValidados = resgate.qrCodes?.filter(qr => qr.validado) || [];
    const quantidadeValidada = qrCodesValidados.length;
    
    return {
      id: resgate.id,
      clienteId: resgate.clienteId,
      cupomId: resgate.cupomId,
      quantidade: resgate.quantidade,
      quantidadeValidada,
      resgatadoEm: resgate.resgatadoEm,
      cliente: resgate.cliente,
      cupom: resgate.cupom,
      qrCodes: resgate.qrCodes,
      status: quantidadeValidada === 0 ? 'pendente' :
              quantidadeValidada === resgate.quantidade ? 'validado' : 'parcial',
      valorOriginal: (resgate.cupom.precoOriginal || 0) * resgate.quantidade,
      valorPago: (resgate.cupom.precoComDesconto || 0) * quantidadeValidada,
      economia: ((resgate.cupom.precoOriginal || 0) - (resgate.cupom.precoComDesconto || 0)) * quantidadeValidada
    };
  });

  await cache.setCache(cacheKey, result, 30);
  return result;
}
  /**
   * Cupons mais resgatados da loja
   */
  async getCuponsPopulares(usuarioId, limit = 5) {
    const cacheKey = `dashboard-loja:${usuarioId}:cupons-populares:${limit}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const cupons = await this.repository.findCuponsMaisResgatados(loja.id, limit);

    const result = cupons.map(cupom => ({
      id: cupom.id,
      descricao: cupom.descricao,
      codigo: cupom.codigo,
      precoOriginal: cupom.precoOriginal,
      precoComDesconto: cupom.precoComDesconto,
      percentualDesconto: cupom.percentualDesconto,
      nomeProduto: cupom.nomeProduto,
      totalResgates: Number(cupom._count.resgates),
      dataExpiracao: cupom.dataExpiracao,
      valorTotalGerado: (cupom.precoComDesconto || 0) * (cupom._count.resgates || 0)
    }));

    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  /**
   * Resgates por dia (últimos 7 dias)
   */
  async getResgatesPorDia(usuarioId) {
    const cacheKey = `dashboard-loja:${usuarioId}:resgates-por-dia`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const loja = await this.getLojaByUsuarioId(usuarioId);

    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 6);
    dataInicio.setHours(0, 0, 0, 0);

    const resgates = await this.repository.findResgatesPorDia(loja.id, dataInicio, dataFim);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(dataInicio);
      dia.setDate(dataInicio.getDate() + i);

      const resgatesDia = resgates.filter(r => {
        const dataResgate = new Date(r.resgatadoEm);
        return dataResgate.toDateString() === dia.toDateString();
      });

      const valorTotalDia = resgatesDia.reduce((acc, r) => {
        return acc + (r.cupom?.precoComDesconto || 0);
      }, 0);

      dias.push({
        dia: dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        data: dia.toISOString().split('T')[0],
        total: resgatesDia.length,
        valorTotal: valorTotalDia
      });
    }

    await cache.setCache(cacheKey, dias, 30);
    return dias;
  }

  /**
   * Busca QR codes resgatados
   */
  async getQrCodesResgatados(usuarioId, limit = 50) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findQrCodesResgatados(loja.id, null, null, limit);
  }

  /**
   * Busca QR codes validados
   */
  async getQrCodesValidados(usuarioId, limit = 50) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findQrCodesValidados(loja.id, null, null, limit);
  }

  /**
   * Busca estatísticas de validação de QR codes
   */
  async getQrCodeStats(usuarioId) {
    const cacheKey = `dashboard-loja:${usuarioId}:qr-code-stats`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);

    const inicioMes = new Date(hoje);
    inicioMes.setDate(hoje.getDate() - 30);

    const [
      totalResgatados,
      totalValidados,
      resgatadosHoje,
      validadosHoje,
      resgatadosSemana,
      validadosSemana,
      resgatadosMes,
      validadosMes
    ] = await Promise.all([
      this.repository.countQrCodes(loja.id),
      this.repository.countQrCodes(loja.id, true),
      this.repository.countQrCodesPorPeriodo(loja.id, hoje, new Date(), false),
      this.repository.countQrCodesPorPeriodo(loja.id, hoje, new Date(), true),
      this.repository.countQrCodesPorPeriodo(loja.id, inicioSemana, new Date(), false),
      this.repository.countQrCodesPorPeriodo(loja.id, inicioSemana, new Date(), true),
      this.repository.countQrCodesPorPeriodo(loja.id, inicioMes, new Date(), false),
      this.repository.countQrCodesPorPeriodo(loja.id, inicioMes, new Date(), true)
    ]);

    const taxaValidacao = totalResgatados > 0 ? (totalValidados / totalResgatados) * 100 : 0;
    
    const tempoMedioValidacao = await this.getTempoMedioValidacao(usuarioId);

    const result = {
      totais: {
        resgatados: totalResgatados,
        validados: totalValidados,
        pendentes: totalResgatados - totalValidados
      },
      hoje: {
        resgatados: resgatadosHoje,
        validados: validadosHoje,
        pendentes: resgatadosHoje - validadosHoje
      },
      semana: {
        resgatados: resgatadosSemana,
        validados: validadosSemana,
        pendentes: resgatadosSemana - validadosSemana
      },
      mes: {
        resgatados: resgatadosMes,
        validados: validadosMes,
        pendentes: resgatadosMes - validadosMes
      },
      taxaValidacao,
      tempoMedioValidacao: tempoMedioValidacao || 0
    };

    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  /**
   * Busca QR codes com filtros avançados
   */
  async getQrCodesWithFilters(usuarioId, filters) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findQrCodesWithFilters(loja.id, filters);
  }

  /**
   * Busca QR codes resgatados por período
   */
  async getQrCodesResgatadosPorPeriodo(usuarioId, dataInicio, dataFim, limit = 50) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findQrCodesResgatados(loja.id, dataInicio, dataFim, limit);
  }

  /**
   * Busca QR codes validados por período
   */
  async getQrCodesValidadosPorPeriodo(usuarioId, dataInicio, dataFim, limit = 50) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findQrCodesValidados(loja.id, dataInicio, dataFim, limit);
  }

  /**
   * Calcula a taxa de validação da loja
   */
  async getTaxaValidacao(usuarioId) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const total = await this.repository.countQrCodes(loja.id);
    if (total === 0) return 0;
    
    const validados = await this.repository.countQrCodes(loja.id, true);
    
    return (validados / total) * 100;
  }

  /**
   * Calcula o tempo médio de validação
   */
  async getTempoMedioValidacao(usuarioId) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const qrCodes = await this.repository.findQrCodesComTempoValidacao(loja.id, 1000);

    if (qrCodes.length === 0) return 0;

    const totalHoras = qrCodes.reduce((acc, qr) => {
      const diffMs = new Date(qr.validadoEm) - new Date(qr.usadoEm);
      const diffHoras = diffMs / (1000 * 60 * 60);
      return acc + diffHoras;
    }, 0);

    return totalHoras / qrCodes.length;
  }

  /**
   * Busca resgates com status de validação
   */
  async getResgatesComValidacao(usuarioId, limit = 10) {
    return this.getUltimosResgates(usuarioId, limit);
  }

  /**
   * Todos os dados do dashboard em uma única chamada
   */
  async getDadosCompletos(usuarioId) {
    const cacheKey = `dashboard-loja:${usuarioId}:dados-completos`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const [
      kpis,
      ultimosResgates,
      cuponsPopulares,
      resgatesPorDia,
      qrCodeStats
    ] = await Promise.all([
      this.getKPIs(usuarioId),
      this.getUltimosResgates(usuarioId, 5),
      this.getCuponsPopulares(usuarioId, 5),
      this.getResgatesPorDia(usuarioId),
      this.getQrCodeStats(usuarioId)
    ]);

    const result = {
      kpis,
      ultimosResgates,
      cuponsPopulares,
      resgatesPorDia,
      qrCodeStats
    };

    await cache.setCache(cacheKey, result, 60); // ttl: 60s
    return result;
  }
}

module.exports = DashboardLojaService;