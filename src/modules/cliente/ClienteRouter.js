// routes/clienteRoutes.js
const express = require('express');
const ClienteController = require('./ClienteController');
const { authenticateToken } = require('../../middlewares/auth');
const { authenticateCliente } = require('../../middlewares/authCliente');
const { authorizeRoles } = require('../../middlewares/role');

const router = express.Router();
const controller = new ClienteController();

// ================= ROTAS PÚBLICAS =================
router.post('/registro', controller.create);
router.post('/login', controller.login);

// ================= ROTAS DO PRÓPRIO CLIENTE =================
router.get('/perfil', authenticateCliente, controller.getPerfil);
router.put('/perfil', authenticateCliente, controller.updatePerfil);
router.delete('/perfil', authenticateCliente, controller.deleteOwnAccount);
router.get('/perfil/estatisticas', authenticateCliente, controller.getOwnEstatisticas);
router.get('/perfil/resgates', authenticateCliente, controller.getOwnResgates);
router.get('/perfil/resgates/:resgateId/qrcodes', authenticateCliente, controller.getOwnQrCodesPorResgate);
router.get('/perfil/qrcodes', authenticateCliente, controller.getOwnQrCodes);
router.get('/perfil/qrcodes/:qrCodeId', authenticateCliente, controller.getOwnQrCodeDetalhes);

// ================= ROTAS DE ADMIN/SUPERADMIN =================
// Listagens com paginação e filtros
router.get('/', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getAll
);

router.get('/estatisticas/gerais', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getEstatisticasGerais
);

router.get('/por-email/:email', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getByEmail
);

router.get('/:id', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getById
);

router.get('/:id/estatisticas', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getEstatisticas
);

router.get('/:id/resgates', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getResgates
);

router.get('/:id/qrcodes', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getQrCodes
);

router.get('/:id/resgates/:resgateId/qrcodes', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getQrCodesPorResgate
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.update
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.delete
);

// ================= ROTAS DE LOJA =================
router.get('/loja/:lojaId/clientes',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getClientesByLoja
);

router.get('/loja/:lojaQrCodes',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getQrCodesPorLoja
);

router.get('/loja/:lojaId/resgates',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getResgatesPorLoja
);

router.get('/loja/:lojaId/estatisticas',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getEstatisticasPorLoja
);

router.get('/loja/:lojaId/cliente/:clienteId',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getClienteByLoja
);

router.get('/loja/:lojaId/cliente/:clienteId/resgates',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getResgatesClienteByLoja
);

router.get('/loja/:lojaId/cliente/:clienteId/qrcodes',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getQrCodesClienteByLoja
);

router.get('/loja/:lojaId/cliente/:clienteId/resgate/:resgateId/qrcodes',
  authenticateToken,
  authorizeRoles('loja', 'admin', 'superadmin'),
  controller.getQrCodesPorResgateByLoja
);

module.exports = router;