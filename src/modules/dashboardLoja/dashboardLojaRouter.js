const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');
const DashboardLojaController = require('./DashboardLojaController');

const controller = new DashboardLojaController();

/**
 * @route   GET /api/dashboard-loja/kpis
 * @desc    KPIs principais da loja
 * @access  Private (loja)
 */
router.get('/kpis',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getKPIs
);

/**
 * @route   GET /api/dashboard-loja/ultimos-resgates
 * @desc    Últimos resgates da loja
 * @access  Private (loja)
 */
router.get('/ultimos-resgates',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getUltimosResgates
);

/**
 * @route   GET /api/dashboard-loja/cupons-populares
 * @desc    Cupons mais resgatados da loja
 * @access  Private (loja)
 */
router.get('/cupons-populares',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getCuponsPopulares
);

/**
 * @route   GET /api/dashboard-loja/resgates-por-dia
 * @desc    Resgates por dia (últimos 7 dias)
 * @access  Private (loja)
 */
router.get('/resgates-por-dia',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getResgatesPorDia
);

/**
 * @route   GET /api/dashboard-loja/dados-completos
 * @desc    Todos os dados do dashboard em uma única chamada
 * @access  Private (loja)
 */
router.get('/dados-completos',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getDadosCompletos
);

module.exports = router;