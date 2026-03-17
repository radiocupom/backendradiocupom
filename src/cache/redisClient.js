const Redis = require('ioredis');

// Ao rodar localmente (não docker), o padrão é localhost:6379
// Quando executado via docker-compose, use REDIS_URL=redis://redis:6379
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
  console.log('✅ Conectado ao Redis em', REDIS_URL);
});

redis.on('error', (err) => {
  console.error('❌ Erro no Redis:', err);
});

module.exports = redis;
