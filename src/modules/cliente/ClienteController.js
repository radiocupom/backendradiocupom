const ClienteService = require('./ClienteService');

class ClienteController {
  constructor() {
    this.service = new ClienteService();
  }

  // ================= ROTAS PÚBLICAS =================
  // ClienteController.js
create = async (req, res) => {
  try {
    console.log('📥 Recebendo requisição de cadastro:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    const { 
      nome, 
      email, 
      senha,
      whatsapp
    } = req.body;

    // Validação básica
    if (!nome || !email || !senha || !whatsapp) {
      console.log('❌ Campos obrigatórios faltando:', { nome, email, senha, whatsapp });
      return res.status(400).json({ 
        error: 'Nome, email, senha e whatsapp são obrigatórios' 
      });
    }

    const cliente = await this.service.createCliente(req.body);
    
    console.log('✅ Cliente criado com sucesso:', cliente.id);
    res.status(201).json(cliente);
    
  } catch (err) {
    console.error('❌ Erro no controller.create:', {
      message: err.message,
      stack: err.stack
    });
    res.status(400).json({ error: err.message });
  }
};

  login = async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const { cliente, token, expiresIn } = await this.service.autenticar(email, senha);
      
      res.json({ 
        success: true,
        message: 'Login realizado com sucesso',
        data: { cliente, token, expiresIn }
      });
    } catch (err) {
      res.status(401).json({ success: false, error: err.message });
    }
  };

  logout = async (req, res) => {
    try {
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  // ================= ROTAS DO PRÓPRIO CLIENTE =================
  getPerfil = async (req, res) => {
    try {
      const cliente = await this.service.getClienteById(req.cliente.id);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  updatePerfil = async (req, res) => {
    try {
      const data = req.body;
      const cliente = await this.service.updateCliente(req.cliente.id, data);
      res.json(cliente);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  deleteOwnAccount = async (req, res) => {
    try {
      // 🔥 CORRIGIDO: Passando false porque NÃO é admin
      await this.service.deleteCliente(req.cliente.id, false);
      
      res.json({ 
        success: true,
        message: 'Conta encerrada com sucesso' 
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getOwnEstatisticas = async (req, res) => {
    try {
      const estatisticas = await this.service.getEstatisticasCliente(req.cliente.id);
      res.json(estatisticas);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // 🔥 NOVO: Buscar resgates do próprio cliente
  getOwnResgates = async (req, res) => {
    try {
      const resgates = await this.service.getResgatesCliente(req.cliente.id);
      res.json(resgates);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // ================= ROTAS DE ADMIN/SUPERADMIN =================
  getAll = async (_req, res) => {
    try {
      const clientes = await this.service.getAllClientes();
      res.json(clientes);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const cliente = await this.service.getClienteById(id);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  getByEmail = async (req, res) => {
    try {
      const { email } = req.params;
      const cliente = await this.service.getClienteByEmail(email);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  getWithResgates = async (req, res) => {
    try {
      const { id } = req.params;
      const cliente = await this.service.getClienteWithResgates(id);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  getEstatisticas = async (req, res) => {
    try {
      const { id } = req.params;
      const estatisticas = await this.service.getEstatisticasCliente(id);
      res.json(estatisticas);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const cliente = await this.service.updateCliente(id, data);
      res.json(cliente);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      // 🔥 CORRIGIDO: Passando true porque é admin
      await this.service.deleteCliente(id, true);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

 getClientesByLoja = async (req, res) => {
  try {
    console.log('📥 [getClientesByLoja] Requisição recebida');
    console.log('📥 [getClientesByLoja] Params:', req.params);
    console.log('📥 [getClientesByLoja] lojaId:', req.params.lojaId);
    console.log('📥 [getClientesByLoja] Usuário:', req.user?.id, req.user?.role);
    
    const { lojaId } = req.params;
    
    // 🔥 VALIDAÇÃO - UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(lojaId)) {
      console.error('❌ [getClientesByLoja] lojaId inválido:', lojaId);
      return res.status(400).json({ error: 'ID da loja inválido' });
    }

    const clientes = await this.service.getClientesByLoja(lojaId, {
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    console.log('✅ [getClientesByLoja] Clientes encontrados:', clientes?.length || 0);
    res.json(clientes);
    
  } catch (err) {
    console.error('❌ [getClientesByLoja] Erro:', err.message);
    console.error('❌ [getClientesByLoja] Stack:', err.stack);
    res.status(400).json({ error: err.message });
  }
};

  /**
 * Buscar um cliente específico da loja
 */
getClienteByLoja = async (req, res) => {
  try {
    const { lojaId, clienteId } = req.params;
    
    const cliente = await this.service.getClienteByLoja(lojaId, clienteId, {
      userId: req.user.id,
      userRole: req.user.role
    });
    
    res.json(cliente);
    
  } catch (err) {
    console.error('Erro ao buscar cliente da loja:', err);
    res.status(400).json({ error: err.message });
  }
};

// NOVO MÉTODO no ClienteController.js
getQrCodesPorResgate = async (req, res) => {
  try {
    const { lojaId, clienteId, resgateId } = req.params;
    
    console.log('🔍 [Controller] getQrCodesPorResgate - Params recebidos:', { 
      lojaId, 
      clienteId, 
      resgateId,
      usuarioId: req.user.id,
      usuarioRole: req.user.role
    });
    
    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(lojaId)) {
      console.error('❌ [Controller] lojaId inválido:', lojaId);
      return res.status(400).json({ 
        success: false, 
        error: 'ID da loja inválido' 
      });
    }
    
    if (!uuidRegex.test(clienteId)) {
      console.error('❌ [Controller] clienteId inválido:', clienteId);
      return res.status(400).json({ 
        success: false, 
        error: 'ID do cliente inválido' 
      });
    }
    
    if (!uuidRegex.test(resgateId)) {
      console.error('❌ [Controller] resgateId inválido:', resgateId);
      return res.status(400).json({ 
        success: false, 
        error: 'ID do resgate inválido' 
      });
    }
    
    const qrCodes = await this.service.getQrCodesPorResgate(lojaId, clienteId, resgateId, {
      userId: req.user.id,
      userRole: req.user.role
    });
    
    console.log(`✅ [Controller] Encontrados ${qrCodes.length} QR codes`);
    
    res.json({
      success: true,
      data: qrCodes
    });
    
  } catch (err) {
    console.error('❌ [Controller] Erro ao buscar QR codes do resgate:', {
      message: err.message,
      stack: err.stack
    });
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

}

module.exports = ClienteController;