const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');
const DashboardLojaController = require('./DashboardLojaController');

const controller = new DashboardLojaController();

// ================= ROTAS DO LOJISTA =================

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
 * @desc    Últimos resgates da loja com status de validação
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

// ================= ROTAS DE QR CODES =================

/**
 * @route   GET /api/dashboard-loja/qrcodes/resgatados
 * @desc    Busca QR codes resgatados
 * @access  Private (loja)
 */
router.get('/qrcodes/resgatados',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getQrCodesResgatados
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/validados
 * @desc    Busca QR codes validados
 * @access  Private (loja)
 */
router.get('/qrcodes/validados',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getQrCodesValidados
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/stats
 * @desc    Estatísticas de validação de QR codes
 * @access  Private (loja)
 */
router.get('/qrcodes/stats',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getQrCodeStats
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/filters
 * @desc    Busca QR codes com filtros avançados
 * @access  Private (loja)
 */
router.get('/qrcodes/filters',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getQrCodesWithFilters
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/resgatados/periodo
 * @desc    Busca QR codes resgatados por período
 * @access  Private (loja)
 */
router.get('/qrcodes/resgatados/periodo',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getQrCodesResgatadosPorPeriodo
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/validados/periodo
 * @desc    Busca QR codes validados por período
 * @access  Private (loja)
 */
router.get('/qrcodes/validados/periodo',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getQrCodesValidadosPorPeriodo
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/taxa-validacao
 * @desc    Calcula a taxa de validação da loja
 * @access  Private (loja)
 */
router.get('/qrcodes/taxa-validacao',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getTaxaValidacao
);

/**
 * @route   GET /api/dashboard-loja/qrcodes/tempo-medio-validacao
 * @desc    Calcula o tempo médio de validação
 * @access  Private (loja)
 */
router.get('/qrcodes/tempo-medio-validacao',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getTempoMedioValidacao
);

/**
 * @route   GET /api/dashboard-loja/resgates/com-validacao
 * @desc    Busca resgates com status de validação
 * @access  Private (loja)
 */
router.get('/resgates/com-validacao',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getResgatesComValidacao
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