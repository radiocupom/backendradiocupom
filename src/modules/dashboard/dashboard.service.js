const DashboardRepository = require('./dashboard.repository');

class DashboardService {
  constructor() {
    this.repository = new DashboardRepository();
  }

  /**
   * KPIs principais do sistema (visão global)
   */
  async getKPIs() {
    const [
      totalLojas,
      lojasAtivas,
      lojasInativas,
      totalUsuarios,
      totalClientes,
      totalCupons,
      cuponsAtivos,
      cuponsExpirados,
      cuponsComPreco,
      totalResgates,
      resgatesHoje,
      resgatesSemana,
      resgatesMes,
      totalQrCodes,
      qrCodesValidados,
      qrCodesPendentes,
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      ticketMedio
    ] = await Promise.all([
      this.repository.countLojas(),
      this.repository.countLojasAtivas(),
      this.repository.countLojasInativas(),
      this.repository.countUsuarios(),
      this.repository.countClientes(),
      this.repository.countTotalCupons(),
      this.repository.countCuponsAtivos(),
      this.repository.countCuponsExpirados(),
      this.repository.countCuponsComPreco(),
      this.repository.countTotalResgates(),
      this.repository.countResgatesHoje(),
      this.repository.countResgatesSemana(),
      this.repository.countResgatesMes(),
      this.repository.countTotalQrCodes(),
      this.repository.countQrCodesValidados(),
      this.repository.countQrCodesPendentes(),
      this.repository.getValorTotalResgatado(),
      this.repository.getValorTotalVendido(),
      this.repository.getValorTotalEconomizado(),
      this.repository.getTicketMedio()
    ]);

    const taxaConversao = totalResgates > 0 
      ? (qrCodesValidados / totalResgates) * 100 
      : 0;

    return {
      // Lojas
      totalLojas,
      lojasAtivas,
      lojasInativas,
      
      // Usuários
      totalUsuarios,
      
      // Clientes
      totalClientes,
      
      // Cupons
      totalCupons,
      cuponsAtivos,
      cuponsExpirados,
      cuponsComPreco,
      
      // Resgates
      totalResgates,
      resgatesHoje,
      resgatesSemana,
      resgatesMes,
      
      // QR Codes
      totalQrCodes,
      qrCodesValidados,
      qrCodesPendentes,
      
      // Financeiro
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      ticketMedio,
      taxaConversao
    };
  }

  /**
   * Últimas transações do sistema com status
   */
  async getRecentTransactions(limit = 10) {
    const resgates = await this.repository.findRecentResgates(limit);
    
    return resgates.map(resgate => {
      const qrCodesValidados = resgate.qrCodes?.filter(qr => qr.validado) || [];
      const quantidadeValidada = qrCodesValidados.length;
      
      return {
        id: resgate.id,
        quantidade: resgate.quantidade,
        quantidadeValidada,
        resgatadoEm: resgate.resgatadoEm,
        status: quantidadeValidada === 0 ? 'pendente' :
                quantidadeValidada === resgate.quantidade ? 'validado' : 'parcial',
        cliente: resgate.cliente,
        cupom: {
          id: resgate.cupom.id,
          descricao: resgate.cupom.descricao,
          codigo: resgate.cupom.codigo,
          precoOriginal: resgate.cupom.precoOriginal,
          precoComDesconto: resgate.cupom.precoComDesconto,
          loja: resgate.cupom.loja
        },
        qrCodes: resgate.qrCodes?.map(qr => ({
          id: qr.id,
          validado: qr.validado,
          validadoEm: qr.validadoEm
        })) || []
      };
    });
  }

  /**
   * Cupons mais resgatados do sistema
   */
  async getCuponsPopulares(limit = 5) {
    const cupons = await this.repository.findCuponsMaisResgatados(limit);
    
    return cupons.map(cupom => ({
      id: cupom.id,
      descricao: cupom.descricao,
      codigo: cupom.codigo,
      precoOriginal: cupom.precoOriginal,
      precoComDesconto: cupom.precoComDesconto,
      percentualDesconto: cupom.percentualDesconto,
      nomeProduto: cupom.nomeProduto,
      totalResgates: Number(cupom._count.resgates),
      dataExpiracao: cupom.dataExpiracao,
      valorTotalGerado: (cupom.precoComDesconto || 0) * (cupom._count.resgates || 0),
      lojaNome: cupom.loja?.nome
    }));
  }

  /**
   * Resgates por dia (últimos 7 dias)
   */
  async getResgatesPorDia() {
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 6);
    dataInicio.setHours(0, 0, 0, 0);

    const resgates = await this.repository.findResgatesPorDia(dataInicio, dataFim);

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

    return dias;
  }

  /**
   * Busca QR codes resgatados
   */
  async getQrCodesResgatados(limit = 50) {
    return this.repository.findQrCodesResgatados(null, null, limit);
  }

  /**
   * Busca QR codes validados
   */
  async getQrCodesValidados(limit = 50) {
    return this.repository.findQrCodesValidados(null, null, limit);
  }

  /**
   * Busca estatísticas de validação de QR codes
   */
  async getQrCodeStats() {
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
      validadosMes,
      taxaValidacao,
      tempoMedioValidacao
    ] = await Promise.all([
      this.repository.countTotalQrCodes(),
      this.repository.countQrCodesValidados(),
      this.repository.countQrCodesPorPeriodo(hoje, new Date(), false),
      this.repository.countQrCodesPorPeriodo(hoje, new Date(), true),
      this.repository.countQrCodesPorPeriodo(inicioSemana, new Date(), false),
      this.repository.countQrCodesPorPeriodo(inicioSemana, new Date(), true),
      this.repository.countQrCodesPorPeriodo(inicioMes, new Date(), false),
      this.repository.countQrCodesPorPeriodo(inicioMes, new Date(), true),
      this.getTaxaValidacao(),
      this.getTempoMedioValidacao()
    ]);

    return {
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
  }

  /**
   * Busca QR codes com filtros avançados
   */
  async getQrCodesWithFilters(filters) {
    return this.repository.findQrCodesWithFilters(filters);
  }

  /**
   * Busca QR codes resgatados por período
   */
  async getQrCodesResgatadosPorPeriodo(dataInicio, dataFim, limit = 50) {
    return this.repository.findQrCodesResgatados(dataInicio, dataFim, limit);
  }

  /**
   * Busca QR codes validados por período
   */
  async getQrCodesValidadosPorPeriodo(dataInicio, dataFim, limit = 50) {
    return this.repository.findQrCodesValidados(dataInicio, dataFim, limit);
  }

  /**
   * Calcula a taxa de validação global
   */
  async getTaxaValidacao() {
    const total = await this.repository.countTotalQrCodes();
    if (total === 0) return 0;
    
    const validados = await this.repository.countQrCodesValidados();
    return (validados / total) * 100;
  }

  /**
   * Calcula o tempo médio de validação global
   */
  async getTempoMedioValidacao() {
    const qrCodes = await this.repository.findQrCodesComTempoValidacao(1000);
    
    if (qrCodes.length === 0) return 0;

    const totalHoras = qrCodes.reduce((acc, qr) => {
      const diffMs = new Date(qr.validadoEm) - new Date(qr.usadoEm);
      const diffHoras = diffMs / (1000 * 60 * 60);
      return acc + diffHoras;
    }, 0);

    return totalHoras / qrCodes.length;
  }

  /**
   * Distribuição de lojas por categoria
   */
  async getStoreDistribution() {
    const distribution = await this.repository.findStoreDistribution();
    
    const total = distribution.reduce((acc, item) => acc + item._count.id, 0);
    
    return distribution.map(item => ({
      categoria: item.categoria,
      categoriaLabel: this.getCategoriaLabel(item.categoria),
      _count: { id: item._count.id },
      quantidade: item._count.id,
      percentual: total > 0 ? (item._count.id / total) * 100 : 0
    }));
  }

  /**
   * Ranking de lojas por resgates
   */
  async getStoreRanking(limit = 5) {
    return this.repository.findStoreRanking(limit);
  }

  /**
   * Métricas de crescimento
   */
  async getGrowthMetrics() {
    const [totalLojas, totalClientes, totalResgates] = await Promise.all([
      this.repository.countLojas(),
      this.repository.countClientes(),
      this.repository.countTotalResgates()
    ]);

    return {
      totalLojas,
      totalClientes,
      totalResgates
    };
  }

  /**
   * Todos os dados do dashboard em uma única chamada
   */
  async getDadosCompletos() {
    const [
      kpis,
      recentTransactions,
      cuponsPopulares,
      resgatesPorDia,
      qrCodeStats,
      storeDistribution,
      storeRanking,
      growthMetrics
    ] = await Promise.all([
      this.getKPIs(),
      this.getRecentTransactions(10),
      this.getCuponsPopulares(5),
      this.getResgatesPorDia(),
      this.getQrCodeStats(),
      this.getStoreDistribution(),
      this.getStoreRanking(5),
      this.getGrowthMetrics()
    ]);

    return {
      kpis,
      recentTransactions,
      cuponsPopulares,
      resgatesPorDia,
      qrCodeStats,
      storeDistribution,
      storeRanking,
      growthMetrics
    };
  }

  /**
   * Utilitário para traduzir categoria
   */
  getCategoriaLabel(categoria) {
    const mapa = {
      RESTAURANTE: 'Restaurante',
      SUPERMERCADO: 'Supermercado',
      PADARIA: 'Padaria',
      LOJA_DE_ROUPAS: 'Moda',
      ELETRONICOS: 'Eletrônicos',
      OUTROS: 'Outros'
    };
    return mapa[categoria] || categoria;
  }
}

module.exports = DashboardService;