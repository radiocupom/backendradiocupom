const { Router } = require('express');
const DashboardController = require('./dashboard.controller');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');

const router = Router();
const controller = new DashboardController();

// ================= ROTAS PRINCIPAIS =================

/**
 * @route   GET /api/admin/kpis
 * @desc    KPIs principais do sistema
 * @access  Private (admin/superadmin)
 */
router.get('/kpis',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getKPIs
);

/**
 * @route   GET /api/admin/recent-transactions
 * @desc    Últimas transações do sistema
 * @access  Private (admin/superadmin)
 */
router.get('/recent-transactions',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getRecentTransactions
);

/**
 * @route   GET /api/admin/cupons-populares
 * @desc    Cupons mais resgatados do sistema
 * @access  Private (admin/superadmin)
 */
router.get('/cupons-populares',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getCuponsPopulares
);

/**
 * @route   GET /api/admin/resgates-por-dia
 * @desc    Resgates por dia (últimos 7 dias)
 * @access  Private (admin/superadmin)
 */
router.get('/resgates-por-dia',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getResgatesPorDia
);

// ================= ROTAS DE QR CODES =================

/**
 * @route   GET /api/admin/qrcodes/resgatados
 * @desc    Busca QR codes resgatados
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/resgatados',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getQrCodesResgatados
);

/**
 * @route   GET /api/admin/qrcodes/validados
 * @desc    Busca QR codes validados
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/validados',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getQrCodesValidados
);

/**
 * @route   GET /api/admin/qrcodes/stats
 * @desc    Estatísticas de validação de QR codes
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/stats',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getQrCodeStats
);

/**
 * @route   GET /api/admin/qrcodes/filters
 * @desc    Busca QR codes com filtros avançados
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/filters',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getQrCodesWithFilters
);

/**
 * @route   GET /api/admin/qrcodes/resgatados/periodo
 * @desc    Busca QR codes resgatados por período
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/resgatados/periodo',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getQrCodesResgatadosPorPeriodo
);

/**
 * @route   GET /api/admin/qrcodes/validados/periodo
 * @desc    Busca QR codes validados por período
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/validados/periodo',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getQrCodesValidadosPorPeriodo
);

/**
 * @route   GET /api/admin/qrcodes/taxa-validacao
 * @desc    Calcula a taxa de validação global
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/taxa-validacao',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getTaxaValidacao
);

/**
 * @route   GET /api/admin/qrcodes/tempo-medio-validacao
 * @desc    Calcula o tempo médio de validação global
 * @access  Private (admin/superadmin)
 */
router.get('/qrcodes/tempo-medio-validacao',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getTempoMedioValidacao
);

// ================= ROTAS DE DISTRIBUIÇÃO E RANKING =================

/**
 * @route   GET /api/admin/store-distribution
 * @desc    Distribuição de lojas por categoria
 * @access  Private (admin/superadmin)
 */
router.get('/store-distribution',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getStoreDistribution
);

/**
 * @route   GET /api/admin/store-ranking
 * @desc    Ranking de lojas por resgates
 * @access  Private (admin/superadmin)
 */
router.get('/store-ranking',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getStoreRanking
);

/**
 * @route   GET /api/admin/growth-metrics
 * @desc    Métricas de crescimento
 * @access  Private (admin/superadmin)
 */
router.get('/growth-metrics',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getGrowthMetrics
);

/**
 * @route   GET /api/admin/dados-completos
 * @desc    Todos os dados do dashboard admin
 * @access  Private (admin/superadmin)
 */
router.get('/dados-completos',
  authenticateToken,
  authorizeRoles('admin', 'superadmin'),
  controller.getDadosCompletos
);

module.exports = router;