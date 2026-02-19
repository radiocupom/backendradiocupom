// src/modules/loja/LojaController.js
const LojaService = require('./LojaService');

class LojaController {
  constructor() {
    this.service = new LojaService();
  }

  /**
   * Cria uma nova loja (sem usuário associado)
   */
  create = async (req, res) => {
    try {
      const { nome, email, senha, categoria, descricao } = req.body;
      const logo = req.file ? req.file.path : undefined;

      if (!nome || !email || !senha) {
        return res.status(400).json({ 
          error: 'Nome, email e senha são obrigatórios' 
        });
      }

      const loja = await this.service.createLoja({ 
        nome, 
        email, 
        senha, 
        logo, 
        categoria, 
        descricao 
      });

      const { senha: _, ...lojaSemSenha } = loja;
      res.status(201).json(lojaSemSenha);
    } catch (err) {
      console.error('Erro ao criar loja:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Cria uma loja COM UM USUÁRIO associado (lojista)
   */
  createComUsuario = async (req, res) => {
    try {
      const { 
        nomeLoja, 
        emailLoja, 
        senhaLoja,
        categoria,
        descricao,
        nomeUsuario,
        emailUsuario,
        senhaUsuario
      } = req.body;
      
      const logo = req.file ? req.file.path : undefined;

      // Validação básica
      if (!nomeLoja || !emailLoja || !senhaLoja || !nomeUsuario || !emailUsuario || !senhaUsuario) {
        return res.status(400).json({ 
          error: 'Dados da loja e do usuário são obrigatórios' 
        });
      }

      const resultado = await this.service.createLojaComUsuario({
        nomeLoja,
        emailLoja,
        senhaLoja,
        categoria,
        descricao,
        logo,
        nomeUsuario,
        emailUsuario,
        senhaUsuario
      });

      res.status(201).json({
        message: 'Loja e usuário criados com sucesso',
        data: resultado
      });
    } catch (err) {
      console.error('Erro ao criar loja com usuário:', err);
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Lista todas as lojas
   */
  getAll = async (_req, res) => {
    try {
      const lojas = await this.service.getAllLojas();
      res.json(lojas);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Busca loja por ID
   */
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const loja = await this.service.getLojaById(id);
      res.json(loja);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  /**
   * Busca loja com dados do usuário associado
   */
  getComUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const loja = await this.service.getLojaComUsuario(id);
      res.json(loja);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  /**
 * Lojista atualiza sua própria loja
 */
updateMinhaLoja = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    console.log('🟣 Controller - req.body COMPLETO:', req.body);
    console.log('🟣 Controller - req.file:', req.file);
    console.log('🟣 Controller - req.headers.content-type:', req.headers['content-type']);
    
    const data = {};
    
    // Dados da loja
    if (req.body.nomeLoja) data.nomeLoja = req.body.nomeLoja;
    if (req.body.categoria) data.categoria = req.body.categoria;
    if (req.body.descricao) data.descricao = req.body.descricao;
    
    // Dados do usuário - com logs para ver se estão chegando
    console.log('🟣 Verificando nomeUsuario:', req.body.nomeUsuario);
    if (req.body.nomeUsuario) {
      console.log('🟣 nomeUsuario ENCONTRADO:', req.body.nomeUsuario);
      data.nomeUsuario = req.body.nomeUsuario;
    }
    
    console.log('🟣 Verificando emailUsuario:', req.body.emailUsuario);
    if (req.body.emailUsuario) {
      console.log('🟣 emailUsuario ENCONTRADO:', req.body.emailUsuario);
      data.emailUsuario = req.body.emailUsuario;
    }
    
    console.log('🟣 Verificando senhaUsuario:', req.body.senhaUsuario ? '******' : undefined);
    if (req.body.senhaUsuario) {
      data.senhaUsuario = req.body.senhaUsuario;
    }
    
    // Logo
    if (req.file) {
      data.logo = req.file.path;
    }
    
    console.log('🟣 Dados processados para o service:', data);
    
    const lojaAtualizada = await this.service.atualizarMinhaLoja(usuarioId, data);
    
    res.json(lojaAtualizada);
  } catch (err) {
    console.error('❌ Erro:', err);
    res.status(400).json({ error: err.message });
  }
};

  /**
   * Atualiza uma loja
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = { ...req.body };

      if (req.file) data.logo = req.file.path;

      const lojaAtualizada = await this.service.updateLoja(id, data);
      res.json(lojaAtualizada);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Ativa/desativa pagamento da loja
   */
  togglePayment = async (req, res) => {
    try {
      const { id } = req.params;
      const { payment } = req.body;

      if (typeof payment !== 'boolean') {
        return res.status(400).json({ 
          error: 'O campo payment deve ser true ou false' 
        });
      }

      const loja = await this.service.togglePayment(id, payment);

      res.json({
        message: `Pagamento ${payment ? 'ativado' : 'desativado'} com sucesso`,
        loja
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Deleta uma loja
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteLoja(id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  /**
   * Estatísticas da loja
   */
  getEstatisticas = async (req, res) => {
    try {
      const { id } = req.params;
      const estatisticas = await this.service.getEstatisticas(id);
      res.json(estatisticas);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };
}

module.exports = LojaController;