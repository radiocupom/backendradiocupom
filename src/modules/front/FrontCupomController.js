// src/modules/front/FrontCupomController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FrontCupomController {
  // Listar todos os cupons disponíveis (público)
  listarCupons = async (req, res) => {
    try {
      const cupons = await prisma.cupom.findMany({
        where: {
          dataExpiracao: {
            gt: new Date() // Apenas não expirados
          },
          loja: {
            payment: true // Apenas lojas com pagamento ativo
          }
        },
        select: {
          id: true,
          codigo: true,
          descricao: true,
          logo: true,
          dataExpiracao: true,
          quantidadePorCliente: true,
          loja: {
            select: {
              id: true,
              nome: true,
              logo: true
            }
          }
        },
        orderBy: {
          dataExpiracao: 'asc'
        }
      });

      res.json({
        success: true,
        data: cupons
      });
    } catch (err) {
      console.error('Erro ao listar cupons:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar cupons'
      });
    }
  };

  // Buscar cupom específico (público)
  getCupomById = async (req, res) => {
    try {
      const { id } = req.params;

      const cupom = await prisma.cupom.findUnique({
        where: { id },
        select: {
          id: true,
          codigo: true,
          descricao: true,
          logo: true,
          dataExpiracao: true,
          quantidadePorCliente: true,
          loja: {
            select: {
              id: true,
              nome: true,
              logo: true,
              payment: true
            }
          }
        }
      });

      if (!cupom) {
        return res.status(404).json({
          success: false,
          error: 'Cupom não encontrado'
        });
      }

      // Verificar se a loja está ativa
      if (!cupom.loja.payment) {
        return res.status(400).json({
          success: false,
          error: 'Esta loja está temporariamente indisponível'
        });
      }

      res.json({
        success: true,
        data: cupom
      });
    } catch (err) {
      console.error('Erro ao buscar cupom:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar cupom'
      });
    }
  };
}

module.exports = new FrontCupomController();