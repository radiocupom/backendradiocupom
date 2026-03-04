const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Usa o sendLog do WebSocket em vez do enviarLog do SSE
    if (typeof global.sendLog === 'function') {
      try {
        global.sendLog({
          type: 'http',
          level: res.statusCode >= 400 ? (res.statusCode >= 500 ? 'error' : 'warn') : 'info',
          message: `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
          timestamp: new Date().toISOString(),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (err) {
        // Silencia erros
      }
    }
  });
  
  next();
};

module.exports = requestLogger;