const DashboardLojaRepository = require('./DashboardLojaRepository');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  try {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 6);
    dataInicio.setHours(0, 0, 0, 0);
    
    console.log('🔍 Buscando resgates por dia:', {
      lojaId: loja.id,
      dataInicio,
      dataFim
    });
    
    // Buscar resgates do período com detalhes do cupom
    const resgates = await prisma.resgate.findMany({
      where: {
        cupom: { 
          lojaId: loja.id 
        },
        resgatadoEm: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        cupom: {
          select: {
            id: true,
            precoComDesconto: true,
            precoOriginal: true
          }
        }
      },
      orderBy: {
        resgatadoEm: 'asc'
      }
    });
    
    console.log(`✅ Encontrados ${resgates.length} resgates no período`);
    
    // Agrupar por dia
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(dataInicio);
      dia.setDate(dataInicio.getDate() + i);
      
      const resgatesDia = resgates.filter(r => {
        const dataResgate = new Date(r.resgatadoEm);
        return dataResgate.toDateString() === dia.toDateString();
      });
      
      // Calcular valor total do dia
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
    
    console.log('📊 Dados processados:', dias);
    return dias;
    
  } catch (error) {
    console.error('❌ Erro em getResgatesPorDia:', error);
    throw error;
  }
}

  // ================= NOVOS MÉTODOS PARA QR CODES =================

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
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.getQrCodeStats(loja.id);
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
    return this.repository.getTaxaValidacao(loja.id);
  }

  /**
   * Calcula o tempo médio de validação
   */
  async getTempoMedioValidacao(usuarioId) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.getTempoMedioValidacao(loja.id);
  }

  /**
   * Busca resgates com valores e status de validação
   */
  async getResgatesComValidacao(usuarioId, limit = 10) {
    const loja = await this.getLojaByUsuarioId(usuarioId);
    return this.repository.findUltimosResgates(loja.id, limit);
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
      resgatesPorDia: dados.resgatesPorDia,
      // 🔥 NOVOS DADOS DE QR CODE
      qrCodeStats: await this.getQrCodeStats(usuarioId)
    };
  }

  /**
 * Buscar dados completos de uma loja específica por ID (para admin)
 * @param {string} lojaId - ID da loja
 */
async getDadosCompletosPorLojaId(lojaId) {
  try {
    console.log(`📦 Service buscando dados da loja: ${lojaId}`);
    
    // 🔥 Busca os dados completos usando o repositório
    const dados = await this.repository.findDadosCompletos(lojaId);
    
    // 🔥 Busca estatísticas de QR codes
    const qrCodeStats = await this.repository.getQrCodeStats(lojaId);
    
    // 🔥 Busca o nome da loja (se não veio no findDadosCompletos)
    const loja = await this.repository.findLojaById(lojaId);
    
    return {
      kpis: {
        loja: {
          id: lojaId,
          nome: loja?.nome || 'Loja'
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
      resgatesPorDia: dados.resgatesPorDia,
      qrCodeStats
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados da loja por ID:', error);
    throw error;
  }
}
}

module.exports = DashboardLojaService;