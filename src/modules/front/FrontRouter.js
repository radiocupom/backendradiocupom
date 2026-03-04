// src/modules/front/FrontRouter.js
const express = require('express');
const { authenticateCliente } = require('../../middlewares/authCliente');
const { authenticateToken } = require('../../middlewares/auth'); // ← PARA LOJISTA
const { authorizeRoles } = require('../../middlewares/role');
const { PrismaClient } = require('@prisma/client'); // ← 1. IMPORTAR O PRISMA

const frontLojaController = require('./FrontLojaController');
const frontCupomController = require('./FrontCupomController');
const frontResgateController = require('./FrontResgateController');
const frontProgramacaoController = require('./FrontProgramacaoController');

const router = express.Router();
const prisma = new PrismaClient(); // ← 2. INSTANCIAR O PRISMA

// ================= ROTAS PÚBLICAS =================
// Lojas
router.get('/lojas', frontLojaController.listarLojas);
router.get('/lojas/todas', frontLojaController.listarTodasLojas);
router.get('/lojas/:id', frontLojaController.getLojaById);
router.get('/programacao', frontProgramacaoController.getProgramacao);

// Cupons
router.get('/cupons', frontCupomController.listarCupons);
router.get('/cupons/loja/:lojaId', frontCupomController.listarCuponsPorLoja);
router.get('/cupons/:id', frontCupomController.getCupomById);

// ================= ROTA PÚBLICA PARA VALIDAÇÃO =================
router.get('/validar/dados/:clienteId/:cupomId/:sequencial', 
  async (req, res) => {
    try {
      const { clienteId, cupomId } = req.params;
      
      console.log(`🔍 Buscando dados: cliente ${clienteId}, cupom ${cupomId}`);
      
      const [cliente, cupom] = await Promise.all([
        prisma.cliente.findUnique({ 
          where: { id: clienteId },
          select: { 
            id: true, 
            nome: true, 
            email: true,
            whatsapp: true 
          }
        }),
        prisma.cupom.findUnique({ 
          where: { id: cupomId },
          select: { 
            id: true, 
            codigo: true, 
            descricao: true,
            dataExpiracao: true,
            loja: {
              select: { nome: true }
            }
          }
        })
      ]);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      if (!cupom) {
        return res.status(404).json({ error: 'Cupom não encontrado' });
      }
      
      console.log(`✅ Dados encontrados: ${cliente.nome} - ${cupom.descricao}`);
      
      res.json({ 
        cliente, 
        cupom,
        sequencial: req.params.sequencial 
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados para validação:', error);
      res.status(500).json({ error: 'Erro ao carregar dados' });
    }
  }
);

// ================= ROTAS PROTEGIDAS (CLIENTE) =================
router.post('/resgatar', authenticateCliente, frontResgateController.resgatarCupom);
router.get('/meus-resgates', authenticateCliente, frontResgateController.historicoResgates);
router.get('/verificar-resgate/:cupomId', authenticateCliente, frontResgateController.verificarResgate);
router.get('/qrcode/:id', authenticateCliente, frontResgateController.getQRCode);

// ================= ROTAS PROTEGIDAS (LOJA) =================
router.post('/validar-qrcode', 
  authenticateToken, 
  authorizeRoles('loja'),
  frontResgateController.validarQrCodeLoja
);

router.get('/resgates/loja', 
  authenticateToken, 
  authorizeRoles('loja'),
  frontResgateController.listarResgatesLoja
);

router.get('/qrcodes/loja', 
  authenticateToken, 
  authorizeRoles('loja'),
  frontResgateController.listarQrCodesLoja
);

module.exports = router;