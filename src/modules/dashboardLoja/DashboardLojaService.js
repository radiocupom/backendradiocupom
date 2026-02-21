const DashboardLojaRepository = require('./DashboardLojaRepository');

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
    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioMes = new Date(hoje);
    inicioMes.setDate(1);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
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
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      ticketMedio,
      cuponsComPreco
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
      this.repository.getValorTotalResgatado(loja.id),
      this.repository.getValorTotalVendido(loja.id),
      this.repository.getValorTotalEconomizado(loja.id),
      this.repository.getTicketMedio(loja.id),
      this.repository.getCuponsComPreco(loja.id)
    ]);
    
    return {
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
        valorTotalEconomizado,
        ticketMedio
      }
    };
  }

  /**
   * Últimos resgates da loja com valores
   */
  async getUltimosResgates(usuarioId, limit = 10) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findUltimosResgates(loja.id, limit);
  }

  /**
   * Cupons mais resgatados da loja com informações de preço
   */
  async getCuponsPopulares(usuarioId, limit = 5) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    const cupons = await this.repository.findCuponsMaisResgatados(loja.id, limit);
    
    return cupons.map(cupom => ({
      id: cupom.id,
      descricao: cupom.descricao,
      codigo: cupom.codigo,
      precoOriginal: cupom.precoOriginal,
      precoComDesconto: cupom.precoComDesconto,
      percentualDesconto: cupom.percentualDesconto,
      nomeProduto: cupom.nomeProduto,
      totalResgates: cupom._count.resgates,
      dataExpiracao: cupom.dataExpiracao,
      valorTotalGerado: (cupom.precoComDesconto || 0) * (cupom._count.resgates || 0)
    }));
  }

  /**
   * Resgates por dia (últimos 7 dias) com valores
   */
  async getResgatesPorDia(usuarioId) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 6);
    dataInicio.setHours(0, 0, 0, 0);
    
    const resgates = await this.repository.findResgatesPorDia(loja.id, dataInicio, dataFim);
    
    // Agrupar por dia
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(dataInicio);
      dia.setDate(dataInicio.getDate() + i);
      
      const resgatesDia = resgates.filter(r => {
        const dataResgate = new Date(r.resgatadoEm);
        return dataResgate.toDateString() === dia.toDateString();
      });
      
      dias.push({
        dia: dia.toLocaleDateString('pt-BR', { weekday: 'short' }),
        data: dia.toISOString().split('T')[0],
        total: resgatesDia.reduce((acc, r) => acc + (r._count || 0), 0),
        valorTotal: 0 // Seria necessário buscar os cupons para calcular
      });
    }
    
    return dias;
  }

  /**
   * Todos os dados do dashboard em uma única chamada
   */
  async getDadosCompletos(usuarioId) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    const dados = await this.repository.findDadosCompletos(loja.id);
    
    return {
      kpis: {
        loja: {
          id: loja.id,
          nome: loja.nome
        },
        cupons: dados.totais.cupons,
        resgates: dados.totais.resgates,
        qrCodes: dados.totais.qrCodes,
        clientes: {
          total: dados.totais.clientes
        },
        financeiro: dados.totais.financeiro
      },
      ultimosResgates: dados.ultimosResgates,
      cuponsPopulares: dados.cuponsPopulares,
      resgatesPorDia: dados.resgatesPorDia
    };
  }
}

module.exports = DashboardLojaService;