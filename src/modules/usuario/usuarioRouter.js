// src/modules/usuario/usuarioRouter.js
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');
const controller = require('./usuarioController');

const router = express.Router();
 

// Rotas protegidas
router.post('/', authenticateToken, authorizeRoles('superadmin'), controller.register); 
router.get('/', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getAll);
router.get('/:id', authenticateToken, authorizeRoles('superadmin', 'admin'), controller.getById);
router.put('/:id', authenticateToken, authorizeRoles('superadmin'), controller.update);
router.delete('/:id', authenticateToken, authorizeRoles('superadmin'), controller.remove);

// Rota para o próprio perfil (qualquer usuário autenticado)
router.get('/perfil', authenticateToken, controller.getPerfil);

module.exports = router;