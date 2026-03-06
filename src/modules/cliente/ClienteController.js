// ClienteController.js
const ClienteService = require('./ClienteService');

class ClienteController {
  constructor() {
    this.service = new ClienteService();
  }

  // ================= UTILITÁRIOS =================
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [ClienteController] ${message}`, data);
  }

  handleError(res, error, operation, statusCode = 400) {
    this.log('error', `Erro em ${operation}:`, {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(statusCode).json({
      success: false,
      error: error.message,
      operation
    });
  }

  // ================= ROTAS PÚBLICAS =================
  create = async (req, res) => {
    try {
      this.log('log', '📥 create - Requisição recebida', { body: req.body });

      const { 
        nome, email, senha, whatsapp,
        bairro, cidade, estado, pais = 'Brasil',
        genero, dataNascimento, instagram, facebook, tiktok,
        receberOfertas = true, comoConheceu, observacoes 
      } = req.body;

      // Validação básica
      if (!nome || !email || !senha || !whatsapp) {
        return res.status(400).json({ 
          success: false,
          error: 'Nome, email, senha e whatsapp são obrigatórios' 
        });
      }

      const cliente = await this.service.createCliente({
        nome, email, senha, whatsapp,
        bairro, cidade, estado, pais,
        genero, dataNascimento, instagram, facebook, tiktok,
        receberOfertas, comoConheceu, observacoes
      });

      this.log('log', '✅ create - Cliente criado', { id: cliente.id });
      
      return res.status(201).json({
        success: true,
        message: 'Cliente cadastrado com sucesso',
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'create', 400);
    }
  };

  login = async (req, res) => {
    try {
      this.log('log', '📥 login - Requisição recebida', { 
        email: req.body.email 
      });

      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          success: false,
          error: 'Email e senha são obrigatórios' 
        });
      }

      const { cliente, token, expiresIn } = await this.service.autenticar(email, senha);
      
      this.log('log', '✅ login - Login realizado', { id: cliente.id });
      
      return res.json({ 
        success: true,
        message: 'Login realizado com sucesso',
        data: { cliente, token, expiresIn }
      });
      
    } catch (error) {
      return this.handleError(res, error, 'login', 401);
    }
  };

  // ================= ROTAS DO PRÓPRIO CLIENTE =================
  getPerfil = async (req, res) => {
    try {
      this.log('log', '📥 getPerfil', { clienteId: req.cliente.id });

      const cliente = await this.service.getClienteById(req.cliente.id);
      
      return res.json({
        success: true,
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getPerfil', 404);
    }
  };

  updatePerfil = async (req, res) => {
    try {
      this.log('log', '📥 updatePerfil', { 
        clienteId: req.cliente.id,
        body: req.body 
      });

      const cliente = await this.service.updateCliente(req.cliente.id, req.body);
      
      return res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'updatePerfil', 400);
    }
  };

  deleteOwnAccount = async (req, res) => {
    try {
      this.log('log', '📥 deleteOwnAccount', { clienteId: req.cliente.id });

      await this.service.deleteCliente(req.cliente.id, false);
      
      return res.json({ 
        success: true,
        message: 'Conta encerrada com sucesso' 
      });
      
    } catch (error) {
      return this.handleError(res, error, 'deleteOwnAccount', 400);
    }
  };

  getOwnEstatisticas = async (req, res) => {
    try {
      this.log('log', '📥 getOwnEstatisticas', { clienteId: req.cliente.id });

      const estatisticas = await this.service.getEstatisticasCliente(req.cliente.id);
      
      return res.json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getOwnEstatisticas', 404);
    }
  };

  getOwnResgates = async (req, res) => {
    try {
      this.log('log', '📥 getOwnResgates', { 
        clienteId: req.cliente.id,
        query: req.query 
      });

      const { page = 1, limit = 10 } = req.query;
      
      const result = await this.service.getResgatesCliente(
        req.cliente.id, 
        parseInt(page), 
        parseInt(limit)
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getOwnResgates', 404);
    }
  };

  getOwnQrCodes = async (req, res) => {
    try {
      this.log('log', '📥 getOwnQrCodes', { 
        clienteId: req.cliente.id,
        query: req.query 
      });

      const { page = 1, limit = 20, status } = req.query;
      
      const result = await this.service.getQrCodesCliente(
        req.cliente.id,
        parseInt(page),
        parseInt(limit),
        status
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getOwnQrCodes', 404);
    }
  };

  getOwnQrCodeDetalhes = async (req, res) => {
    try {
      this.log('log', '📥 getOwnQrCodeDetalhes', { 
        clienteId: req.cliente.id,
        qrCodeId: req.params.qrCodeId 
      });

      const qrCode = await this.service.getQrCodeDetalhes(
        req.cliente.id,
        req.params.qrCodeId
      );
      
      return res.json({
        success: true,
        data: qrCode
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getOwnQrCodeDetalhes', 404);
    }
  };

  getOwnQrCodesPorResgate = async (req, res) => {
    try {
      this.log('log', '📥 getOwnQrCodesPorResgate', { 
        clienteId: req.cliente.id,
        resgateId: req.params.resgateId 
      });

      const qrCodes = await this.service.getQrCodesPorResgate(
        null,
        req.cliente.id,
        req.params.resgateId,
        { userRole: 'cliente', userId: req.cliente.id }
      );
      
      return res.json({
        success: true,
        data: qrCodes
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getOwnQrCodesPorResgate', 404);
    }
  };

  // ================= ROTAS DE ADMIN/SUPERADMIN =================
  getAll = async (req, res) => {
    try {
      this.log('log', '📥 getAll - Listagem de clientes', { query: req.query });

      const { 
        page = 1, 
        limit = 20, 
        search, 
        cidade, 
        estado, 
        ativo,
        dataInicio,
        dataFim,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        search,
        cidade,
        estado,
        ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
        dataInicio,
        dataFim
      };

      const result = await this.service.getAllClientes(
        parseInt(page),
        parseInt(limit),
        filters,
        sortBy,
        sortOrder
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getAll', 400);
    }
  };

  getEstatisticasGerais = async (req, res) => {
    try {
      this.log('log', '📥 getEstatisticasGerais');

      const estatisticas = await this.service.getEstatisticasGerais();
      
      return res.json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getEstatisticasGerais', 400);
    }
  };

  getById = async (req, res) => {
    try {
      this.log('log', '📥 getById', { id: req.params.id });

      const cliente = await this.service.getClienteById(req.params.id);
      
      return res.json({
        success: true,
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getById', 404);
    }
  };

  getByEmail = async (req, res) => {
    try {
      this.log('log', '📥 getByEmail', { email: req.params.email });

      const cliente = await this.service.getClienteByEmail(req.params.email);
      
      return res.json({
        success: true,
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getByEmail', 404);
    }
  };

  getEstatisticas = async (req, res) => {
    try {
      this.log('log', '📥 getEstatisticas', { id: req.params.id });

      const estatisticas = await this.service.getEstatisticasCliente(req.params.id);
      
      return res.json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getEstatisticas', 404);
    }
  };

  getResgates = async (req, res) => {
    try {
      this.log('log', '📥 getResgates', { 
        id: req.params.id,
        query: req.query 
      });

      const { page = 1, limit = 10 } = req.query;
      
      const result = await this.service.getResgatesCliente(
        req.params.id, 
        parseInt(page), 
        parseInt(limit)
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getResgates', 404);
    }
  };

  getQrCodes = async (req, res) => {
    try {
      this.log('log', '📥 getQrCodes', { 
        id: req.params.id,
        query: req.query 
      });

      const { page = 1, limit = 20, status } = req.query;
      
      const result = await this.service.getQrCodesCliente(
        req.params.id,
        parseInt(page),
        parseInt(limit),
        status
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getQrCodes', 404);
    }
  };

  getQrCodesPorResgate = async (req, res) => {
    try {
      this.log('log', '📥 getQrCodesPorResgate', { 
        id: req.params.id,
        resgateId: req.params.resgateId 
      });

      const qrCodes = await this.service.getQrCodesPorResgate(
        null,
        req.params.id,
        req.params.resgateId,
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: qrCodes
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getQrCodesPorResgate', 404);
    }
  };

  update = async (req, res) => {
    try {
      this.log('log', '📥 update', { 
        id: req.params.id,
        body: req.body 
      });

      const cliente = await this.service.updateCliente(req.params.id, req.body);
      
      return res.json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'update', 400);
    }
  };

  delete = async (req, res) => {
    try {
      this.log('log', '📥 delete', { id: req.params.id });

      await this.service.deleteCliente(req.params.id, true);
      
      return res.status(204).send();
      
    } catch (error) {
      return this.handleError(res, error, 'delete', 400);
    }
  };

  // ================= ROTAS DE LOJA =================
  getClientesByLoja = async (req, res) => {
    try {
      this.log('log', '📥 getClientesByLoja', { 
        lojaId: req.params.lojaId,
        query: req.query,
        usuario: { id: req.user.id, role: req.user.role }
      });

      const { 
        page = 1, 
        limit = 20, 
        search,
        dataInicio,
        dataFim,
        sortBy = 'ultimoResgate',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        search,
        dataInicio,
        dataFim
      };

      const result = await this.service.getClientesByLoja(
        req.params.lojaId,
        parseInt(page),
        parseInt(limit),
        filters,
        sortBy,
        sortOrder,
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getClientesByLoja', 400);
    }
  };

  getQrCodesPorLoja = async (req, res) => {
    try {
      this.log('log', '📥 getQrCodesPorLoja', { 
        lojaId: req.params.lojaQrCodes,
        query: req.query
      });

      const { 
        page = 1, 
        limit = 20, 
        status,
        dataInicio,
        dataFim,
        search
      } = req.query;

      const result = await this.service.getQrCodesPorLoja(
        req.params.lojaQrCodes,
        parseInt(page),
        parseInt(limit),
        { status, dataInicio, dataFim, search },
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getQrCodesPorLoja', 400);
    }
  };

  getResgatesPorLoja = async (req, res) => {
    try {
      this.log('log', '📥 getResgatesPorLoja', { 
        lojaId: req.params.lojaId,
        query: req.query
      });

      const { 
        page = 1, 
        limit = 20, 
        dataInicio,
        dataFim
      } = req.query;

      const result = await this.service.getResgatesPorLoja(
        req.params.lojaId,
        parseInt(page),
        parseInt(limit),
        { dataInicio, dataFim },
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getResgatesPorLoja', 400);
    }
  };

  getEstatisticasPorLoja = async (req, res) => {
    try {
      this.log('log', '📥 getEstatisticasPorLoja', { 
        lojaId: req.params.lojaId
      });

      const estatisticas = await this.service.getEstatisticasPorLoja(
        req.params.lojaId,
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getEstatisticasPorLoja', 400);
    }
  };

  getClienteByLoja = async (req, res) => {
    try {
      this.log('log', '📥 getClienteByLoja', { 
        lojaId: req.params.lojaId,
        clienteId: req.params.clienteId 
      });

      const cliente = await this.service.getClienteByLoja(
        req.params.lojaId,
        req.params.clienteId,
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: cliente
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getClienteByLoja', 404);
    }
  };

  getResgatesClienteByLoja = async (req, res) => {
    try {
      this.log('log', '📥 getResgatesClienteByLoja', { 
        lojaId: req.params.lojaId,
        clienteId: req.params.clienteId,
        query: req.query
      });

      const { page = 1, limit = 10 } = req.query;

      const result = await this.service.getResgatesClienteByLoja(
        req.params.lojaId,
        req.params.clienteId,
        parseInt(page),
        parseInt(limit),
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getResgatesClienteByLoja', 404);
    }
  };

  getQrCodesClienteByLoja = async (req, res) => {
    try {
      this.log('log', '📥 getQrCodesClienteByLoja', { 
        lojaId: req.params.lojaId,
        clienteId: req.params.clienteId,
        query: req.query
      });

      const { page = 1, limit = 20, status } = req.query;

      const result = await this.service.getQrCodesClienteByLoja(
        req.params.lojaId,
        req.params.clienteId,
        parseInt(page),
        parseInt(limit),
        status,
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getQrCodesClienteByLoja', 404);
    }
  };

  getQrCodesPorResgateByLoja = async (req, res) => {
    try {
      this.log('log', '📥 getQrCodesPorResgateByLoja', { 
        lojaId: req.params.lojaId,
        clienteId: req.params.clienteId,
        resgateId: req.params.resgateId 
      });

      const qrCodes = await this.service.getQrCodesPorResgate(
        req.params.lojaId,
        req.params.clienteId,
        req.params.resgateId,
        { userRole: req.user.role, userId: req.user.id }
      );
      
      return res.json({
        success: true,
        data: qrCodes
      });
      
    } catch (error) {
      return this.handleError(res, error, 'getQrCodesPorResgateByLoja', 404);
    }
  };
}

module.exports = ClienteController;