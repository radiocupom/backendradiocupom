const CupomRepository = require('./CupomRepository');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CupomService {
  constructor() {
    this.repository = new CupomRepository();
  }

  async createCupom(data, usuarioLogado) {
    const { 
      codigo, 
      descricao, 
      quantidadePorCliente, 
      dataExpiracao, 
      lojaId, 
      logo,
      quantidadeQrCodes = 1000,
      // 🔥 NOVOS CAMPOS
      precoOriginal,
      precoComDesconto,
      percentualDesconto,
      nomeProduto
    } = data;

    // ================= VALIDAÇÕES BÁSICAS =================
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

    // 🔥 VALIDAÇÃO DOS CAMPOS DE PREÇO
    if (precoOriginal && precoOriginal <= 0) {
      throw new Error('Preço original deve ser maior que zero');
    }
    if (precoComDesconto && precoComDesconto <= 0) {
      throw new Error('Preço com desconto deve ser maior que zero');
    }
    if (percentualDesconto && (percentualDesconto < 0 || percentualDesconto > 100)) {
      throw new Error('Percentual de desconto deve estar entre 0 e 100');
    }

    // ================= VALIDAÇÃO DE PERMISSÃO PARA LOJISTA =================
    if (usuarioLogado.role === 'loja') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioLogado.id },
        include: { loja: true }
      });

      if (!usuario?.loja) {
        throw new Error('Você não possui uma loja associada ao seu usuário');
      }

      if (usuario.loja.id !== lojaId) {
        throw new Error('Você só pode criar cupons para sua própria loja');
      }
    }

    // ================= VERIFICAR SE LOJA EXISTE =================
    const loja = await prisma.loja.findUnique({
      where: { id: lojaId }
    });

    if (!loja) {
      throw new Error('Loja não encontrada');
    }

    // ================= VERIFICAR SE CÓDIGO JÁ EXISTE =================
    const existing = await this.repository.findByCodigo(codigo);
    if (existing) {
      throw new Error('Código de cupom já existe');
    }

    // ================= CRIAR CUPOM =================
    const novoCupom = await prisma.cupom.create({
      data: {
        codigo,
        descricao,
        quantidadePorCliente,
        dataExpiracao: dataExp,
        loja: {
          connect: { id: lojaId }
        },
        logo: logo || '',
        totalQrCodes: parseInt(quantidadeQrCodes),
        qrCodesUsados: 0,
        // 🔥 NOVOS CAMPOS
        precoOriginal,
        precoComDesconto,
        percentualDesconto,
        nomeProduto
      }
    });

    return novoCupom;
  }

  async getAllCupons() {
    const cupons = await prisma.cupom.findMany({
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            logo: true,
            payment: true
          }
        },
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return cupons;
  }

  async getCupomById(id, usuarioLogado = null) {
    const cupom = await prisma.cupom.findUnique({
      where: { id },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            logo: true,
            payment: true
          }
        },
        _count: {
          select: { resgates: true }
        }
      }
    });
    
    if (!cupom) throw new Error('Cupom não encontrado');
    
    if (usuarioLogado?.role === 'loja') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioLogado.id },
        include: { loja: true }
      });
      
      if (cupom.lojaId !== usuario.loja?.id) {
        throw new Error('Você só pode acessar cupons da sua própria loja');
      }
    }
    
    return cupom;
  }

  async getCuponsByLoja(lojaId) {
    return prisma.cupom.findMany({
      where: { lojaId },
      include: {
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCuponsDisponiveis() {
    return prisma.cupom.findMany({
      where: {
        dataExpiracao: {
          gt: new Date()
        },
        loja: {
          payment: true
        }
      },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            logo: true
          }
        }
      },
      orderBy: {
        dataExpiracao: 'asc'
      }
    });
  }

  async updateCupom(id, data, usuarioLogado = null) {
    console.log('🔄 [service] Atualizando cupom:', id);
    console.log('📦 [service] Dados recebidos:', data);
    
    const cupom = await prisma.cupom.findUnique({
      where: { id }
    });
    
    if (!cupom) throw new Error('Cupom não encontrado');
    console.log('✅ [service] Cupom encontrado:', cupom.codigo);

    if (usuarioLogado?.role === 'loja') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioLogado.id },
        include: { loja: true }
      });
      
      if (cupom.lojaId !== usuario.loja?.id) {
        throw new Error('Você só pode atualizar cupons da sua própria loja');
      }
      console.log('✅ [service] Permissão verificada para lojista');
    }

    if (data.codigo && data.codigo !== cupom.codigo) {
      console.log('🔍 [service] Verificando código duplicado:', data.codigo);
      const existing = await prisma.cupom.findUnique({
        where: { codigo: data.codigo }
      });
      if (existing) throw new Error('Código de cupom já existe');
      console.log('✅ [service] Código disponível');
    }

    if (data.dataExpiracao) {
      const dataExp = new Date(data.dataExpiracao);
      if (dataExp <= new Date()) {
        throw new Error('Data de expiração deve ser futura');
      }
      console.log('✅ [service] Data de expiração válida');
    }

    // 🔥 PREPARAR DADOS PARA ATUALIZAÇÃO
    const updateData = {};
    
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.descricao) updateData.descricao = data.descricao;
    if (data.quantidadePorCliente) updateData.quantidadePorCliente = data.quantidadePorCliente;
    if (data.dataExpiracao) updateData.dataExpiracao = new Date(data.dataExpiracao);
    if (data.logo) updateData.logo = data.logo;
    
    // 🔥 NOVOS CAMPOS
    if (data.precoOriginal !== undefined) updateData.precoOriginal = data.precoOriginal;
    if (data.precoComDesconto !== undefined) updateData.precoComDesconto = data.precoComDesconto;
    if (data.percentualDesconto !== undefined) updateData.percentualDesconto = data.percentualDesconto;
    if (data.nomeProduto !== undefined) updateData.nomeProduto = data.nomeProduto;

    console.log('📝 [service] Dados para update:', updateData);

    const cupomAtualizado = await prisma.cupom.update({
      where: { id },
      data: updateData
    });

    console.log('✅ [service] Cupom atualizado com sucesso');
    return cupomAtualizado;
  }

  async deleteCupom(id, usuarioLogado = null) {
    const cupom = await prisma.cupom.findUnique({
      where: { id },
      include: {
        _count: {
          select: { resgates: true }
        }
      }
    });
    
    if (!cupom) throw new Error('Cupom não encontrado');

    if (usuarioLogado?.role !== 'superadmin' && usuarioLogado?.role !== 'admin') {
      throw new Error('Apenas superadmin e admin podem deletar cupons');
    }

    if (cupom._count.resgates > 0) {
      throw new Error('Não é possível deletar cupom com resgates');
    }

    return prisma.cupom.delete({ where: { id } });
  }

  async gerarQrCodes(id, quantidade = 1, usuarioLogado = null) {
    const cupom = await prisma.cupom.findUnique({
      where: { id }
    });
    
    if (!cupom) throw new Error('Cupom não encontrado');

    if (usuarioLogado?.role === 'loja') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioLogado.id },
        include: { loja: true }
      });
      
      if (cupom.lojaId !== usuario.loja?.id) {
        throw new Error('Você só pode gerar QR codes para cupons da sua própria loja');
      }
    }

    const cupomAtualizado = await prisma.cupom.update({
      where: { id },
      data: {
        totalQrCodes: {
          increment: parseInt(quantidade)
        }
      }
    });

    return [{
      mensagem: `${quantidade} QR codes adicionados. Total agora: ${cupomAtualizado.totalQrCodes}`,
      totalQrCodes: cupomAtualizado.totalQrCodes,
      qrCodesUsados: cupomAtualizado.qrCodesUsados
    }];
  }

  // src/modules/cupom/CupomService.js

// src/modules/cupom/CupomService.js

async getEstatisticas(id, usuarioLogado = null) {
  const cupom = await prisma.cupom.findUnique({
    where: { id },
    include: {
      loja: {
        select: { nome: true }
      },
      resgates: {
        include: {
          cliente: {
            select: { nome: true, email: true }
          }
        },
        orderBy: { resgatadoEm: 'desc' }
      },
      // 🔥 INCLUIR QR CODES RELACIONADOS
      qrCodesUsadosList: {
        where: { cupomId: id }
      }
    }
  });

  if (!cupom) throw new Error('Cupom não encontrado');

  if (usuarioLogado?.role === 'loja') {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioLogado.id },
      include: { loja: true }
    });
    
    if (cupom.lojaId !== usuario.loja?.id) {
      throw new Error('Você só pode ver estatísticas de cupons da sua própria loja');
    }
  }

  // 🔥 CALCULAR QR CODES
  const qrCodesUsados = cupom.qrCodesUsadosList.length;
  const qrCodesValidados = cupom.qrCodesUsadosList.filter(qr => qr.validado).length;
  const qrCodesDisponiveis = cupom.totalQrCodes - qrCodesUsados;

  // 🔥 CALCULAR RESGATES E VALIDAÇÕES
  const totalResgates = cupom.resgates.reduce((acc, r) => acc + r.quantidade, 0);
  const clientesAtendidos = cupom.resgates.length;

  // 🔥 MAPEAR QR CODES POR RESGATE (para saber quais foram validados)
  const qrCodesPorResgate = new Map();
  cupom.qrCodesUsadosList.forEach(qr => {
    // Agrupa por cliente e cupom (simplificado)
    const chave = `${qr.clienteId}-${qr.cupomId}`;
    qrCodesPorResgate.set(chave, qr);
  });

  // 🔥 CALCULAR VALORES FINANCEIROS CORRETAMENTE
  let valorTotalResgatado = 0;
  let valorTotalVendido = 0;
  let resgatesValidados = 0;
  let resgatesPendentes = 0;

  const resgatesDetalhados = cupom.resgates.map(resgate => {
    // Buscar QR code associado a este resgate
    const chave = `${resgate.clienteId}-${resgate.cupomId}`;
    const qrCode = qrCodesPorResgate.get(chave);
    
    const validado = qrCode?.validado || false;
    const validadoEm = qrCode?.validadoEm || null;
    
    // Calcular valores baseados na quantidade
    const precoUnitarioOriginal = cupom.precoOriginal || 0;
    const precoUnitarioPago = cupom.precoComDesconto || cupom.precoOriginal || 0;
    
    const valorOriginal = precoUnitarioOriginal * resgate.quantidade;
    const valorPago = precoUnitarioPago * resgate.quantidade;
    
    // Acumular totais
    valorTotalResgatado += valorOriginal;
    
    if (validado) {
      valorTotalVendido += valorPago;
      resgatesValidados += resgate.quantidade;
    } else {
      resgatesPendentes += resgate.quantidade;
    }
    
    return {
      id: resgate.id,
      cliente: resgate.cliente.nome,
      quantidade: resgate.quantidade,
      resgatadoEm: resgate.resgatadoEm,
      validado,
      validadoEm,
      valorOriginal,
      valorPago: validado ? valorPago : 0
    };
  });

  // 🔥 CALCULAR MÉTRICAS FINANCEIRAS
  const valorTotalEconomizado = valorTotalResgatado - valorTotalVendido;
  const mediaTicket = resgatesValidados > 0 ? valorTotalVendido / resgatesValidados : 0;
  const taxaConversao = totalResgates > 0 ? (resgatesValidados / totalResgates) * 100 : 0;

  return {
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
      clientesAtendidos,
      
      // 🔥 ESTATÍSTICAS FINANCEIRAS CORRIGIDAS
      valorTotalResgatado,
      valorTotalVendido,
      valorTotalEconomizado,
      mediaTicket,
      taxaConversao,
      resgatesPendentes,
      resgatesValidados
    },
    resgates: resgatesDetalhados
  };
}

  async getCuponsByLojista(usuarioLogado) {
    if (usuarioLogado.role !== 'loja') {
      throw new Error('Apenas lojistas podem acessar esta rota');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioLogado.id },
      include: { loja: true }
    });

    if (!usuario?.loja) {
      throw new Error('Você não possui uma loja associada');
    }

    return prisma.cupom.findMany({
      where: { lojaId: usuario.loja.id },
      include: {
        _count: {
          select: { resgates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async validarResgate(clienteId, cupomId) {
    const cupom = await prisma.cupom.findUnique({
      where: { id: cupomId },
      include: { loja: true }
    });

    if (!cupom) throw new Error('Cupom não encontrado');
    if (!cupom.loja.payment) throw new Error('Loja com pagamento pendente');
    if (new Date() > cupom.dataExpiracao) throw new Error('Cupom expirado');
    if (cupom.qrCodesUsados >= cupom.totalQrCodes) {
      throw new Error('Todos os QR codes deste cupom já foram usados');
    }

    const resgate = await prisma.resgate.findFirst({
      where: {
        clienteId,
        cupomId
      }
    });

    const quantidadeAtual = resgate ? resgate.quantidade : 0;

    if (quantidadeAtual >= cupom.quantidadePorCliente) {
      throw new Error(`Limite de resgates atingido (${quantidadeAtual}/${cupom.quantidadePorCliente})`);
    }

    return {
      podeResgatar: true,
      quantidadeAtual,
      restantes: cupom.quantidadePorCliente - quantidadeAtual
    };
  }
}

module.exports = CupomService;