const express = require('express');
const CupomController = require('./CupomController');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');
const upload = require('../../middlewares/upload');

const router = express.Router();
const controller = new CupomController();

// ================= ROTAS PÚBLICAS =================
/**
 * @route   GET /api/cupons/disponiveis
 * @desc    Lista cupons disponíveis para resgate (público)
 * @access  Public
 */
router.get('/disponiveis', controller.getDisponiveis);

// ================= ROTAS PROTEGIDAS =================

/**
 * @route   POST /api/cupons
 * @desc    Criar novo cupom (admin, superadmin, loja)
 * @access  Private
 */
router.post('/',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  upload.single('logo'),
  controller.create
);

/**
 * @route   GET /api/cupons
 * @desc    Listar todos os cupons (apenas admin/superadmin)
 * @access  Private
 */
router.get('/',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getAll
);

/**
 * @route   GET /api/cupons/minha-loja
 * @desc    Listar cupons da própria loja (apenas loja)
 * @access  Private
 */
router.get('/minha-loja',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getMinhaLoja
);

/**
 * @route   GET /api/cupons/loja/:lojaId
 * @desc    Listar cupons por loja (admin, superadmin, loja)
 * @access  Private
 */
router.get('/loja/:lojaId',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.getByLoja
);

/**
 * @route   GET /api/cupons/:id
 * @desc    Buscar cupom por ID
 * @access  Private
 */
router.get('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.getById
);

/**
 * @route   PUT /api/cupons/:id
 * @desc    Atualizar cupom
 * @access  Private
 */
router.put('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  upload.single('logo'),
  controller.update
);

/**
 * @route   DELETE /api/cupons/:id
 * @desc    Deletar cupom (admin, superadmin, loja - loja só os seus)
 * @access  Private
 */
router.delete('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.delete
);

/**
 * @route   POST /api/cupons/:id/qrcodes
 * @desc    Gerar QR codes adicionais para um cupom
 * @access  Private
 */
router.post('/:id/qrcodes',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.gerarQrCodes
);

/**
 * @route   GET /api/cupons/:id/estatisticas
 * @desc    Estatísticas detalhadas do cupom
 * @access  Private
 */
router.get('/:id/estatisticas',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.getEstatisticas
);

/**
 * @route   PATCH /api/cupons/:id/ativar
 * @desc    Ativar cupom
 * @access  Private (admin, superadmin, loja)
 */
router.patch('/:id/ativar',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.ativar
);

/**
 * @route   PATCH /api/cupons/:id/desativar
 * @desc    Desativar cupom
 * @access  Private (admin, superadmin, loja)
 */
router.patch('/:id/desativar',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.desativar
);

module.exports = router;