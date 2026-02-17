// src/modules/cupom/CupomService.js
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
      quantidadeQrCodes = 1000  // ← Agora é o TOTAL de QR codes
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

    // ================= CRIAR CUPOM (SEM QR CODES INDIVIDUAIS) =================
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
        totalQrCodes: parseInt(quantidadeQrCodes),  // ← Total disponível
        qrCodesUsados: 0  // ← Inicia com zero
      }
    });

    return novoCupom;
  }

  async getAllCupons() {
    const cupons = await this.repository.findAll();
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
        // ❌ REMOVIDO: qrCodes
        _count: {
          select: { resgates: true }
        }
      }
    });
    
    if (!cupom) throw new Error('Cupom não encontrado');
    
    // Se for lojista, verificar se o cupom é da loja dele
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

  // Verificar permissão para lojista
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

  // Verificar se código já existe (se estiver mudando)
  if (data.codigo && data.codigo !== cupom.codigo) {
    console.log('🔍 [service] Verificando código duplicado:', data.codigo);
    const existing = await prisma.cupom.findUnique({
      where: { codigo: data.codigo }
    });
    if (existing) throw new Error('Código de cupom já existe');
    console.log('✅ [service] Código disponível');
  }

  // Verificar data de expiração (se estiver mudando)
  if (data.dataExpiracao) {
    const dataExp = new Date(data.dataExpiracao);
    if (dataExp <= new Date()) {
      throw new Error('Data de expiração deve ser futura');
    }
    console.log('✅ [service] Data de expiração válida');
  }

  // 🔥 CORREÇÃO: preparar dados para atualização
  const updateData = {};
  
  if (data.codigo) updateData.codigo = data.codigo;
  if (data.descricao) updateData.descricao = data.descricao;
  if (data.quantidadePorCliente) updateData.quantidadePorCliente = parseInt(data.quantidadePorCliente);
  if (data.dataExpiracao) updateData.dataExpiracao = new Date(data.dataExpiracao);
  if (data.logo) updateData.logo = data.logo;

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

    // Apenas superadmin/admin podem deletar
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

  // Verificar permissão para lojista
  if (usuarioLogado?.role === 'loja') {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioLogado.id },
      include: { loja: true }
    });
    
    if (cupom.lojaId !== usuario.loja?.id) {
      throw new Error('Você só pode gerar QR codes para cupons da sua própria loja');
    }
  }

  // ✅ ATUALIZAR: Aumenta o total de QR codes disponíveis
  const cupomAtualizado = await prisma.cupom.update({
    where: { id },
    data: {
      totalQrCodes: {
        increment: parseInt(quantidade)
      }
    }
  });

  return {
    mensagem: `${quantidade} QR codes adicionados. Total agora: ${cupomAtualizado.totalQrCodes}`,
    totalQrCodes: cupomAtualizado.totalQrCodes,
    qrCodesUsados: cupomAtualizado.qrCodesUsados
  };
}
  async getEstatisticas(id, usuarioLogado = null) {
    const cupom = await prisma.cupom.findUnique({
      where: { id },
      include: {
        loja: {
          select: { nome: true }
        },
        _count: {
          select: { resgates: true }
        },
        resgates: {
          select: {
            quantidade: true
          }
        }
      }
    });

    if (!cupom) throw new Error('Cupom não encontrado');

    // Verificar permissão para lojista
    if (usuarioLogado?.role === 'loja') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioLogado.id },
        include: { loja: true }
      });
      
      if (cupom.lojaId !== usuario.loja?.id) {
        throw new Error('Você só pode ver estatísticas de cupons da sua própria loja');
      }
    }

    const qrCodesUsados = await prisma.qrCodeUsado.count({
      where: { cupomId: id }
    });

    const totalResgates = cupom.resgates.reduce((acc, r) => acc + r.quantidade, 0);

    return {
      cupom: {
        id: cupom.id,
        codigo: cupom.codigo,
        descricao: cupom.descricao,
        loja: cupom.loja.nome,
        totalQrCodes: cupom.totalQrCodes,
        qrCodesUsados: cupom.qrCodesUsados
      },
      estatisticas: {
        totalQrCodes: cupom.totalQrCodes,
        qrCodesUsados: cupom.qrCodesUsados,
        qrCodesDisponiveis: cupom.totalQrCodes - cupom.qrCodesUsados,
        totalResgates,
        clientesAtendidos: cupom.resgates.length
      }
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