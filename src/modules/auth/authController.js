// src/modules/auth/authController.js
const authService = require('./authService');

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const { usuario, token, expiresIn } = await authService.autenticar(email, senha);
    
    res.json({ 
      success: true,
      data: {
        usuario,
        token,
        expiresIn
      }
    });
  } catch (err) {
    // Log do erro (sem expor detalhes internos)
    console.error('Erro no login:', err.message);
    
    // Mensagens amigáveis para o usuário
    const status = err.message.includes('não encontrado') ? 404 : 401;
    res.status(status).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Opcional: refresh token
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    // Implementar refresh token se necessário
    res.status(501).json({ error: 'Funcionalidade não implementada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Opcional: logout
const logout = async (req, res) => {
  try {
    // Como usamos JWT, o logout é feito no cliente
    // Aqui podemos apenas retornar sucesso
    res.json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  login,
  refreshToken,
  logout
};