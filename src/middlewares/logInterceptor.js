/**
 * Intercepta console.log, console.error, etc e envia via WebSocket
 */
function interceptConsole() {
  // Verifica se já foi interceptado
  if (global._consoleIntercepted) return;
  
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  console.log = function(...args) {
    // Chama o original primeiro
    originalLog.apply(console, args);
    
    // Envia via WebSocket se a função existir
    if (typeof global.sendLog === 'function') {
      try {
        global.sendLog({
          type: 'log',
          level: 'info',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        // Silencia erros
      }
    }
  };
  
  console.error = function(...args) {
    originalError.apply(console, args);
    
    if (typeof global.sendLog === 'function') {
      try {
        global.sendLog({
          type: 'log',
          level: 'error',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date().toISOString()
        });
      } catch (err) {}
    }
  };
  
  console.warn = function(...args) {
    originalWarn.apply(console, args);
    
    if (typeof global.sendLog === 'function') {
      try {
        global.sendLog({
          type: 'log',
          level: 'warn',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date().toISOString()
        });
      } catch (err) {}
    }
  };
  
  console.info = function(...args) {
    originalInfo.apply(console, args);
    
    if (typeof global.sendLog === 'function') {
      try {
        global.sendLog({
          type: 'log',
          level: 'info',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date().toISOString()
        });
      } catch (err) {}
    }
  };
  
  console.debug = function(...args) {
    originalDebug.apply(console, args);
    
    if (typeof global.sendLog === 'function') {
      try {
        global.sendLog({
          type: 'log',
          level: 'debug',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date().toISOString()
        });
      } catch (err) {}
    }
  };
  
  global._consoleIntercepted = true;
  console.log('🔍 Interceptor de logs via WebSocket ativado');
}

module.exports = { interceptConsole };