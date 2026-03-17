// src/modules/loja/lojaService.js - VERSÃO OTIMIZADA
const LojaRepository = require('./LojaRepository');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../../cache/cacheHelper');

class LojaService {
  constructor() {
    this.repository = new LojaRepository();
  }

  /**
   * Cria apenas uma loja (sem usuário associado)
   */
  async createLoja(data) {
    const { nome, email, senha, logo, categoria, descricao } = data;

    // Invalidate cache de lojas
    await cache.delCacheByPrefix('lojas:');

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

    // Invalidate cache de lojas
    await cache.delCacheByPrefix('lojas:');

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

    // 🔥 Verificações em paralelo
    const [lojaExistente, usuarioExistente] = await Promise.all([
      prisma.loja.findUnique({ where: { email: emailLoja } }),
      prisma.usuario.findUnique({ where: { email: emailUsuario } })
    ]);

    if (lojaExistente) throw new Error('Email da loja já cadastrado');
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
        data: { lojaId: loja.id }
      });

      return { usuario: usuarioAtualizado, loja };
    });

    const { senha: senhaUsuarioRemovida, ...usuarioSemSenha } = resultado.usuario;
    const { senha: senhaLojaRemovida, ...lojaSemSenha } = resultado.loja;

    return { usuario: usuarioSemSenha, loja: lojaSemSenha };
  }

  /**
   * Lista todas as lojas COM dados do usuário
   */
  async getAllLojas() {
    const cacheKey = 'lojas:all';
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const lojas = await this.repository.findAll();
    await cache.setCache(cacheKey, lojas, 30);
    return lojas;
  }

  /**
   * Busca loja por ID COM dados do usuário
   */
  async getLojaById(id) {
    const cacheKey = `lojas:id:${id}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const loja = await this.repository.findById(id);
    if (!loja) throw new Error('Loja não encontrada');

    await cache.setCache(cacheKey, loja, 60);
    return loja;
  }

  /**
   * Lojista atualiza sua própria loja e seus dados de usuário
   */
  async atualizarMinhaLoja(usuarioId, data) {
    console.log('📤 Atualizando loja e usuário:', { usuarioId, data });

    // Cache pode estar desatualizado após alteração de dados
    await cache.delCacheByPrefix('lojas:');
    
    // 🔥 Busca apenas o necessário
    const loja = await prisma.loja.findFirst({
      where: { usuario: { id: usuarioId } },
      select: {
        id: true,
        usuario: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    if (!loja) throw new Error('Loja não encontrada para este usuário');
    
    // Prepara dados para atualização
    const lojaUpdateData = {};
    const usuarioUpdateData = {};
    
    if (data.nomeLoja) lojaUpdateData.nome = data.nomeLoja;
    if (data.categoria) lojaUpdateData.categoria = data.categoria;
    if (data.descricao) lojaUpdateData.descricao = data.descricao;
    if (data.logo) lojaUpdateData.logo = data.logo;
    
    if (data.nomeUsuario) usuarioUpdateData.nome = data.nomeUsuario;
    if (data.emailUsuario && data.emailUsuario !== loja.usuario.email) {
      const existingUser = await prisma.usuario.findFirst({
        where: { 
          email: data.emailUsuario,
          NOT: { id: loja.usuario.id }
        }
      });
      if (existingUser) throw new Error('Email de usuário já cadastrado');
      usuarioUpdateData.email = data.emailUsuario;
    }
    
    if (data.senhaUsuario) {
      if (data.senhaUsuario.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }
      usuarioUpdateData.senha = await bcrypt.hash(data.senhaUsuario, 10);
    }
    
    // Executa atualizações em transação
    const resultado = await prisma.$transaction(async (prismaTx) => {
      if (Object.keys(lojaUpdateData).length > 0) {
        await prismaTx.loja.update({
          where: { id: loja.id },
          data: lojaUpdateData
        });
      }
      
      if (Object.keys(usuarioUpdateData).length > 0) {
        await prismaTx.usuario.update({
          where: { id: loja.usuario.id },
          data: usuarioUpdateData
        });
      }
    });
    
    // Retorna dados atualizados
    return this.getLojaById(loja.id);
  }

  /**
   * Atualiza loja
   */
  async updateLoja(id, data) {
    // Invalidate cache antes de atualizar (para não servir dados antigos)
    await cache.delCacheByPrefix('lojas:');

    const loja = await this.repository.findById(id);
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

    const updateData = {
      nome: data.nome ?? loja.nome,
      email: data.email ?? loja.email,
      senha: data.senha ?? loja.senha,
      logo: data.logo ?? loja.logo,
      categoria: data.categoria ?? loja.categoria,
      descricao: data.descricao ?? loja.descricao
    };

    if (data.payment !== undefined) {
      updateData.payment = typeof data.payment === 'string' 
        ? data.payment === 'true' 
        : data.payment;
    }

    await this.repository.update(id, updateData);
    
    // Retorna dados completos
    return this.getLojaById(id);
  }

  /**
   * Ativa/desativa pagamento da loja
   */
  async togglePayment(id, status) {
    // Invalidate cache pois o status de pagamento mudou
    await cache.delCacheByPrefix('lojas:');

    const loja = await this.repository.findById(id);
    if (!loja) throw new Error('Loja não encontrada');

    await this.repository.update(id, { payment: status });
    return this.getLojaById(id);
  }

  /**
   * Deleta uma loja
   */
  async deleteLoja(id) {
    // Invalidate cache antes de remover registro
    await cache.delCacheByPrefix('lojas:');

    const loja = await this.repository.findById(id);
    if (!loja) throw new Error('Loja não encontrada');

    // 🔥 Verifica cupons de forma eficiente
    const lojaComCupons = await prisma.loja.findUnique({
      where: { id },
      select: {
        _count: {
          select: { cupons: true }
        }
      }
    });

    if (lojaComCupons?._count.cupons > 0) {
      throw new Error('Não é possível deletar loja com cupons cadastrados');
    }

    await this.repository.delete(id);
    return true;
  }

  /**
   * Busca estatísticas da loja - VERSÃO OTIMIZADA
   */
  async getEstatisticas(id) {
    const cacheKey = `lojas:estatisticas:${id}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const loja = await prisma.loja.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        _count: {
          select: { cupons: true }
        },
        cupons: {
          select: {
            _count: {
              select: {
                resgates: true
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

    const result = {
      lojaId: loja.id,
      nome: loja.nome,
      estatisticas: {
        totalCupons,
        totalResgates,
        mediaResgatesPorCupom: totalCupons > 0 
          ? Number((totalResgates / totalCupons).toFixed(2)) 
          : 0
      }
    };

    await cache.setCache(cacheKey, result, 60);
    return result;
  }
}

module.exports = LojaService;