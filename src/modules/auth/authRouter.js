// src/modules/auth/authRouter.js
const express = require('express');
const authController = require('./authController');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas (opcionais)
router.post('/refresh', authenticateToken, authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;