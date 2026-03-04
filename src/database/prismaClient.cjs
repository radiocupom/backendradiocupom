// src/database/prismaClient.cjs
const { PrismaClient } = require('@prisma/client');

// Configuração otimizada para produção
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'], // Em produção, logs apenas de erro
  
  errorFormat: 'pretty',
  
  // Configurações de conexão para pool
  datasources: {
    db: {
      url: process.env.DATABASE_URL + 
        (process.env.NODE_ENV === 'production' 
          ? '?connection_limit=20&pool_timeout=10&statement_timeout=10000' 
          : '')
    }
  }
});

// ✅ CORRETO: Eventos permitidos no Prisma 5+
prisma.$on('error', (error) => {
  console.error('❌ Prisma Client error:', error);
});

// ✅ CORRETO: Graceful shutdown no processo, não no Prisma
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('✅ Prisma desconectado (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('✅ Prisma desconectado (SIGTERM)');
  process.exit(0);
});

// Opcional: timeout para evitar hangs
const GRACEFUL_TIMEOUT = 5000; // 5 segundos

const gracefulShutdown = async (signal) => {
  console.log(`⚠️ Recebido ${signal}, encerrando graciosamente...`);
  
  const timeout = setTimeout(() => {
    console.error('❌ Timeout no encerramento, forçando saída');
    process.exit(1);
  }, GRACEFUL_TIMEOUT);
  
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma desconectado com sucesso');
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao desconectar Prisma:', error);
    clearTimeout(timeout);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = prisma;