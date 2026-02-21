// src/modules/front/FrontRouter.js
const express = require('express');
const { authenticateCliente } = require('../../middlewares/authCliente');
const { authenticateToken } = require('../../middlewares/auth'); // ← PARA LOJISTA
const { authorizeRoles } = require('../../middlewares/role');
const frontLojaController = require('./FrontLojaController');
const frontCupomController = require('./FrontCupomController');
const frontResgateController = require('./FrontResgateController');
const frontProgramacaoController = require('./FrontProgramacaoController');

const router = express.Router();

// ================= ROTAS PÚBLICAS =================
// Lojas
router.get('/lojas', frontLojaController.listarLojas);
router.get('/lojas/todas', frontLojaController.listarTodasLojas);
router.get('/lojas/:id', frontLojaController.getLojaById);
router.get('/programacao', frontProgramacaoController.getProgramacao);

// Cupons
router.get('/cupons', frontCupomController.listarCupons);
router.get('/cupons/loja/:lojaId', frontCupomController.listarCuponsPorLoja); // ← NOVA!
router.get('/cupons/:id', frontCupomController.getCupomById);

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