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
router.get('/perfil/resgates', authenticateCliente, controller.getOwnResgates); // 🔥 NOVA ROTA

// ================= ROTAS DE ADMIN/SUPERADMIN =================
router.get('/', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getAll);
router.get('/email/:email', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getByEmail);
router.get('/:id/estatisticas', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getEstatisticas);
router.get('/:id/resgates', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getWithResgates);
router.get('/:id', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getById);
router.put('/:id', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.update);
router.delete('/:id', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.delete);

// ================= ROTAS DE LOJA =================
router.get('/loja/:lojaId/clientes', authenticateToken, authorizeRoles('loja', 'admin', 'superadmin'), controller.getClientesByLoja);

module.exports = router;