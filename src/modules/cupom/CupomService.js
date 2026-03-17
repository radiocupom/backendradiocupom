const CupomRepository = require('./CupomRepository');
const cache = require('../../cache/cacheHelper');

const serializeFilters = (filters = {}) => {
  const keys = Object.keys(filters).sort();
  const obj = {};
  for (const key of keys) {
    obj[key] = filters[key];
  }
  return JSON.stringify(obj);
};

class CupomService {
  constructor() {
    this.repository = new CupomRepository();
  }

  /**
   * Criar novo cupom
   */
  async createCupom(data, usuarioLogado) {
    console.log('📝 [SERVICE] createCupom - INÍCIO:', { data, usuarioId: usuarioLogado.id });

    const { 
      codigo, 
      descricao, 
      quantidadePorCliente, 
      dataExpiracao, 
      lojaId, 
      logo,
      quantidadeQrCodes = 1000,
      precoOriginal,
      precoComDesconto,
      percentualDesconto,
      nomeProduto
    } = data;

    // Validações básicas
    if (!codigo || !descricao || !quantidadePorCliente || !dataExpiracao || !lojaId) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (quantidadePorCliente < 1) {
      throw new Error('Quantidade por cliente deve ser no mínimo 1');
    }

    const dataExp = new Date(dataExpiracao);
    if (dataExp <= new Date()) {
      throw new Error('Data de expiração deve ser futura');
    }

    // Validações de preço
    if (precoOriginal && precoOriginal <= 0) {
      throw new Error('Preço original deve ser maior que zero');
    }
    if (precoComDesconto && precoComDesconto <= 0) {
      throw new Error('Preço com desconto deve ser maior que zero');
    }
    if (percentualDesconto && (percentualDesconto < 0 || percentualDesconto > 100)) {
      throw new Error('Percentual de desconto deve estar entre 0 e 100');
    }

    // Validação para lojista (USA REPOSITORY)
    if (usuarioLogado.role === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioLogado.id);
      
      if (!lojaDoUsuario) {
        throw new Error('Você não possui uma loja associada ao seu usuário');
      }

      if (lojaDoUsuario.id !== lojaId) {
        throw new Error('Você só pode criar cupons para sua própria loja');
      }
    }

    // Verificar se loja existe (USA REPOSITORY)
    const loja = await this.repository.findLojaById(lojaId);
    if (!loja) {
      throw new Error('Loja não encontrada');
    }

    // Verificar código único (USA REPOSITORY)
    const existing = await this.repository.findByCodigo(codigo);
    if (existing) {
      throw new Error('Código de cupom já existe');
    }

    // Criar cupom (USA REPOSITORY)
    const novoCupom = await this.repository.create({
      codigo,
      descricao,
      quantidadePorCliente,
      dataExpiracao: dataExp,
      lojaId,
      logo: logo || '',
      totalQrCodes: parseInt(quantidadeQrCodes),
      qrCodesUsados: 0,
      precoOriginal,
      precoComDesconto,
      percentualDesconto,
      nomeProduto,
      ativo: true
    });

    // Invalidate cache de cupons/lojas após criar
    await cache.delCacheByPrefix('cupons:');

    console.log('✅ [SERVICE] Cupom criado:', novoCupom.id);
    return novoCupom;
  }

  /**
   * Listar todos os cupons (admin/superadmin)
   */
  async getAllCupons() {
    const cacheKey = 'cupons:all';
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findAll();
    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  /**
   * Buscar cupom por ID com verificação de permissão
   */
  async getCupomById(id, usuarioLogado = null) {
    const cacheKey = `cupons:id:${id}`;
    const cached = await cache.getCache(cacheKey);
    const cupom = cached || await this.repository.findById(id);

    if (!cupom) throw new Error('Cupom não encontrado');
    
    // Verificar permissão para lojista (USA REPOSITORY)
    if (usuarioLogado?.role === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioLogado.id);
      
      if (!lojaDoUsuario) {
        throw new Error('Loja não encontrada para este usuário');
      }

      if (cupom.lojaId !== lojaDoUsuario.id) {
        throw new Error('Você só pode acessar cupons da sua própria loja');
      }
    }

    if (!cached) {
      await cache.setCache(cacheKey, cupom, 60);
    }

    return cupom;
  }

  /**
   * Buscar cupons por loja
   */
  async getCuponsByLoja(lojaId) {
    const cacheKey = `cupons:loja:${lojaId}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findByLoja(lojaId);
    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  /**
   * Buscar cupons disponíveis (público)
   */
  async getCuponsDisponiveis() {
    const cacheKey = 'cupons:disponiveis';
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findDisponiveis();
    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  /**
   * Buscar cupons do lojista logado
   */
  async getCuponsByLojista(usuarioLogado) {
    if (usuarioLogado.role !== 'loja') {
      throw new Error('Apenas lojistas podem acessar esta rota');
    }

    // USA REPOSITORY
    const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioLogado.id);

    if (!lojaDoUsuario) {
      throw new Error('Você não possui uma loja associada');
    }

    const cacheKey = `cupons:loja:${lojaDoUsuario.id}:lojista`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.repository.findByLoja(lojaDoUsuario.id);
    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  /**
   * Atualizar cupom
   */
  async updateCupom(id, data, usuarioLogado = null) {
    console.log('🔄 [SERVICE] updateCupom - INÍCIO:', { id, usuarioId: usuarioLogado?.id });

    // USA REPOSITORY
    const cupom = await this.repository.findById(id);
    
    if (!cupom) throw new Error('Cupom não encontrado');

    // Verificar permissão para lojista (USA REPOSITORY)
    if (usuarioLogado?.role === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioLogado.id);
      
      if (!lojaDoUsuario) {
        throw new Error('Loja não encontrada para este usuário');
      }

      if (cupom.lojaId !== lojaDoUsuario.id) {
        throw new Error('Você só pode atualizar cupons da sua própria loja');
      }
    }

    // Verificar código único se alterado (USA REPOSITORY)
    if (data.codigo && data.codigo !== cupom.codigo) {
      const existing = await this.repository.findByCodigo(data.codigo);
      if (existing) throw new Error('Código de cupom já existe');
    }

    // Validar data de expiração
    if (data.dataExpiracao) {
      const dataExp = new Date(data.dataExpiracao);
      if (dataExp <= new Date()) {
        throw new Error('Data de expiração deve ser futura');
      }
      data.dataExpiracao = dataExp;
    }

    // Preparar dados para atualização (remover undefined)
    const updateData = {};
    const camposPermitidos = [
      'codigo', 'descricao', 'quantidadePorCliente', 'dataExpiracao',
      'logo', 'precoOriginal', 'precoComDesconto', 'percentualDesconto',
      'nomeProduto', 'ativo'
    ];

    camposPermitidos.forEach(campo => {
      if (data[campo] !== undefined) {
        updateData[campo] = data[campo];
      }
    });

    // USA REPOSITORY
    const cupomAtualizado = await this.repository.update(id, updateData);

    // Invalidate caches relacionados a cupons
    await cache.delCacheByPrefix('cupons:');

    return cupomAtualizado;
  }

  /**
   * Deletar cupom
   */
  async deleteCupom(id, usuarioId, userRole) {
    console.log('🗑️ [SERVICE] deleteCupom - INÍCIO:', { id, usuarioId, userRole });

    // USA REPOSITORY
    const cupom = await this.repository.findById(id);
    
    if (!cupom) {
      throw new Error('Cupom não encontrado');
    }

    // Admin e Superadmin podem deletar qualquer cupom
    if (userRole === 'admin' || userRole === 'superadmin') {
      await this.repository.delete(id);
      await cache.delCacheByPrefix('cupons:');
      return { message: 'Cupom deletado com sucesso' };
    }

    // LOJISTA só pode deletar cupons da própria loja (USA REPOSITORY)
    if (userRole === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioId);
      
      if (!lojaDoUsuario) {
        throw new Error('Loja não encontrada para este usuário');
      }

      if (cupom.lojaId !== lojaDoUsuario.id) {
        throw new Error('Você só pode deletar cupons da sua própria loja');
      }

      await this.repository.delete(id);
      await cache.delCacheByPrefix('cupons:');
      return { message: 'Cupom deletado com sucesso' };
    }

    throw new Error('Apenas superadmin, admin e loja podem deletar cupons');
  }

  /**
   * Gerar QR codes adicionais
   */
  async gerarQrCodes(id, quantidade = 1, usuarioLogado = null) {
    // USA REPOSITORY
    const cupom = await this.repository.findById(id);
    
    if (!cupom) throw new Error('Cupom não encontrado');

    // Verificar permissão para lojista (USA REPOSITORY)
    if (usuarioLogado?.role === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioLogado.id);
      
      if (!lojaDoUsuario) {
        throw new Error('Loja não encontrada para este usuário');
      }

      if (cupom.lojaId !== lojaDoUsuario.id) {
        throw new Error('Você só pode gerar QR codes para cupons da sua própria loja');
      }
    }

    // USA REPOSITORY
    const cupomAtualizado = await this.repository.update(id, {
      totalQrCodes: cupom.totalQrCodes + parseInt(quantidade)
    });

    // Invalidate cache pois o cupom mudou
    await cache.delCacheByPrefix('cupons:');

    return {
      mensagem: `${quantidade} QR codes adicionados. Total agora: ${cupomAtualizado.totalQrCodes}`,
      totalQrCodes: cupomAtualizado.totalQrCodes,
      qrCodesUsados: cupomAtualizado.qrCodesUsados
    };
  }

/**
 * Estatísticas detalhadas do cupom
 */
async getEstatisticas(id, usuarioLogado = null) {
  console.log('📊 [SERVICE] getEstatisticas - INÍCIO:', { id, usuarioId: usuarioLogado?.id });

  const cacheKey = `cupons:estatisticas:${id}`;
  const cached = await cache.getCache(cacheKey);
  if (cached) return cached;

  const cupom = await this.repository.findByIdWithStats(id);
  if (!cupom) throw new Error('Cupom não encontrado');

  // Verificar permissão para lojista
  if (usuarioLogado?.role === 'loja') {
    const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioLogado.id);
    if (!lojaDoUsuario) throw new Error('Loja não encontrada para este usuário');
    if (cupom.lojaId !== lojaDoUsuario.id) {
      throw new Error('Você só pode ver estatísticas de cupons da sua própria loja');
    }
  }

  // Estatísticas básicas
  const qrCodesUsados = cupom.qrCodesUsadosList?.length || 0;
  const qrCodesValidados = cupom.qrCodesUsadosList?.filter(qr => qr.validado).length || 0;
  const qrCodesDisponiveis = cupom.totalQrCodes - qrCodesUsados;

  const totalResgates = cupom.resgates?.reduce((acc, r) => acc + r.quantidade, 0) || 0;
  
  // 🔥 CORREÇÃO: Calcular clientes únicos (NÃO usar length!)
  const clientesUnicos = new Set();
  cupom.resgates?.forEach(resgate => {
    clientesUnicos.add(resgate.clienteId);
  });
  const clientesAtendidos = clientesUnicos.size;

  // Mapa de validações por resgateId
  const validacoesMap = new Map();
  cupom.qrCodesUsadosList?.forEach(qr => {
    if (qr.resgateId) {
      validacoesMap.set(qr.resgateId, qr);
    }
  });

  // Calcular valores financeiros
  let valorTotalResgatado = 0;
  let valorTotalVendido = 0;
  let valorTotalEconomizado = 0;
  let resgatesValidados = 0;
  let resgatesPendentes = 0;

  const resgatesDetalhados = cupom.resgates?.map(resgate => {
    const qrCode = validacoesMap.get(resgate.id);
    const validado = qrCode?.validado || false;
    
    const precoOriginal = cupom.precoOriginal || 0;
    const precoComDesconto = cupom.precoComDesconto || precoOriginal;
    
    const valorOriginal = precoOriginal * resgate.quantidade;
    const valorPago = precoComDesconto * resgate.quantidade;
    const economiaPorResgate = (precoOriginal - precoComDesconto) * resgate.quantidade;
    
    valorTotalResgatado += valorOriginal;
    
    if (validado) {
      valorTotalVendido += valorPago;
      valorTotalEconomizado += economiaPorResgate;
      resgatesValidados += 1;
    } else {
      resgatesPendentes += 1;
    }
    
    return {
      id: resgate.id,
      cliente: resgate.cliente.nome,
      quantidade: resgate.quantidade,
      resgatadoEm: resgate.resgatadoEm,
      validado,
      validadoEm: qrCode?.validadoEm || null,
      valorOriginal,
      valorPago: validado ? valorPago : 0,
      economia: validado ? economiaPorResgate : 0
    };
  }) || [];

  const mediaTicket = resgatesValidados > 0 ? valorTotalVendido / resgatesValidados : 0;
  const taxaConversao = totalResgates > 0 ? (resgatesValidados / totalResgates) * 100 : 0;

  const result = {
    cupom: {
      id: cupom.id,
      codigo: cupom.codigo,
      descricao: cupom.descricao,
      loja: cupom.loja.nome,
      totalQrCodes: cupom.totalQrCodes,
      qrCodesUsados,
      precoOriginal: cupom.precoOriginal,
      precoComDesconto: cupom.precoComDesconto,
      percentualDesconto: cupom.percentualDesconto,
      nomeProduto: cupom.nomeProduto
    },
    estatisticas: {
      totalQrCodes: cupom.totalQrCodes,
      qrCodesUsados,
      qrCodesValidados,
      qrCodesDisponiveis,
      totalResgates,
      clientesAtendidos,  // ← AGORA CORRETO (1, não 4)
      resgatesValidados,
      resgatesPendentes,
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      mediaTicket,
      taxaConversao
    },
    resgates: resgatesDetalhados
  };

  await cache.setCache(cacheKey, result, 60);
  return result;
}

  /**
   * Ativar cupom
   */
  async ativarCupom(id, usuarioId, userRole) {
    console.log('🔛 [SERVICE] ativarCupom - INÍCIO:', { id, usuarioId, userRole });

    // USA REPOSITORY
    const cupom = await this.repository.findById(id);
    
    if (!cupom) {
      throw new Error('Cupom não encontrado');
    }

    // Verificar permissão para lojista (USA REPOSITORY)
    if (userRole === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioId);
      
      if (!lojaDoUsuario) {
        throw new Error('Loja não encontrada para este usuário');
      }

      if (cupom.lojaId !== lojaDoUsuario.id) {
        throw new Error('Você só pode ativar cupons da sua própria loja');
      }
    }

    // USA REPOSITORY
    const cupomAtualizado = await this.repository.update(id, { ativo: true });
    await cache.delCacheByPrefix('cupons:');
    return cupomAtualizado;
  }

  /**
   * Desativar cupom
   */
  async desativarCupom(id, usuarioId, userRole) {
    console.log('🔚 [SERVICE] desativarCupom - INÍCIO:', { id, usuarioId, userRole });

    // USA REPOSITORY
    const cupom = await this.repository.findById(id);
    
    if (!cupom) {
      throw new Error('Cupom não encontrado');
    }

    // Verificar permissão para lojista (USA REPOSITORY)
    if (userRole === 'loja') {
      const lojaDoUsuario = await this.repository.findLojaByUsuarioId(usuarioId);
      
      if (!lojaDoUsuario) {
        throw new Error('Loja não encontrada para este usuário');
      }

      if (cupom.lojaId !== lojaDoUsuario.id) {
        throw new Error('Você só pode desativar cupons da sua própria loja');
      }
    }

    // USA REPOSITORY
    const cupomAtualizado = await this.repository.update(id, { ativo: false });
    await cache.delCacheByPrefix('cupons:');
    return cupomAtualizado;
  }
}

module.exports = CupomService;