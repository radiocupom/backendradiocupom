const express = require('express');
const { authenticateCliente } = require('../../middlewares/authCliente');
const DashboardClienteController = require('./DashboardClienteController');

const router = express.Router();

// 🔒 TODAS AS ROTAS PROTEGIDAS (cliente precisa estar logado)
router.use(authenticateCliente);

// ================= DASHBOARD DO CLIENTE =================
router.get('/resumo', DashboardClienteController.getResumo);
router.get('/resgates', DashboardClienteController.getResgates);
router.get('/resgates/:id', DashboardClienteController.getResgateById);
router.get('/qrcodes', DashboardClienteController.getQrCodes);
router.get('/qrcodes/:id', DashboardClienteController.getQrCodeById);
router.get('/estatisticas', DashboardClienteController.getEstatisticas);
router.get('/perfil', DashboardClienteController.getPerfil);
router.put('/perfil', DashboardClienteController.updatePerfil);

module.exports = router;