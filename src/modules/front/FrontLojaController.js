// src/modules/front/FrontLojaController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FrontLojaController {
  // Listar todas as lojas ativas (com pagamento em dia) - SOMENTE LOJAS!
  listarLojas = async (req, res) => {
    try {
      const lojas = await prisma.loja.findMany({
        where: {
          payment: true
        },
        select: {
          id: true,
          nome: true,
          logo: true,
          email: true,
          categoria: true,
          descricao: true,
        },
        orderBy: {
          nome: 'asc'
        }
      });

      res.json({
        success: true,
        data: lojas
      });
    } catch (err) {
      console.error('Erro ao listar lojas:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar lojas'
      });
    }
  };

  // Versão sem paginação para o marquee
  listarTodasLojas = async (req, res) => {
    try {
      const lojas = await prisma.loja.findMany({
        where: {
          payment: true
        },
        select: {
          id: true,
          nome: true,
          logo: true,
          email: true,
          categoria: true,
          descricao: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      res.json({
        success: true,
        data: lojas
      });
    } catch (err) {
      console.error('Erro ao listar lojas:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar lojas'
      });
    }
  };

  // 🔥 Buscar loja específica por ID COM TODOS OS DADOS DOS CUPONS
  getLojaById = async (req, res) => {
    try {
      const { id } = req.params;

      const loja = await prisma.loja.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          logo: true,
          email: true,
          categoria: true,
          descricao: true,
          cupons: {
            where: {
              dataExpiracao: {
                gt: new Date()
              }
            },
            select: {
              id: true,
              codigo: true,
              descricao: true,
              logo: true,
              dataExpiracao: true,
              quantidadePorCliente: true,
              // 🔥 NOVOS CAMPOS FINANCEIROS
              precoOriginal: true,
              precoComDesconto: true,
              percentualDesconto: true,
              nomeProduto: true
            },
            orderBy: {
              dataExpiracao: 'asc'
            }
          }
        }
      });

      if (!loja) {
        return res.status(404).json({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      res.json({
        success: true,
        data: loja
      });
    } catch (err) {
      console.error('Erro ao buscar loja:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar loja'
      });
    }
  };
}

module.exports = new FrontLojaController();