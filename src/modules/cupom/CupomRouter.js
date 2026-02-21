const express = require('express');
const CupomController = require('./CupomController');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');
const upload = require('../../middlewares/upload');

const router = express.Router();
const controller = new CupomController();

// ================= ROTAS PÚBLICAS =================
router.get('/disponiveis', controller.getDisponiveis);

// ================= ROTAS PROTEGIDAS =================

// Criar cupom
router.post('/',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  upload.single('logo'),
  controller.create
);

// Listar todos (admin/superadmin)
router.get('/',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getAll
);

// ✅ ROTA DO LOJISTA - cupons da própria loja
router.get('/minha-loja',
  authenticateToken,
  authorizeRoles('loja'),
  controller.getMinhaLoja
);

// Estatísticas
router.get('/:id/estatisticas',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.getEstatisticas
);

// Gerar QR codes
router.post('/:id/qrcodes',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.gerarQrCodes
);

// Buscar por ID
router.get('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.getById
);

// Atualizar cupom
router.put('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  upload.single('logo'),
  controller.update
);

// Deletar (apenas superadmin/admin)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.delete
);

// Buscar cupons por loja
router.get('/loja/:lojaId',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', 'loja'),
  controller.getByLoja
);

module.exports = router;