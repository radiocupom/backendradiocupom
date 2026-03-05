const CupomService = require('./CupomService');

class CupomController {
  constructor() {
    this.service = new CupomService();
  }

  /**
   * Criar novo cupom
   */
  create = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email, role } = req.user;

    try {
      console.log(`📝 [CREATE] Iniciando criação de cupom - Usuário: ${email} (${role})`);

      const { 
        codigo, 
        descricao, 
        quantidadePorCliente, 
        dataExpiracao, 
        lojaId,
        quantidadeQrCodes,
        precoOriginal,
        precoComDesconto,
        percentualDesconto,
        nomeProduto
      } = req.body;

      const logo = req.file ? req.file.path : '';

      if (!codigo || !descricao || !quantidadePorCliente || !dataExpiracao || !lojaId) {
        return res.status(400).json({
          success: false,
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
        precoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
        precoComDesconto: precoComDesconto ? parseFloat(precoComDesconto) : null,
        percentualDesconto: percentualDesconto ? parseInt(percentualDesconto) : null,
        nomeProduto
      }, req.user);

      console.log(`✅ [CREATE] Cupom criado: ${cupom.id} - ${cupom.codigo} em ${Date.now() - startTime}ms`);

      return res.status(201).json({
        success: true,
        data: cupom
      });

    } catch (error) {
      console.error(`❌ [CREATE] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Listar todos os cupons (admin/superadmin)
   */
  getAll = async (_req, res) => {
    const startTime = Date.now();

    try {
      console.log(`📋 [GET_ALL] Listando todos os cupons`);

      const cupons = await this.service.getAllCupons();

      console.log(`✅ [GET_ALL] Encontrados ${cupons.length} cupons em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupons
      });

    } catch (error) {
      console.error(`❌ [GET_ALL] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Listar cupons disponíveis (público)
   */
  getDisponiveis = async (_req, res) => {
    const startTime = Date.now();

    try {
      console.log(`🌐 [DISPONIVEIS] Listando cupons disponíveis`);

      const cupons = await this.service.getCuponsDisponiveis();

      console.log(`✅ [DISPONIVEIS] Encontrados ${cupons.length} cupons em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupons
      });

    } catch (error) {
      console.error(`❌ [DISPONIVEIS] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Buscar cupom por ID
   */
  getById = async (req, res) => {
    const startTime = Date.now();
    const { email, role } = req.user;

    try {
      const { id } = req.params;
      console.log(`🔍 [GET_BY_ID] Buscando cupom: ${id} - Usuário: ${email} (${role})`);

      const cupom = await this.service.getCupomById(id, req.user);

      console.log(`✅ [GET_BY_ID] Cupom encontrado: ${cupom.codigo} em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupom
      });

    } catch (error) {
      console.error(`❌ [GET_BY_ID] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Buscar cupons por loja
   */
  getByLoja = async (req, res) => {
    const startTime = Date.now();

    try {
      const { lojaId } = req.params;
      console.log(`🏪 [GET_BY_LOJA] Buscando cupons da loja: ${lojaId}`);

      const cupons = await this.service.getCuponsByLoja(lojaId);

      console.log(`✅ [GET_BY_LOJA] Encontrados ${cupons.length} cupons em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupons
      });

    } catch (error) {
      console.error(`❌ [GET_BY_LOJA] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Listar cupons da própria loja (para lojista)
   */
  getMinhaLoja = async (req, res) => {
    const startTime = Date.now();
    const { email, id: usuarioId } = req.user;

    try {
      console.log(`👤 [MINHA_LOJA] Buscando cupons do lojista: ${email}`);

      const cupons = await this.service.getCuponsByLojista(req.user);

      console.log(`✅ [MINHA_LOJA] Encontrados ${cupons.length} cupons em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupons
      });

    } catch (error) {
      console.error(`❌ [MINHA_LOJA] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Atualizar cupom
   */
  update = async (req, res) => {
    const startTime = Date.now();
    const { email, role } = req.user;

    try {
      const { id } = req.params;
      console.log(`📝 [UPDATE] Atualizando cupom: ${id} - Usuário: ${email} (${role})`);
      console.log(`📦 [UPDATE] Body recebido:`, req.body);

      const data = { ...req.body };
      
      if (req.file) {
        data.logo = req.file.path;
        console.log(`🖼️ [UPDATE] Logo atualizada:`, data.logo);
      }

      // Converter campos numéricos
      if (data.quantidadePorCliente) data.quantidadePorCliente = parseInt(data.quantidadePorCliente);
      if (data.precoOriginal) data.precoOriginal = parseFloat(data.precoOriginal);
      if (data.precoComDesconto) data.precoComDesconto = parseFloat(data.precoComDesconto);
      if (data.percentualDesconto) data.percentualDesconto = parseInt(data.percentualDesconto);
      
      const cupom = await this.service.updateCupom(id, data, req.user);

      console.log(`✅ [UPDATE] Cupom atualizado: ${cupom.id} em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: cupom
      });

    } catch (error) {
      console.error(`❌ [UPDATE] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Deletar cupom
   */
  delete = async (req, res) => {
    const startTime = Date.now();
    const { id: usuarioId, email, role } = req.user;

    try {
      const { id } = req.params;
      console.log(`🗑️ [DELETE] Iniciando exclusão do cupom: ${id} - Usuário: ${email} (${role})`);

      const resultado = await this.service.deleteCupom(id, usuarioId, role);

      console.log(`✅ [DELETE] Cupom deletado com sucesso em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        message: resultado.message || 'Cupom deletado com sucesso'
      });

    } catch (error) {
      console.error(`❌ [DELETE] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Gerar QR codes adicionais
   */
  gerarQrCodes = async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const { quantidade = 1 } = req.body;

      console.log(`📱 [QR_CODES] Gerando ${quantidade} QR codes para cupom: ${id}`);

      const resultado = await this.service.gerarQrCodes(id, parseInt(quantidade), req.user);

      console.log(`✅ [QR_CODES] QR codes gerados em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error(`❌ [QR_CODES] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Estatísticas detalhadas do cupom
   */
  getEstatisticas = async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      console.log(`📊 [ESTATISTICAS] Buscando estatísticas do cupom: ${id}`);

      const estatisticas = await this.service.getEstatisticas(id, req.user);

      console.log(`✅ [ESTATISTICAS] Estatísticas calculadas em ${Date.now() - startTime}ms`);

      return res.status(200).json({
        success: true,
        data: estatisticas
      });

    } catch (error) {
      console.error(`❌ [ESTATISTICAS] Erro:`, {
        mensagem: error.message,
        stack: error.stack,
        tempo: `${Date.now() - startTime}ms`
      });

      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
 * Ativar cupom
 */
ativar = async (req, res) => {
  const startTime = Date.now();
  const { id: usuarioId, email, role } = req.user;

  try {
    const { id } = req.params;
    console.log(`🔛 [ATIVAR] Ativando cupom: ${id} - Usuário: ${email} (${role})`);

    const cupom = await this.service.ativarCupom(id, usuarioId, role);

    console.log(`✅ [ATIVAR] Cupom ativado em ${Date.now() - startTime}ms`);

    return res.status(200).json({
      success: true,
      data: cupom
    });

  } catch (error) {
    console.error(`❌ [ATIVAR] Erro:`, {
      mensagem: error.message,
      stack: error.stack,
      tempo: `${Date.now() - startTime}ms`
    });

    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Desativar cupom
 */
desativar = async (req, res) => {
  const startTime = Date.now();
  const { id: usuarioId, email, role } = req.user;

  try {
    const { id } = req.params;
    console.log(`🔚 [DESATIVAR] Desativando cupom: ${id} - Usuário: ${email} (${role})`);

    const cupom = await this.service.desativarCupom(id, usuarioId, role);

    console.log(`✅ [DESATIVAR] Cupom desativado em ${Date.now() - startTime}ms`);

    return res.status(200).json({
      success: true,
      data: cupom
    });

  } catch (error) {
    console.error(`❌ [DESATIVAR] Erro:`, {
      mensagem: error.message,
      stack: error.stack,
      tempo: `${Date.now() - startTime}ms`
    });

    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

}

module.exports = CupomController;