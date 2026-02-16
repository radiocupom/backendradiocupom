// src/middlewares/bearerAuth.js
module.exports = function bearerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Verificar se o header foi enviado
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não enviado' });
  }

  // Verificar formato (deve ser "Bearer TOKEN")
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Formato do token inválido' });
  }

  const [scheme, token] = parts;

  // Verificar se o scheme é "Bearer"
  if (scheme !== 'Bearer') {
    return res.status(401).json({ error: 'Formato Bearer inválido' });
  }

  // Verificar se o token corresponde ao configurado no .env
  if (token !== process.env.API_BEARER_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Token válido, prosseguir
  next();
};