const express = require('express');
const ClienteController = require('./ClienteController');
const { authenticateToken } = require('../../middlewares/auth');
const { authenticateCliente } = require('../../middlewares/authCliente'); // ← NOVO
const { authorizeRoles } = require('../../middlewares/role');

const router = express.Router();
const controller = new ClienteController();

// ================= ROTAS PÚBLICAS =================
// Não precisam de autenticação
router.post('/registro', controller.create);
router.post('/login', controller.login);

// ================= ROTAS DO PRÓPRIO CLIENTE =================
// Usam authenticateCliente (token com secret de cliente)
router.get('/perfil', 
  authenticateCliente,  // ← MUDADO: agora usa authCliente
  controller.getPerfil
);

router.put('/perfil', 
  authenticateCliente,  // ← MUDADO: agora usa authCliente
  controller.updatePerfil
);

// ================= ROTAS DE ADMIN/SUPERADMIN =================
// Usam authenticateToken (token com secret de admin)
router.get('/', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'), 
  controller.getAll
);

router.get('/email/:email',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getByEmail
);

router.get('/:id/estatisticas',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getEstatisticas
);

router.get('/:id/resgates',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getWithResgates
);

router.get('/:id',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getById
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

module.exports = router;