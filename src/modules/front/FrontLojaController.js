// src/modules/front/FrontLojaController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FrontLojaController {
  // Listar todas as lojas ativas (com pagamento em dia) - SOMENTE LOJAS!
  listarLojas = async (req, res) => {
    try {
      const lojas = await prisma.loja.findMany({
        where: {
          payment: true // Apenas lojas com pagamento ativo
        },
        select: {
          id: true,
          nome: true,
          logo: true,
          email: true,
          categoria: true,
          descricao: true, // ← ADICIONA DESCRIÇÃO DA LOJA!
          // 🚫 REMOVE OS CUPONS!
          // cupons: { ... }
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
          descricao: true // ← ADICIONA DESCRIÇÃO AQUI TAMBÉM!
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

  // Buscar loja específica por ID (essa pode trazer cupons)
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
              descricao: true,
              codigo: true,
              logo: true,
              dataExpiracao: true,
              quantidadePorCliente: true
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