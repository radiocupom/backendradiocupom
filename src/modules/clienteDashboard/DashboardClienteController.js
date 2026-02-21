const DashboardClienteService = require('./DashboardClienteService');

class DashboardClienteController {
  constructor() {
    this.service = new DashboardClienteService();
  }

  // Resumo do dashboard (cards com totais)
  getResumo = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const resumo = await this.service.getResumo(clienteId);
      
      res.json({
        success: true,
        data: resumo
      });
    } catch (err) {
      console.error('Erro ao buscar resumo:', err);
      res.status(400).json({ error: err.message });
    }
  };

  // Listar todos os resgates do cliente
  getResgates = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const { page = 1, limit = 10 } = req.query;
      
      const resgates = await this.service.getResgates(clienteId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: resgates
      });
    } catch (err) {
      console.error('Erro ao buscar resgates:', err);
      res.status(400).json({ error: err.message });
    }
  };

  // Buscar resgate específico por ID
  getResgateById = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const { id } = req.params;
      
      const resgate = await this.service.getResgateById(clienteId, id);
      
      res.json({
        success: true,
        data: resgate
      });
    } catch (err) {
      console.error('Erro ao buscar resgate:', err);
      res.status(404).json({ error: err.message });
    }
  };

  // Listar QR codes do cliente
  getQrCodes = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const qrCodes = await this.service.getQrCodes(clienteId);
      
      res.json({
        success: true,
        data: qrCodes
      });
    } catch (err) {
      console.error('Erro ao buscar QR codes:', err);
      res.status(400).json({ error: err.message });
    }
  };

  // Buscar QR code específico
  getQrCodeById = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const { id } = req.params;
      
      const qrCode = await this.service.getQrCodeById(clienteId, id);
      
      res.json({
        success: true,
        data: qrCode
      });
    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
      res.status(404).json({ error: err.message });
    }
  };

  // Estatísticas detalhadas
  getEstatisticas = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const estatisticas = await this.service.getEstatisticas(clienteId);
      
      res.json({
        success: true,
        data: estatisticas
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      res.status(400).json({ error: err.message });
    }
  };

  // Buscar perfil do cliente
  getPerfil = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const perfil = await this.service.getPerfil(clienteId);
      
      res.json({
        success: true,
        data: perfil
      });
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      res.status(404).json({ error: err.message });
    }
  };

  // Atualizar perfil
  updatePerfil = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const dados = req.body;
      
      const perfilAtualizado = await this.service.updatePerfil(clienteId, dados);
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: perfilAtualizado
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = new DashboardClienteController();