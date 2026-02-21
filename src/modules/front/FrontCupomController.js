// src/modules/front/FrontCupomController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FrontCupomController {
  // ================= TODOS OS CUPONS =================
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

      console.log(`🎫 Total de cupons disponíveis: ${cupons.length}`);

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

  // ================= CUPONS POR LOJA (NOVO!) =================
  listarCuponsPorLoja = async (req, res) => {
    try {
      const { lojaId } = req.params;

      // Primeiro verifica se a loja existe e está ativa
      const loja = await prisma.loja.findUnique({
        where: { id: lojaId },
        select: { payment: true, nome: true }
      });

      if (!loja) {
        return res.status(404).json({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      if (!loja.payment) {
        return res.status(400).json({
          success: false,
          error: 'Esta loja está temporariamente indisponível'
        });
      }

      // Busca os cupons da loja
      const cupons = await prisma.cupom.findMany({
        where: {
          lojaId: lojaId,
          dataExpiracao: {
            gt: new Date() // Apenas não expirados
          }
        },
        select: {
          id: true,
          codigo: true,
          descricao: true,
          logo: true,
          dataExpiracao: true,
          quantidadePorCliente: true
        },
        orderBy: {
          dataExpiracao: 'asc'
        }
      });

      console.log(`🏪 Loja: ${loja.nome} - ${cupons.length} cupons disponíveis`);

      res.json({
        success: true,
        data: {
          loja: {
            id: lojaId,
            nome: loja.nome
          },
          cupons: cupons
        }
      });
    } catch (err) {
      console.error('Erro ao listar cupons da loja:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar cupons da loja'
      });
    }
  };

  // ================= CUPOM ESPECÍFICO =================
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

      // Verificar expiração
      if (new Date(cupom.dataExpiracao) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Este cupom já expirou'
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