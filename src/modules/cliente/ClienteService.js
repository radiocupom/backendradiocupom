// ClienteService.js
const ClienteRepository = require('./ClienteRepository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cache = require('../../cache/cacheHelper');

const serializeFilters = (filters = {}) => {
  const keys = Object.keys(filters).sort();
  const obj = {};
  for (const key of keys) {
    obj[key] = filters[key];
  }
  return JSON.stringify(obj);
};

class ClienteService {
  constructor() {
    this.repository = new ClienteRepository();
  }

  // ================= UTILITÁRIOS =================
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [ClienteService] ${message}`, data);
  }

  calcularIdade(dataNascimento) {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mes = hoje.getMonth() - dataNascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // ================= CRIAÇÃO DE CLIENTE =================
  async createCliente(data) {
    this.log('log', 'createCliente - Iniciando', { data });

    const { 
      nome, email, senha, whatsapp,
      bairro, cidade, estado, pais = 'Brasil',
      genero, dataNascimento, instagram, facebook, tiktok,
      receberOfertas = true, comoConheceu, observacoes 
    } = data;

    // Validações
    if (!nome || !email || !senha || !whatsapp) {
      throw new Error('Nome, email, senha e whatsapp são obrigatórios');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    // Verificar se email já existe
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new Error('Email já cadastrado');

    // Validar idade mínima (18 anos)
    if (dataNascimento) {
      const idade = this.calcularIdade(new Date(dataNascimento));
      if (idade < 18) {
        throw new Error('Cliente deve ter pelo menos 18 anos');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Preparar dados para criação
    const clienteData = {
      nome,
      email,
      senha: hashedPassword,
      whatsapp,
      pais,
      receberOfertas,
      ativo: true
    };

    // Adicionar campos opcionais
    if (bairro) clienteData.bairro = bairro;
    if (cidade) clienteData.cidade = cidade;
    if (estado) clienteData.estado = estado;
    if (genero) clienteData.genero = genero;
    if (instagram) clienteData.instagram = instagram;
    if (facebook) clienteData.facebook = facebook;
    if (tiktok) clienteData.tiktok = tiktok;
    if (comoConheceu) clienteData.comoConheceu = comoConheceu;
    if (observacoes) clienteData.observacoes = observacoes;
    
    if (dataNascimento) {
      clienteData.dataNascimento = new Date(dataNascimento);
    }

    // Criar cliente
    const cliente = await this.repository.create(clienteData);
    
    // Remover senha do retorno
    const { senha: _, ...clienteSemSenha } = cliente;
    
    this.log('log', 'createCliente - Cliente criado', { id: cliente.id });

    // Invalidate caches que dependem da lista de clientes / estatísticas
    await cache.delCacheByPrefix('clientes:');

    return clienteSemSenha;
  }

  // ================= AUTENTICAÇÃO =================
  async autenticar(email, senha) {
    this.log('log', 'autenticar - Iniciando', { email });

    if (!email || !senha) {
      throw new Error('Email e senha são obrigatórios');
    }

    // Buscar cliente com senha para validação
    const cliente = await this.repository.findByEmailWithPassword(email);
    if (!cliente) throw new Error('Cliente não encontrado');

    // Validar se cliente está ativo
    if (!cliente.ativo) {
      throw new Error('Conta desativada. Entre em contato com o suporte.');
    }

    // Validar senha
    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    if (!senhaValida) throw new Error('Senha incorreta');

    // Atualizar último login
    await this.repository.update(cliente.id, { ultimoLogin: new Date() });

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: cliente.id, 
        email: cliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET_CLIENTE,
      { expiresIn: '30d' }
    );

    // Remover senha do retorno
    const { senha: _, ...clienteSemSenha } = cliente;

    this.log('log', 'autenticar - Login realizado', { id: cliente.id });

    return {
      cliente: clienteSemSenha,
      token,
      expiresIn: '30d'
    };
  }

  // ================= LISTAGENS COM PAGINAÇÃO =================
  async getAllClientes(page = 1, limit = 20, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
    this.log('log', 'getAllClientes', { page, limit, filters, sortBy, sortOrder });

    const filterKey = serializeFilters(filters);
    const cacheKey = `clientes:all:${page}:${limit}:${sortBy}:${sortOrder}:${filterKey}`;

    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    const result = await this.repository.findAll(skip, limit, filters, sortBy, sortOrder);

    const response = {
      clientes: result.clientes,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      }
    };

    await cache.setCache(cacheKey, response, 30);
    return response;
  }

  async getClienteById(id) {
    this.log('log', 'getClienteById', { id });

    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    return cliente;
  }

  async getClienteByEmail(email) {
    this.log('log', 'getClienteByEmail', { email });

    const cliente = await this.repository.findByEmail(email);
    if (!cliente) throw new Error('Cliente não encontrado');

    return cliente;
  }

  // ================= ESTATÍSTICAS GERAIS =================
  async getEstatisticasGerais() {
    this.log('log', 'getEstatisticasGerais');

    const cacheKey = 'clientes:estatisticas-gerais';
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const [
      totalClientes,
      clientesAtivos,
      clientesNovosMes,
      totalResgates,
      resgatesMes,
      totalQrCodes,
      qrCodesValidados,
      valorEconomizado,
      topClientes
    ] = await Promise.all([
      this.repository.countClientes(),
      this.repository.countClientesAtivos(),
      this.repository.countClientesNovosMes(),
      this.repository.countTotalResgates(),
      this.repository.countResgatesMes(),
      this.repository.countTotalQrCodes(),
      this.repository.countQrCodesValidados(),
      this.repository.sumEconomiaClientes(),
      this.repository.getTopClientes(5)
    ]);

    const taxaConversao = totalQrCodes > 0 
      ? Number(((qrCodesValidados / totalQrCodes) * 100).toFixed(1))
      : 0;

    const result = {
      clientes: {
        total: totalClientes,
        ativos: clientesAtivos,
        novosMes: clientesNovosMes,
        inativos: totalClientes - clientesAtivos
      },
      resgates: {
        total: totalResgates,
        mes: resgatesMes,
        mediaPorCliente: totalClientes > 0 ? Number((totalResgates / totalClientes).toFixed(1)) : 0
      },
      qrCodes: {
        total: totalQrCodes,
        validados: qrCodesValidados,
        pendentes: totalQrCodes - qrCodesValidados,
        taxaValidacao: `${taxaConversao}%`
      },
      financeiro: {
        economiaTotal: this.formatarMoeda(valorEconomizado || 0)
      },
      topClientes
    };

    await cache.setCache(cacheKey, result, 60);
    return result;
  }

  // ================= ESTATÍSTICAS DO CLIENTE =================
  async getEstatisticasCliente(id) {
    this.log('log', 'getEstatisticasCliente', { id });

    const cacheKey = `clientes:estatisticas:${id}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const cliente = await this.repository.findEstatisticas(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    // Calcular estatísticas dos resgates
    const estatisticasResgates = cliente.resgates?.reduce((acc, resgate) => {
      acc.totalResgates++;
      acc.cuponsUnicos.add(resgate.cupomId);
      acc.totalQuantidade += resgate.quantidade;
      acc.totalGasto += resgate.cupom?.precoComDesconto || 0;
      acc.totalEconomizado += (resgate.cupom?.precoOriginal || 0) - (resgate.cupom?.precoComDesconto || 0);
      
      if (!acc.ultimoResgate || new Date(resgate.resgatadoEm) > new Date(acc.ultimoResgate.data)) {
        acc.ultimoResgate = {
          data: resgate.resgatadoEm,
          cupomId: resgate.cupomId,
          cupomCodigo: resgate.cupom?.codigo
        };
      }
      
      return acc;
    }, {
      totalResgates: 0,
      cuponsUnicos: new Set(),
      totalQuantidade: 0,
      totalGasto: 0,
      totalEconomizado: 0,
      ultimoResgate: null
    });

    // Buscar QR codes do cliente
    const qrCodes = await this.repository.findQrCodesByCliente(id, 1, 1000, null);
    
    const qrCodesValidados = qrCodes.qrCodes.filter(q => q.validado).length;
    const qrCodesPendentes = qrCodes.qrCodes.filter(q => !q.validado).length;

    const result = {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        whatsapp: cliente.whatsapp,
        cidade: cliente.cidade,
        estado: cliente.estado,
        ativo: cliente.ativo,
        createdAt: cliente.createdAt
      },
      resgates: {
        total: estatisticasResgates.totalResgates,
        cuponsUnicos: estatisticasResgates.cuponsUnicos.size,
        quantidadeTotal: estatisticasResgates.totalQuantidade,
        ultimoResgate: estatisticasResgates.ultimoResgate,
        mediaQuantidadePorResgate: estatisticasResgates.totalResgates > 0 
          ? Number((estatisticasResgates.totalQuantidade / estatisticasResgates.totalResgates).toFixed(1))
          : 0
      },
      qrCodes: {
        total: qrCodes.total,
        validados: qrCodesValidados,
        pendentes: qrCodesPendentes,
        taxaValidacao: qrCodes.total > 0 
          ? `${Number((qrCodesValidados / qrCodes.total * 100).toFixed(1))}%`
          : '0%'
      },
      financeiro: {
        totalGasto: this.formatarMoeda(estatisticasResgates.totalGasto),
        totalEconomizado: this.formatarMoeda(estatisticasResgates.totalEconomizado),
        ticketMedio: estatisticasResgates.totalResgates > 0
          ? this.formatarMoeda(estatisticasResgates.totalGasto / estatisticasResgates.totalResgates)
          : this.formatarMoeda(0)
      }
    };

    await cache.setCache(cacheKey, result, 60);
    return result;
  }

  // ================= RESGATES =================
  async getResgatesCliente(id, page = 1, limit = 10) {
    this.log('log', 'getResgatesCliente', { id, page, limit });

    const skip = (page - 1) * limit;

    const result = await this.repository.findResgatesByCliente(id, skip, limit);

    // Enriquecer resgates com dados de QR codes
    const resgatesEnriquecidos = await Promise.all(
      result.resgates.map(async (resgate) => {
        const qrCodes = await this.repository.findQrCodesPorResgate(null, id, resgate.id);
        return {
          ...resgate,
          qrCodes,
          qrCodesCount: qrCodes.length,
          qrCodesValidados: qrCodes.filter(q => q.validado).length
        };
      })
    );

    return {
      resgates: resgatesEnriquecidos,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      }
    };
  }

  // ================= QR CODES =================
  async getQrCodesCliente(id, page = 1, limit = 20, status = null) {
    this.log('log', 'getQrCodesCliente', { id, page, limit, status });

    const skip = (page - 1) * limit;

    const result = await this.repository.findQrCodesByCliente(id, skip, limit, status);

    return {
      qrCodes: result.qrCodes,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      },
      resumo: {
        validados: result.qrCodes.filter(q => q.validado).length,
        pendentes: result.qrCodes.filter(q => !q.validado).length
      }
    };
  }

  async getQrCodeDetalhes(clienteId, qrCodeId) {
    this.log('log', 'getQrCodeDetalhes', { clienteId, qrCodeId });

    const qrCode = await this.repository.findQrCodeById(clienteId, qrCodeId);
    if (!qrCode) throw new Error('QR Code não encontrado');

    return qrCode;
  }

  // ================= QR CODES POR RESGATE =================
  async getQrCodesPorResgate(lojaId, clienteId, resgateId, usuario) {
    this.log('log', 'getQrCodesPorResgate', { lojaId, clienteId, resgateId, usuario });

    // Verificar permissões
    if (usuario.userRole === 'loja' && lojaId) {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar QR codes da sua própria loja');
      }
    }

    // Buscar QR codes do resgate
    const qrCodes = await this.repository.findQrCodesPorResgate(lojaId, clienteId, resgateId);

    return qrCodes;
  }

  // ================= CLIENTES POR LOJA =================
  // No ClienteService.js - método getClientesByLoja
async getClientesByLoja(lojaId, page = 1, limit = 20, filters = {}, sortBy = 'ultimoResgate', sortOrder = 'desc', usuario) {
  this.log('log', 'getClientesByLoja', { lojaId, page, limit, filters, sortBy, sortOrder, usuario });

  // Verificar permissão
  if (usuario.userRole === 'loja') {
    const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
    if (!temPermissao) {
      throw new Error('Você só pode acessar clientes da sua própria loja');
    }
  }

  const skip = (page - 1) * limit;

  const result = await this.repository.findClientesByLoja(
    lojaId, 
    skip, 
    limit, 
    filters, 
    sortBy, 
    sortOrder
  );

  return {
    clientes: result.clientes,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      hasNext: page < Math.ceil(result.total / limit),
      hasPrev: page > 1
    }
  };
}

  async getClienteByLoja(lojaId, clienteId, usuario) {
    this.log('log', 'getClienteByLoja', { lojaId, clienteId, usuario });

    // Verificar permissão
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar clientes da sua própria loja');
      }
    }

    const cliente = await this.repository.findClienteByLoja(lojaId, clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado nesta loja');
    }

    return cliente;
  }

  async getResgatesClienteByLoja(lojaId, clienteId, page = 1, limit = 10, usuario) {
    this.log('log', 'getResgatesClienteByLoja', { lojaId, clienteId, page, limit, usuario });

    // Verificar permissão
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar resgates da sua própria loja');
      }
    }

    const skip = (page - 1) * limit;

    const result = await this.repository.findResgatesClienteByLoja(
      lojaId,
      clienteId,
      skip,
      limit
    );

    return {
      resgates: result.resgates,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      }
    };
  }

  async getQrCodesClienteByLoja(lojaId, clienteId, page = 1, limit = 20, status = null, usuario) {
    this.log('log', 'getQrCodesClienteByLoja', { lojaId, clienteId, page, limit, status, usuario });

    // Verificar permissão
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar QR codes da sua própria loja');
      }
    }

    const skip = (page - 1) * limit;

    const result = await this.repository.findQrCodesClienteByLoja(
      lojaId,
      clienteId,
      skip,
      limit,
      status
    );

    return {
      qrCodes: result.qrCodes,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      },
      resumo: {
        validados: result.qrCodes.filter(q => q.validado).length,
        pendentes: result.qrCodes.filter(q => !q.validado).length
      }
    };
  }

  // ================= QR CODES POR LOJA =================
  async getQrCodesPorLoja(lojaId, page = 1, limit = 20, filters = {}, usuario) {
    this.log('log', 'getQrCodesPorLoja', { lojaId, page, limit, filters, usuario });

    // Verificar permissão
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar QR codes da sua própria loja');
      }
    }

    const skip = (page - 1) * limit;

    const result = await this.repository.findQrCodesPorLoja(
      lojaId,
      skip,
      limit,
      filters
    );

    return {
      qrCodes: result.qrCodes,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      }
    };
  }

  // ================= RESGATES POR LOJA =================
  async getResgatesPorLoja(lojaId, page = 1, limit = 20, filters = {}, usuario) {
    this.log('log', 'getResgatesPorLoja', { lojaId, page, limit, filters, usuario });

    // Verificar permissão
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar resgates da sua própria loja');
      }
    }

    const skip = (page - 1) * limit;

    const result = await this.repository.findResgatesPorLoja(
      lojaId,
      skip,
      limit,
      filters
    );

    return {
      resgates: result.resgates,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      }
    };
  }

  // ================= ESTATÍSTICAS POR LOJA =================
  async getEstatisticasPorLoja(lojaId, usuario) {
    this.log('log', 'getEstatisticasPorLoja', { lojaId, usuario });

    // Verificar permissão
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar estatísticas da sua própria loja');
      }
    }

    const [
      totalClientes,
      totalResgates,
      resgatesMes,
      totalQrCodes,
      qrCodesValidados,
      valorEconomizado,
      topClientes
    ] = await Promise.all([
      this.repository.countClientesByLoja(lojaId),
      this.repository.countResgatesByLoja(lojaId),
      this.repository.countResgatesMesByLoja(lojaId),
      this.repository.countQrCodesByLoja(lojaId),
      this.repository.countQrCodesValidadosByLoja(lojaId),
      this.repository.sumEconomiaByLoja(lojaId),
      this.repository.getTopClientesByLoja(lojaId, 5)
    ]);

    const taxaValidacao = totalQrCodes > 0 
      ? Number(((qrCodesValidados / totalQrCodes) * 100).toFixed(1))
      : 0;

    return {
      clientes: {
        total: totalClientes,
        unicos: totalClientes
      },
      resgates: {
        total: totalResgates,
        mes: resgatesMes,
        mediaPorCliente: totalClientes > 0 ? Number((totalResgates / totalClientes).toFixed(1)) : 0
      },
      qrCodes: {
        total: totalQrCodes,
        validados: qrCodesValidados,
        pendentes: totalQrCodes - qrCodesValidados,
        taxaValidacao: `${taxaValidacao}%`
      },
      financeiro: {
        economiaTotal: this.formatarMoeda(valorEconomizado || 0)
      },
      topClientes
    };
  }

  // ================= ATUALIZAÇÃO =================
  async updateCliente(id, data) {
    this.log('log', 'updateCliente', { id, data });

    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    // Validações
    if (data.dataNascimento) {
      const dataObj = new Date(data.dataNascimento);
      if (isNaN(dataObj.getTime())) {
        throw new Error('Data de nascimento inválida');
      }

      const idade = this.calcularIdade(dataObj);
      if (idade < 18) {
        throw new Error('Cliente deve ter pelo menos 18 anos');
      }
      
      data.dataNascimento = dataObj;
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Email inválido');
      }
      
      if (data.email !== cliente.email) {
        const existing = await this.repository.findByEmail(data.email);
        if (existing) throw new Error('Email já cadastrado');
      }
    }

    if (data.senha) {
      if (data.senha.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    // Remover campos undefined
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    const clienteAtualizado = await this.repository.update(id, data);
    
    this.log('log', 'updateCliente - Cliente atualizado', { id });

    // Invalidate caches que dependem de dados de clientes
    await cache.delCacheByPrefix('clientes:');

    return clienteAtualizado;
  }

  // ================= EXCLUSÃO =================
  async deleteCliente(id, isAdmin = false) {
    this.log('log', 'deleteCliente', { id, isAdmin });

    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    // Se não for admin, verificar se tem resgates
    if (!isAdmin) {
      const resgates = await this.repository.countResgatesByCliente(id);
      if (resgates > 0) {
        throw new Error('Não é possível excluir conta com histórico de resgates');
      }
    }

    await this.repository.delete(id);
    
    this.log('log', 'deleteCliente - Cliente excluído', { id });

    // Invalidate caches que dependem de listas/estatísticas de clientes
    await cache.delCacheByPrefix('clientes:');

    return true;
  }
}

module.exports = ClienteService;