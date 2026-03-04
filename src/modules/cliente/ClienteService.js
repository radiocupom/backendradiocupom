const ClienteRepository = require('./ClienteRepository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class ClienteService {
  constructor() {
    this.repository = new ClienteRepository();
  }

  // ================= CRIAÇÃO DE CLIENTE =================
  async createCliente(data) {
    console.log('📥 Service.createCliente - dados recebidos:', data);
    
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

    if (!nome || !email || !senha || !whatsapp) {
      throw new Error('Nome, email, senha e whatsapp são obrigatórios');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    const existing = await this.repository.findByEmail(email);
    if (existing) throw new Error('Email já cadastrado');

    if (dataNascimento) {
      const idade = this.calcularIdade(new Date(dataNascimento));
      if (idade < 18) {
        throw new Error('Cliente deve ter pelo menos 18 anos');
      }
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const clienteData = {
      nome,
      email,
      senha: hashedPassword,
      whatsapp,
      pais,
      receberOfertas,
      ativo: true
    };

    if (bairro) clienteData.bairro = bairro;
    if (cidade) clienteData.cidade = cidade;
    if (estado) clienteData.estado = estado;
    if (genero) clienteData.genero = genero;
    if (instagram) clienteData.instagram = instagram;
    if (facebook) clienteData.facebook = facebook;
    if (tiktok) clienteData.tiktok = tiktok;
    if (comoConheceu) clienteData.comoConheceu = comoConheceu;
    if (observacoes) clienteData.observacoes = observacoes;
    
    if (dataNascimento) {
      clienteData.dataNascimento = new Date(dataNascimento);
    }

    console.log('💾 Salvando cliente com dados:', clienteData);

    const cliente = await this.repository.create(clienteData);
    const { senha: _, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  // 🔥 Utilitário para calcular idade
  calcularIdade(dataNascimento) {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mes = hoje.getMonth() - dataNascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  // ================= LISTAGENS =================
  async getAllClientes() {
    const clientes = await this.repository.findAll();
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

  // ================= RESGATES E ESTATÍSTICAS =================
  async getClienteWithResgates(id) {
    const cliente = await this.repository.findWithResgates(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    const { senha, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  async getResgatesCliente(id) {
    const cliente = await this.repository.findResgatesByCliente(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    return cliente.resgates;
  }

  // 🔥 VERSÃO OTIMIZADA
  async getEstatisticasCliente(id) {
    const cliente = await this.repository.findEstatisticas(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    const { senha, ...clienteSemSenha } = cliente;
    
    const estatisticas = cliente.resgates.reduce((acc, resgate) => {
      acc.totalResgates++;
      acc.cuponsUnicos.add(resgate.cupomId);
      acc.totalQuantidade += resgate.quantidade;
      
      if (!acc.ultimoResgate || new Date(resgate.resgatadoEm) > new Date(acc.ultimoResgate.data)) {
        acc.ultimoResgate = {
          data: resgate.resgatadoEm,
          cupomId: resgate.cupomId
        };
      }
      
      return acc;
    }, {
      totalResgates: 0,
      cuponsUnicos: new Set(),
      totalQuantidade: 0,
      ultimoResgate: null
    });

    return {
      cliente: clienteSemSenha,
      estatisticas: {
        totalResgates: estatisticas.totalResgates,
        cuponsUnicos: estatisticas.cuponsUnicos.size,
        totalQuantidade: estatisticas.totalQuantidade,
        ultimoResgate: estatisticas.ultimoResgate
      }
    };
  }

  // ================= ATUALIZAÇÃO =================
  async updateCliente(id, data) {
    console.log('🔍 Service updateCliente:', { id, data });

    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');

    if (data.dataNascimento) {
      try {
        const dataObj = new Date(data.dataNascimento);
        
        if (isNaN(dataObj.getTime())) {
          throw new Error('Data de nascimento inválida');
        }
        
        data.dataNascimento = dataObj.toISOString();
        console.log('📅 Data convertida:', data.dataNascimento);
      } catch (error) {
        throw new Error('Formato de data inválido. Use o formato DD/MM/YYYY ou YYYY-MM-DD');
      }
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Email inválido');
      }
      
      if (data.email !== cliente.email) {
        const existing = await this.repository.findByEmail(data.email);
        if (existing) throw new Error('Email já cadastrado');
      }
    }

    if (data.senha) {
      if (data.senha.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    console.log('📦 Dados processados para update:', data);

    const clienteAtualizado = await this.repository.update(id, data);
    const { senha, ...clienteSemSenha } = clienteAtualizado;
    return clienteSemSenha;
  }

  async getClienteByLoja(lojaId, clienteId, usuario) {
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      
      if (!temPermissao) {
        throw new Error('Você só pode acessar clientes da sua própria loja');
      }
    }

    const cliente = await this.repository.findClienteByLoja(lojaId, clienteId);
    
    if (!cliente) {
      throw new Error('Cliente não encontrado nesta loja');
    }

    const { senha, ...clienteSemSenha } = cliente;
    return clienteSemSenha;
  }

  // ================= EXCLUSÃO =================
  async deleteCliente(id, isAdmin = false) {
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    const clienteWithResgates = await this.repository.findWithResgates(id);
    
    if (!isAdmin && clienteWithResgates?.resgates?.length > 0) {
      throw new Error('Não é possível excluir conta com histórico de resgates');
    }
    
    await this.repository.delete(id);
    return true;
  }

  // ================= AUTENTICAÇÃO =================
  async autenticar(email, senha) {
    if (!email || !senha) {
      throw new Error('Email e senha são obrigatórios');
    }

    const cliente = await this.repository.findByEmail(email);
    if (!cliente) throw new Error('Cliente não encontrado');

    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    if (!senhaValida) throw new Error('Senha incorreta');

    const token = jwt.sign(
      { 
        id: cliente.id, 
        email: cliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET_CLIENTE,
      { expiresIn: '30d' }
    );

    const { senha: _, ...clienteSemSenha } = cliente;

    return {
      cliente: clienteSemSenha,
      token,
      expiresIn: '30d'
    };
  }

  // ================= CLIENTES POR LOJA =================
  async getClientesByLoja(lojaId, usuario) {
  console.log('🔍 Service.getClientesByLoja:', { lojaId, usuario });
  
  if (usuario.userRole === 'loja') {
    const lojaDoUsuario = await this.repository.findUsuarioWithLoja(usuario.userId);
    console.log('🏪 Loja do usuário:', lojaDoUsuario?.loja?.id);
    
    if (lojaDoUsuario?.loja?.id !== lojaId) {
      throw new Error('Você só pode acessar clientes da sua própria loja');
    }
  }
  
  const clientes = await this.repository.findClientesByLoja(lojaId);
  console.log('✅ Clientes encontrados:', clientes.length);
  return clientes;
}
// NOVO MÉTODO no ClienteService.js
async getQrCodesPorResgate(lojaId, clienteId, resgateId, usuario) {
  try {
    // Verificar permissão da loja
    if (usuario.userRole === 'loja') {
      const temPermissao = await this.repository.verificarPermissaoLoja(usuario.userId, lojaId);
      if (!temPermissao) {
        throw new Error('Você só pode acessar QR codes da sua própria loja');
      }
    }

    // Buscar QR codes do resgate
    const qrCodes = await this.repository.findQrCodesPorResgate(lojaId, clienteId, resgateId);
    
    return qrCodes;
    
  } catch (error) {
    console.error('❌ Erro no service:', error);
    throw error;
  }
}
}

module.exports = ClienteService;