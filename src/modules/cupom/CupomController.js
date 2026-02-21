const CupomService = require('./CupomService');

class CupomController {
  constructor() {
    this.service = new CupomService();
  }

  create = async (req, res) => {
    try {
      const { 
        codigo, 
        descricao, 
        quantidadePorCliente, 
        dataExpiracao, 
        lojaId,
        quantidadeQrCodes,
        // 🔥 NOVOS CAMPOS
        precoOriginal,
        precoComDesconto,
        percentualDesconto,
        nomeProduto
      } = req.body;

      const logo = req.file ? req.file.path : '';

      if (!codigo || !descricao || !quantidadePorCliente || !dataExpiracao || !lojaId) {
        return res.status(400).json({
          error: 'Código, descrição, quantidade, data de expiração e loja são obrigatórios'
        });
      }

      const cupom = await this.service.createCupom({
        codigo,
        descricao,
        quantidadePorCliente: parseInt(quantidadePorCliente),
        dataExpiracao,
        lojaId,
        logo,
        quantidadeQrCodes: quantidadeQrCodes ? parseInt(quantidadeQrCodes) : 1000,
        // 🔥 NOVOS CAMPOS
        precoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
        precoComDesconto: precoComDesconto ? parseFloat(precoComDesconto) : null,
        percentualDesconto: percentualDesconto ? parseInt(percentualDesconto) : null,
        nomeProduto
      }, req.user);

      res.status(201).json(cupom);
    } catch (err) {
      console.error('Erro ao criar cupom:', err);
      res.status(400).json({ error: err.message });
    }
  };

  getAll = async (_req, res) => {
    try {
      const cupons = await this.service.getAllCupons();
      res.json(cupons);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getDisponiveis = async (_req, res) => {
    try {
      const cupons = await this.service.getCuponsDisponiveis();
      res.json({
        success: true,
        data: cupons
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const cupom = await this.service.getCupomById(id, req.user);
      res.json(cupom);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  getByLoja = async (req, res) => {
    try {
      const { lojaId } = req.params;
      const cupons = await this.service.getCuponsByLoja(lojaId);
      res.json(cupons);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getMinhaLoja = async (req, res) => {
    try {
      const cupons = await this.service.getCuponsByLojista(req.user);
      res.json(cupons);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    console.log('📥 [update] Requisição recebida - ID:', req.params.id);
    console.log('📦 [update] Body recebido:', req.body);
    console.log('📎 [update] File recebido:', req.file);
    console.log('👤 [update] Usuário:', req.user?.id, req.user?.role);
    
    try {
      const { id } = req.params;
      const data = { ...req.body };
      
      if (req.file) {
        data.logo = req.file.path;
        console.log('🖼️ [update] Logo atualizada:', data.logo);
      }

      // 🔥 CONVERTER CAMPOS NUMÉRICOS
      if (data.quantidadePorCliente) data.quantidadePorCliente = parseInt(data.quantidadePorCliente);
      if (data.precoOriginal) data.precoOriginal = parseFloat(data.precoOriginal);
      if (data.precoComDesconto) data.precoComDesconto = parseFloat(data.precoComDesconto);
      if (data.percentualDesconto) data.percentualDesconto = parseInt(data.percentualDesconto);
      
      console.log('📝 [update] Dados processados:', data);
      
      const cupom = await this.service.updateCupom(id, data, req.user);
      console.log('✅ [update] Cupom atualizado:', cupom.id);
      
      res.json(cupom);
    } catch (err) {
      console.error('❌ [update] Erro:', err.message);
      console.error('❌ [update] Stack:', err.stack);
      res.status(400).json({ error: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteCupom(id, req.user);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  gerarQrCodes = async (req, res) => {
    try {
      const { id } = req.params;
      const { quantidade = 1 } = req.body;

      const qrCodes = await this.service.gerarQrCodes(id, parseInt(quantidade), req.user);
      res.json({
        message: `${qrCodes.length} QR codes gerados com sucesso`,
        qrCodes
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getEstatisticas = async (req, res) => {
    try {
      const { id } = req.params;
      const estatisticas = await this.service.getEstatisticas(id, req.user);
      res.json(estatisticas);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };
}

module.exports = CupomController;