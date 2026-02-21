const DashboardClienteRepository = require('./DashboardClienteRepository');
const QRCode = require('qrcode');

class DashboardClienteService {
  constructor() {
    this.repository = new DashboardClienteRepository();
  }

  async getResumo(clienteId) {
    const [
      totalResgates,
      cuponsUnicos,
      totalQrCodes,
      qrCodesValidados,
      ultimoResgate
    ] = await Promise.all([
      this.repository.countTotalResgates(clienteId),
      this.repository.countCuponsUnicos(clienteId),
      this.repository.countQrCodes(clienteId),
      this.repository.countQrCodesValidados(clienteId),
      this.repository.getUltimoResgate(clienteId)
    ]);

    return {
      totalResgates,
      cuponsUnicos,
      totalQrCodes,
      qrCodesValidados,
      qrCodesPendentes: totalQrCodes - qrCodesValidados,
      ultimoResgate: ultimoResgate ? {
        data: ultimoResgate.resgatadoEm,
        cupom: ultimoResgate.cupom.descricao,
        loja: ultimoResgate.cupom.loja.nome
      } : null
    };
  }

  async getResgates(clienteId, { page, limit }) {
    const skip = (page - 1) * limit;
    
    const [resgates, total] = await Promise.all([
      this.repository.findResgates(clienteId, { skip, limit }),
      this.repository.countResgates(clienteId)
    ]);

    return {
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
  }

  async getResgateById(clienteId, resgateId) {
    const resgate = await this.repository.findResgateById(clienteId, resgateId);
    
    if (!resgate) {
      throw new Error('Resgate não encontrado');
    }

    const qrCode = await this.repository.findQrCodeByResgate(clienteId, resgate.cupomId);
    
    let imagemQr = null;
    if (qrCode) {
      imagemQr = await QRCode.toDataURL(qrCode.codigo);
    }

    return {
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
  }

  async getQrCodes(clienteId) {
    const qrCodes = await this.repository.findQrCodes(clienteId);
    
    return Promise.all(qrCodes.map(async qr => ({
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
  }

  async getQrCodeById(clienteId, qrCodeId) {
    const qrCode = await this.repository.findQrCodeById(clienteId, qrCodeId);
    
    if (!qrCode) {
      throw new Error('QR Code não encontrado');
    }

    const imagem = await QRCode.toDataURL(qrCode.codigo);

    return {
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
  }

  async getEstatisticas(clienteId) {
    const [
      resgatesPorMes,
      resgatesPorLoja,
      horarioPreferido
    ] = await Promise.all([
      this.repository.getResgatesPorMes(clienteId),
      this.repository.getResgatesPorLoja(clienteId),
      this.repository.getHorarioPreferido(clienteId)
    ]);

    return {
      resgatesPorMes,
      resgatesPorLoja,
      horarioPreferido
    };
  }

  async getPerfil(clienteId) {
    const cliente = await this.repository.findCliente(clienteId);
    
    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    const { senha, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  async updatePerfil(clienteId, dados) {
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
    return clienteSemSenha;
  }
}

module.exports = DashboardClienteService;