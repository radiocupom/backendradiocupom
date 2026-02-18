const ClienteService = require('./ClienteService');

class ClienteController {
  constructor() {
    this.service = new ClienteService();
  }

  // ================= ROTAS PÚBLICAS =================

  // Criar cliente (público - registro)
  create = async (req, res) => {
    try {
      const { 
        nome, 
        email, 
        senha,
        whatsapp,
        bairro,
        cidade,
        estado,
        genero,
        dataNascimento,
        pais,
        instagram,
        facebook,
        tiktok,
        receberOfertas,
        comoConheceu,
        observacoes
      } = req.body;

      // Validação básica
      if (!nome || !email || !senha) {
        return res.status(400).json({
          error: 'Nome, email e senha são obrigatórios'
        });
      }

      const cliente = await this.service.createCliente({ 
        nome, 
        email, 
        senha,
        whatsapp,
        bairro,
        cidade,
        estado,
        genero,
        dataNascimento,
        pais,
        instagram,
        facebook,
        tiktok,
        receberOfertas,
        comoConheceu,
        observacoes
      });
      
      res.status(201).json(cliente);
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      res.status(400).json({ error: err.message });
    }
  };

  // Login do cliente (público) - ✅ ATUALIZADO para retornar token
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
        data: {
          cliente,
          token,
          expiresIn
        }
      });
    } catch (err) {
      res.status(401).json({ 
        success: false,
        error: err.message 
      });
    }
  };

  // ================= ROTAS DO PRÓPRIO CLIENTE (com authCliente) =================

  // Próprio perfil (cliente logado) - ✅ ATUALIZADO para usar req.cliente
  getPerfil = async (req, res) => {
    try {
      // req.cliente vem do middleware authenticateCliente
      const cliente = await this.service.getClienteById(req.cliente.id);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // Atualizar próprio perfil (cliente logado) - ✅ ATUALIZADO para usar req.cliente
  updatePerfil = async (req, res) => {
    try {
      const data = req.body;
      // req.cliente vem do middleware authenticateCliente
      const cliente = await this.service.updateCliente(req.cliente.id, data);
      res.json(cliente);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  // Logout (opcional)
  logout = async (req, res) => {
    try {
      // Como é JWT, o logout é feito no cliente
      res.json({ 
        success: true,
        message: 'Logout realizado com sucesso' 
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  // ================= ROTAS DE ADMIN/SUPERADMIN (com auth.js) =================

  // Listar todos (admin/superadmin)
  getAll = async (_req, res) => {
    try {
      const clientes = await this.service.getAllClientes();
      res.json(clientes);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  // Buscar por ID (admin/superadmin)
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const cliente = await this.service.getClienteById(id);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // Buscar por email (admin/superadmin)
  getByEmail = async (req, res) => {
    try {
      const { email } = req.params;
      const cliente = await this.service.getClienteByEmail(email);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // Buscar cliente com resgates (admin/superadmin)
  getWithResgates = async (req, res) => {
    try {
      const { id } = req.params;
      const cliente = await this.service.getClienteWithResgates(id);
      res.json(cliente);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // Estatísticas do cliente (admin/superadmin)
  getEstatisticas = async (req, res) => {
    try {
      const { id } = req.params;
      const estatisticas = await this.service.getEstatisticasCliente(id);
      res.json(estatisticas);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  // Atualizar cliente (admin/superadmin)
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

  // Deletar cliente (admin/superadmin)
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteCliente(id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  /**
 * Buscar clientes que resgataram cupons de uma loja específica
 */
getClientesByLoja = async (req, res) => {
  try {
    const { lojaId } = req.params;
    
    // Verificar permissão (se for lojista, só pode ver sua própria loja)
    if (req.user.role === 'loja') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: { loja: true }
      });
      
      if (usuario?.loja?.id !== lojaId) {
        return res.status(403).json({ 
          error: 'Você só pode acessar clientes da sua própria loja' 
        });
      }
    }

    const clientes = await this.service.getClientesByLoja(lojaId);
    res.json(clientes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

}

module.exports = ClienteController;