const LojaRepository = require('./LojaRepository');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class LojaService {
  constructor() {
    this.repository = new LojaRepository();
  }

  /**
   * Cria apenas uma loja (sem usuário associado)
   */
  async createLoja(data) {
    const { nome, email, senha, logo, categoria, descricao } = data;

    if (!nome || !email || !senha) {
      throw new Error('Nome, email e senha são obrigatórios');
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

    const hashedPassword = await bcrypt.hash(senha, 10);

    return this.repository.create({
      nome,
      email,
      senha: hashedPassword,
      logo: logo || null,
      payment: false,
      categoria: categoria || 'OUTROS',
      descricao: descricao || null
    });
  }

  /**
   * Cria uma loja COM UM USUÁRIO associado (lojista)
   */
  async createLojaComUsuario(data) {
    const { 
      nomeLoja, 
      emailLoja, 
      senhaLoja,
      categoria,
      descricao,
      logo,
      nomeUsuario,
      emailUsuario,
      senhaUsuario
    } = data;

    if (!nomeLoja || !emailLoja || !senhaLoja || !nomeUsuario || !emailUsuario || !senhaUsuario) {
      throw new Error('Dados da loja e do usuário são obrigatórios');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLoja)) {
      throw new Error('Email da loja inválido');
    }
    if (!emailRegex.test(emailUsuario)) {
      throw new Error('Email do usuário inválido');
    }

    if (senhaLoja.length < 6) throw new Error('Senha da loja deve ter no mínimo 6 caracteres');
    if (senhaUsuario.length < 6) throw new Error('Senha do usuário deve ter no mínimo 6 caracteres');

    const lojaExistente = await prisma.loja.findUnique({
      where: { email: emailLoja }
    });
    if (lojaExistente) throw new Error('Email da loja já cadastrado');

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailUsuario }
    });
    if (usuarioExistente) throw new Error('Email do usuário já cadastrado');

    const hashedSenhaLoja = await bcrypt.hash(senhaLoja, 10);
    const hashedSenhaUsuario = await bcrypt.hash(senhaUsuario, 10);

    const resultado = await prisma.$transaction(async (prismaTx) => {
      const usuario = await prismaTx.usuario.create({
        data: {
          nome: nomeUsuario,
          email: emailUsuario,
          senha: hashedSenhaUsuario,
          role: 'loja'
        }
      });

      const loja = await prismaTx.loja.create({
        data: {
          nome: nomeLoja,
          email: emailLoja,
          senha: hashedSenhaLoja,
          categoria: categoria || 'OUTROS',
          descricao: descricao || '',
          logo: logo || '',
          payment: false,
          usuario: {
            connect: { id: usuario.id }
          }
        }
      });

      const usuarioAtualizado = await prismaTx.usuario.update({
        where: { id: usuario.id },
        data: {
          lojaId: loja.id
        }
      });

      return {
        usuario: usuarioAtualizado,
        loja
      };
    });

    const { senha: senhaUsuarioRemovida, ...usuarioSemSenha } = resultado.usuario;
    const { senha: senhaLojaRemovida, ...lojaSemSenha } = resultado.loja;

    return {
      usuario: usuarioSemSenha,
      loja: lojaSemSenha
    };
  }

  /**
   * Lista todas as lojas COM dados do usuário
   */
  async getAllLojas() {
    const lojas = await prisma.loja.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });
    
    // Remove senhas das lojas
    return lojas.map(({ senha, ...lojaSemSenha }) => lojaSemSenha);
  }

  /**
   * Busca loja por ID COM dados do usuário
   */
  async getLojaById(id) {
    const loja = await prisma.loja.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!loja) throw new Error('Loja não encontrada');
    
    const { senha, ...lojaSemSenha } = loja;
    return lojaSemSenha;
  }

  /**
   * Busca loja com dados do usuário associado (mantido para compatibilidade)
   */
  async getLojaComUsuario(id) {
    return this.getLojaById(id);
  }

  /**
   * Atualiza loja
   */
/**
 * Atualiza loja
 */
/**
 * Atualiza loja
 */
async updateLoja(id, data) {
  const loja = await prisma.loja.findUnique({
    where: { id }
  });
  
  if (!loja) throw new Error('Loja não encontrada');

  if (data.email && data.email !== loja.email) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new Error('Email já cadastrado');
  }

  if (data.senha) {
    if (data.senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }
    data.senha = await bcrypt.hash(data.senha, 10);
  }

  // 🔥 CORREÇÃO: usar o nome do campo como no Prisma (payment)
  const updateData = {
    nome: data.nome ?? loja.nome,
    email: data.email ?? loja.email,
    senha: data.senha ?? loja.senha,
    logo: data.logo ?? loja.logo,
    categoria: data.categoria ?? loja.categoria,
    descricao: data.descricao ?? loja.descricao
  };

  // 🔥 Usar 'payment', não 'payment_status' (o Prisma faz o map automático)
  if (data.payment !== undefined) {
    // Converter string para booleano se necessário
    if (typeof data.payment === 'string') {
      updateData.payment = data.payment === 'true';
    } else {
      updateData.payment = data.payment;
    }
  }

  console.log('📦 updateData enviado para o banco:', updateData);

  const lojaAtualizada = await this.repository.update(id, updateData);
  
  // Buscar a loja atualizada com os dados do usuário
  return this.getLojaById(id);

}

/**
 * Atualiza loja
 */
async updateLoja(id, data) {
  const loja = await prisma.loja.findUnique({
    where: { id }
  });
  
  if (!loja) throw new Error('Loja não encontrada');

  if (data.email && data.email !== loja.email) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new Error('Email já cadastrado');
  }

  if (data.senha) {
    if (data.senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }
    data.senha = await bcrypt.hash(data.senha, 10);
  }

  // 🔥 CORREÇÃO DEFINITIVA: usar APENAS 'payment' (nome do campo no schema)
  const updateData = {
    nome: data.nome ?? loja.nome,
    email: data.email ?? loja.email,
    senha: data.senha ?? loja.senha,
    logo: data.logo ?? loja.logo,
    categoria: data.categoria ?? loja.categoria,
    descricao: data.descricao ?? loja.descricao
  };

  // 🔥 Usar 'payment' - NUNCA usar 'payment_status' no código
  if (data.payment !== undefined) {
    // Converter string para booleano se necessário
    if (typeof data.payment === 'string') {
      updateData.payment = data.payment === 'true';
    } else {
      updateData.payment = data.payment;
    }
  }

  console.log('📦 updateData enviado para o banco:', updateData);

  const lojaAtualizada = await this.repository.update(id, updateData);
  
  // Buscar a loja atualizada com os dados do usuário
  return this.getLojaById(id);
}

  /**
   * Ativa/desativa pagamento da loja
   */
  async togglePayment(id, status) {
    const loja = await this.repository.findById(id);
    if (!loja) throw new Error('Loja não encontrada');

    await this.repository.update(id, { payment: status });
    
    // Retorna a loja com dados do usuário
    return this.getLojaById(id);
  }

  /**
   * Deleta uma loja
   */
  async deleteLoja(id) {
    const loja = await this.repository.findById(id);
    if (!loja) throw new Error('Loja não encontrada');

    const lojaComCupons = await prisma.loja.findUnique({
      where: { id },
      include: {
        cupons: {
          select: { id: true }
        }
      }
    });

    if (lojaComCupons?.cupons.length > 0) {
      throw new Error('Não é possível deletar loja com cupons cadastrados');
    }

    await this.repository.delete(id);
    return true;
  }

  /**
   * Busca estatísticas da loja
   */
  async getEstatisticas(id) {
    const loja = await prisma.loja.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cupons: true
          }
        },
        cupons: {
          select: {
            _count: {
              select: {
                resgates: true,
                qrCodes: true
              }
            },
            resgates: {
              select: {
                quantidade: true
              }
            }
          }
        }
      }
    });

    if (!loja) throw new Error('Loja não encontrada');

    const totalCupons = loja._count.cupons;
    const totalResgates = loja.cupons.reduce((acc, cupom) => 
      acc + cupom.resgates.reduce((sum, r) => sum + r.quantidade, 0), 0
    );
    const totalQrCodes = loja.cupons.reduce((acc, cupom) => 
      acc + cupom._count.qrCodes, 0
    );

    return {
      lojaId: loja.id,
      nome: loja.nome,
      estatisticas: {
        totalCupons,
        totalResgates,
        totalQrCodes,
        mediaResgatesPorCupom: totalCupons > 0 ? (totalResgates / totalCupons).toFixed(2) : 0
      }
    };
  }
}

module.exports = LojaService;