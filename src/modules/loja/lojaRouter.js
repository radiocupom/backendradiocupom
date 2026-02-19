// src/modules/loja/lojaRouter.js
const express = require('express');
const LojaController = require('./LojaController');
const upload = require('../../middlewares/upload');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/role');

const router = express.Router();
const controller = new LojaController();

// Middleware de log para debug
const logRequest = (req, res, next) => {
  console.log('📥 Requisição recebida:');
  console.log('  - Método:', req.method);
  console.log('  - URL:', req.originalUrl);
  console.log('  - Content-Type:', req.headers['content-type']);
  console.log('  - Body (raw):', req.body);
  console.log('  - Files:', req.file ? 'Arquivo presente' : 'Nenhum arquivo');
  next();
};

// ================= ROTAS PROTEGIDAS =================

/**
 * @route   POST /api/lojas/com-usuario
 * @desc    Criar nova loja COM usuário associado
 * @access  Private (superadmin, admin)
 */
router.post('/com-usuario',  // ← NOVA ROTA ADICIONADA!
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'),
  upload.single('logo'),
  controller.createComUsuario
);

/**
 * @route   POST /api/lojas
 * @desc    Criar nova loja (sem usuário)
 * @access  Private (superadmin, admin)
 */
router.post('/', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'),
  upload.single('logo'),
  controller.create
);

/**
 * @route   GET /api/lojas
 * @desc    Listar todas as lojas
 * @access  Private (qualquer usuário autenticado)
 */
router.get('/', 
  authenticateToken,
  controller.getAll
);

/**
 * @route   GET /api/lojas/:id
 * @desc    Buscar loja por ID
 * @access  Private (qualquer usuário autenticado)
 */
router.get('/:id', 
  authenticateToken,
  controller.getById
);

/**
 * @route   GET /api/lojas/:id/com-usuario
 * @desc    Buscar loja com dados do usuário
 * @access  Private (superadmin, admin)
 */
router.get('/:id/com-usuario',
  authenticateToken,
  authorizeRoles('superadmin', 'admin'),
  controller.getComUsuario
);

/**
 * @route   PUT /api/lojas/minha-loja
 * @desc    Lojista atualizar sua própria loja
 * @access  Private (loja)
 */
router.put('/minha-loja', 
  authenticateToken, 
  authorizeRoles('loja'),  // <-- SÓ LOJISTA
  upload.single('logo'),
  controller.updateMinhaLoja
);

/**
 * @route   PUT /api/lojas/:id
 * @desc    Atualizar loja + upload de logo
 * @access  Private (superadmin, admin)
 */
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'),
  upload.single('logo'),
  controller.update
);

/**
 * @route   PATCH /api/lojas/:id/payment
 * @desc    Ativar/desativar pagamento
 * @access  Private (superadmin)
 */
router.patch('/:id/payment', 
  authenticateToken, 
  authorizeRoles('superadmin'),
  express.json(),
  controller.togglePayment
);

/**
 * @route   DELETE /api/lojas/:id
 * @desc    Deletar loja
 * @access  Private (superadmin, admin)
 */
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'),
  controller.delete
);

/**
 * @route   GET /api/lojas/:id/estatisticas
 * @desc    Estatísticas da loja
 * @access  Private (superadmin, admin)
 */
router.get('/:id/estatisticas',
  authenticateToken,
  authorizeRoles('superadmin', 'admin', ),
  controller.getEstatisticas
);

/**
 * @route   POST /api/lojas/debug
 * @desc    Rota de debug para testes
 * @access  Private (superadmin, admin)
 */
router.post('/debug', 
  authenticateToken, 
  authorizeRoles('superadmin', 'admin'),
  upload.single('logo'),
  (req, res) => {
    console.log('🐛 DEBUG - req.body COMPLETO:', req.body);
    console.log('🐛 DEBUG - req.file:', req.file);
    
    res.json({
      success: true,
      message: 'Dados recebidos com sucesso!',
      data: {
        body: req.body,
        file: req.file ? {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        } : null
      }
    });
  }
);

module.exports = router;