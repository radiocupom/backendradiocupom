// src/modules/front/FrontRouter.js
const express = require('express');
const { authenticateCliente } = require('../../middlewares/authCliente');
const { authenticateToken } = require('../../middlewares/auth'); // ← PARA LOJISTA
const { authorizeRoles } = require('../../middlewares/role');
const frontLojaController = require('./FrontLojaController');
const frontCupomController = require('./FrontCupomController');
const frontResgateController = require('./FrontResgateController');

const router = express.Router();

// ================= ROTAS PÚBLICAS =================
router.get('/lojas', frontLojaController.listarLojas);
router.get('/lojas/:id', frontLojaController.getLojaById);
router.get('/cupons', frontCupomController.listarCupons);
router.get('/cupons/:id', frontCupomController.getCupomById);

// ================= ROTAS PROTEGIDAS (CLIENTE) =================
router.post('/resgatar', authenticateCliente, frontResgateController.resgatarCupom);
router.get('/meus-resgates', authenticateCliente, frontResgateController.historicoResgates);
router.get('/verificar-resgate/:cupomId', authenticateCliente, frontResgateController.verificarResgate);
router.get('/qrcode/:id', authenticateCliente, frontResgateController.getQRCode);

// ================= ROTAS PROTEGIDAS (LOJA) =================
// Rota para a loja validar QR code do cliente
router.post('/validar-qrcode', 
  authenticateToken, 
  authorizeRoles('loja'), // ← Apenas lojistas podem validar
  frontResgateController.validarQrCodeLoja
);

 

// 🔥 NOVA ROTA: Listar resgates da loja
router.get('/resgates/loja', 
  authenticateToken, 
  authorizeRoles('loja'),
  frontResgateController.listarResgatesLoja
);

// ================= ROTAS PROTEGIDAS (LOJA) =================
router.get('/resgates/loja', 
  authenticateToken, 
  authorizeRoles('loja'),
  frontResgateController.listarResgatesLoja
);

// 🔥 NOVA ROTA: Listar QR codes da loja
router.get('/qrcodes/loja', 
  authenticateToken, 
  authorizeRoles('loja'),
  frontResgateController.listarQrCodesLoja
);

module.exports = router;