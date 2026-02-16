// src/modules/cupom/CupomController.js
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
        quantidadeQrCodes 
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
        quantidadeQrCodes: quantidadeQrCodes ? parseInt(quantidadeQrCodes) : 1
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

  // ✅ NOVA ROTA: Cupons do lojista logado
  getMinhaLoja = async (req, res) => {
    try {
      const cupons = await this.service.getCuponsByLojista(req.user);
      res.json(cupons);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const cupom = await this.service.updateCupom(id, data, req.user);
      res.json(cupom);
    } catch (err) {
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