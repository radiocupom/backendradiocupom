const DashboardClienteRepository = require('./DashboardClienteRepository');
const QRCode = require('qrcode');
const cache = require('../../cache/cacheHelper');

class DashboardClienteService {
  constructor() {
    this.repository = new DashboardClienteRepository();
  }

  async getResgates(clienteId, { page, limit }) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:resgates:page-${page}-limit-${limit}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    
    const [resgates, total] = await Promise.all([
      this.repository.findResgates(clienteId, { skip, limit }),
      this.repository.countResgates(clienteId)
    ]);

    const result = {
      items: resgates.map(r => ({
        id: r.id,
        quantidade: r.quantidade,
        resgatadoEm: r.resgatadoEm,
        cupom: {
          id: r.cupom.id,
          descricao: r.cupom.descricao,
          codigo: r.cupom.codigo,
          dataExpiracao: r.cupom.dataExpiracao
        },
        loja: {
          id: r.cupom.loja.id,
          nome: r.cupom.loja.nome,
          logo: r.cupom.loja.logo
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  async getResgateById(clienteId, resgateId) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:resgate:${resgateId}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const resgate = await this.repository.findResgateById(clienteId, resgateId);
    
    if (!resgate) {
      throw new Error('Resgate não encontrado');
    }

    const qrCode = await this.repository.findQrCodeByResgate(clienteId, resgate.cupomId);
    
    let imagemQr = null;
    if (qrCode) {
      imagemQr = await QRCode.toDataURL(qrCode.codigo);
    }

    const result = {
      id: resgate.id,
      quantidade: resgate.quantidade,
      resgatadoEm: resgate.resgatadoEm,
      cupom: {
        id: resgate.cupom.id,
        descricao: resgate.cupom.descricao,
        codigo: resgate.cupom.codigo,
        dataExpiracao: resgate.cupom.dataExpiracao
      },
      loja: {
        id: resgate.cupom.loja.id,
        nome: resgate.cupom.loja.nome,
        logo: resgate.cupom.loja.logo,
        categoria: resgate.cupom.loja.categoria
      },
      qrCode: qrCode ? {
        id: qrCode.id,
        codigo: qrCode.codigo,
        imagem: imagemQr,
        validado: qrCode.validado,
        validadoEm: qrCode.validadoEm,
        usadoEm: qrCode.usadoEm
      } : null
    };
    
    await cache.setCache(cacheKey, result, 60);
    return result;
  }

  async getQrCodes(clienteId) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:qrcodes`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const qrCodes = await this.repository.findQrCodes(clienteId);
    
    const result = await Promise.all(qrCodes.map(async qr => ({
      id: qr.id,
      codigo: qr.codigo,
      usadoEm: qr.usadoEm,
      validado: qr.validado,
      validadoEm: qr.validadoEm,
      cupom: {
        id: qr.cupom.id,
        descricao: qr.cupom.descricao,
        codigo: qr.cupom.codigo
      },
      loja: {
        id: qr.cupom.loja.id,
        nome: qr.cupom.loja.nome
      }
    })));
    
    await cache.setCache(cacheKey, result, 30);
    return result;
  }

  async getQrCodeById(clienteId, qrCodeId) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:qrcode:${qrCodeId}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const qrCode = await this.repository.findQrCodeById(clienteId, qrCodeId);
    
    if (!qrCode) {
      throw new Error('QR Code não encontrado');
    }

    const imagem = await QRCode.toDataURL(qrCode.codigo);

    const result = {
      id: qrCode.id,
      codigo: qrCode.codigo,
      imagem,
      usadoEm: qrCode.usadoEm,
      validado: qrCode.validado,
      validadoEm: qrCode.validadoEm,
      cupom: {
        id: qrCode.cupom.id,
        descricao: qrCode.cupom.descricao,
        codigo: qrCode.cupom.codigo,
        dataExpiracao: qrCode.cupom.dataExpiracao
      },
      loja: {
        id: qrCode.cupom.loja.id,
        nome: qrCode.cupom.loja.nome,
        logo: qrCode.cupom.loja.logo
      }
    };
    
    await cache.setCache(cacheKey, result, 60);
    return result;
  }

  async getEstatisticas(clienteId) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:estatisticas`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;
    const [
      resgatesPorMes,
      resgatesPorLoja,
      horarioPreferido
    ] = await Promise.all([
      this.repository.getResgatesPorMes(clienteId),
      this.repository.getResgatesPorLoja(clienteId),
      this.repository.getHorarioPreferido(clienteId)
    ]);

    const result = {
      resgatesPorMes,
      resgatesPorLoja,
      horarioPreferido
    };
    
    await cache.setCache(cacheKey, result, 60);
    return result;
  }

  async getPerfil(clienteId) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:perfil`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;
    const cliente = await this.repository.findCliente(clienteId);
    
    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    const { senha, ...clienteSemSenha } = cliente;
    
    await cache.setCache(cacheKey, clienteSemSenha, 60);
    return clienteSemSenha;
  }

  async updatePerfil(clienteId, dados) {
    // Invalidate cache ao atualizar perfil
    await cache.delCacheByPrefix(`clienteDashboard:cliente:${clienteId}:`);
    const camposPermitidos = [
      'nome', 'whatsapp', 'bairro', 'cidade', 'estado',
      'genero', 'instagram', 'facebook', 'tiktok',
      'receberOfertas', 'comoConheceu', 'observacoes'
    ];

    const dadosFiltrados = {};
    Object.keys(dados).forEach(key => {
      if (camposPermitidos.includes(key)) {
        dadosFiltrados[key] = dados[key];
      }
    });

    const clienteAtualizado = await this.repository.updateCliente(clienteId, dadosFiltrados);
    
    const { senha, ...clienteSemSenha } = clienteAtualizado;
    
    // Cache updated perfil
    const cacheKey = `clienteDashboard:cliente:${clienteId}:perfil`;
    await cache.setCache(cacheKey, clienteSemSenha, 60);
    
    return clienteSemSenha;
  }
  async getResumo(clienteId) {
    const cacheKey = `clienteDashboard:cliente:${clienteId}:resumo`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const [
      totalResgates,
      cuponsUnicos,
      totalQrCodes,
      qrCodesValidados,
      ultimoResgate,
      economiaTotal,
      economiaPorLoja
    ] = await Promise.all([
    this.repository.countTotalResgates(clienteId),
    this.repository.countCuponsUnicos(clienteId),
    this.repository.countQrCodes(clienteId),
    this.repository.countQrCodesValidados(clienteId),
    this.repository.getUltimoResgate(clienteId),
    this.repository.getEconomiaTotal(clienteId),
    this.repository.getEconomiaPorLoja(clienteId)
  ]);

    const result = {
      totalResgates,
      cuponsUnicos,
      totalQrCodes,
      qrCodesValidados,
      qrCodesPendentes: totalQrCodes - qrCodesValidados,
      ultimoResgate: ultimoResgate ? {
        data: ultimoResgate.resgatadoEm,
        cupom: ultimoResgate.cupom.descricao,
        loja: ultimoResgate.cupom.loja.nome
      } : null,
      economia: {
        total: economiaTotal,
        porLoja: economiaPorLoja
      }
    };
    
    await cache.setCache(cacheKey, result, 60);
    return result;
  }
}

module.exports = DashboardClienteService;