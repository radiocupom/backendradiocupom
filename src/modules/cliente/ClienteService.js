const ClienteRepository = require('./ClienteRepository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class ClienteService {
  constructor() {
    this.repository = new ClienteRepository();
  }

  async createCliente(data) {
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
      pais = 'Brasil',
      instagram,
      facebook,
      tiktok,
      receberOfertas = true,
      comoConheceu,
      observacoes
    } = data;

    // Validações dos campos obrigatórios
    if (!nome || !email || !senha) {
      throw new Error('Nome, email e senha são obrigatórios');
    }

    // Validações dos novos campos obrigatórios
    if (!whatsapp) {
      throw new Error('WhatsApp é obrigatório');
    }
    if (!bairro) {
      throw new Error('Bairro é obrigatório');
    }
    if (!cidade) {
      throw new Error('Cidade é obrigatória');
    }
    if (!estado) {
      throw new Error('Estado é obrigatório');
    }
    if (!genero) {
      throw new Error('Gênero é obrigatório');
    }
    if (!dataNascimento) {
      throw new Error('Data de nascimento é obrigatória');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    // Verificar se email já existe
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new Error('Email já cadastrado');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar cliente com TODOS os campos
    const cliente = await this.repository.create({
      nome,
      email,
      senha: hashedPassword,
      whatsapp,
      bairro,
      cidade,
      estado,
      pais,
      genero,
      dataNascimento: new Date(dataNascimento),
      instagram,
      facebook,
      tiktok,
      receberOfertas,
      comoConheceu,
      observacoes,
      ativo: true
    });

    // Remover senha do retorno
    const { senha: _, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  async getAllClientes() {
    const clientes = await this.repository.findAll();
    // Remover senhas de todos
    return clientes.map(({ senha, ...rest }) => rest);
  }

  async getClienteById(id) {
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    const { senha, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  async getClienteByEmail(email) {
    const cliente = await this.repository.findByEmail(email);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    const { senha, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  async getClienteWithResgates(id) {
    const cliente = await this.repository.findWithResgates(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    const { senha, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  async getEstatisticasCliente(id) {
    const cliente = await this.repository.findEstatisticas(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    const { senha, ...clienteSemSenha } = cliente;
    
    // Calcular estatísticas
    const totalResgates = cliente.resgates.length;
    const cuponsUnicos = new Set(cliente.resgates.map(r => r.cupomId)).size;
    const totalQuantidade = cliente.resgates.reduce((acc, r) => acc + r.quantidade, 0);
    
    // Último resgate
    const ultimoResgate = cliente.resgates.length > 0 
      ? cliente.resgates.sort((a, b) => b.resgatadoEm - a.resgatadoEm)[0]
      : null;

    return {
      cliente: clienteSemSenha,
      estatisticas: {
        totalResgates,
        cuponsUnicos,
        totalQuantidade,
        ultimoResgate: ultimoResgate ? {
          data: ultimoResgate.resgatadoEm,
          cupomId: ultimoResgate.cupomId
        } : null
      }
    };
  }

  async updateCliente(id, data) {
    // Verificar se cliente existe
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    // Se estiver atualizando email, verificar se já existe
    if (data.email && data.email !== cliente.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing) throw new Error('Email já cadastrado');
    }

    // Hash da nova senha se fornecida
    if (data.senha) {
      if (data.senha.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    // Atualizar
    const clienteAtualizado = await this.repository.update(id, data);
    
    // Remover senha do retorno
    const { senha, ...clienteSemSenha } = clienteAtualizado;
    return clienteSemSenha;
  }

  async deleteCliente(id) {
    // Verificar se cliente existe
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    // Verificar se tem resgates (opcional - regra de negócio)
    const clienteWithResgates = await this.repository.findWithResgates(id);
    if (clienteWithResgates && clienteWithResgates.resgates.length > 0) {
      throw new Error('Não é possível deletar cliente com histórico de resgates');
    }

    await this.repository.delete(id);
    return true;
  }

  // ClienteService.js
async autenticar(email, senha) {
  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios');
  }

  const cliente = await this.repository.findByEmail(email);
  if (!cliente) throw new Error('Cliente não encontrado');

  const senhaValida = await bcrypt.compare(senha, cliente.senha);
  if (!senhaValida) throw new Error('Senha incorreta');

  // Gerar token JWT
  const token = jwt.sign(
    { 
      id: cliente.id, 
      email: cliente.email,
      tipo: 'cliente'
    },
    process.env.JWT_SECRET_CLIENTE,
    { expiresIn: '30d' }
  );

  // Remover senha do objeto cliente
  const { senha: _, ...clienteSemSenha } = cliente;

  // ✅ RETORNA UM OBJETO COMPLETO
  return {
    cliente: clienteSemSenha,
    token,
    expiresIn: '30d'
  };
}

/**
 * Buscar clientes que resgataram cupons de uma loja
 */
async getClientesByLoja(lojaId, usuario) {
  // Verificação de permissão no service
  if (usuario.userRole === 'loja') {
    // Use o repository para buscar o usuário
    const lojaDoUsuario = await this.repository.findUsuarioWithLoja(usuario.userId);
    
    if (lojaDoUsuario?.loja?.id !== lojaId) {
      throw new Error('Você só pode acessar clientes da sua própria loja');
    }
  }
  
  // Buscar clientes que resgataram cupons desta loja
  const clientes = await this.repository.findClientesByLoja(lojaId);
  
  return clientes;
}

}

module.exports = ClienteService;