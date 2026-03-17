const redis = require('./redisClient');

/**
 * TTL em segundos (padrão: 60s)
 * Ajuste conforme necessidade do dashboard/listas.
 */
const DEFAULT_TTL_SECONDS = 60;

const getCache = async (key) => {
  const raw = await redis.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  const payload = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, payload, 'EX', ttlSeconds);
  } else {
    await redis.set(key, payload);
  }
};

const delCache = async (key) => {
  await redis.del(key);
};

const delCacheByPrefix = async (prefix) => {
  // Atenção: não é recomendado em produção com milhões de chaves,
  // mas para um uso controlado e poucos prefixos, é aceitável.
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length === 0) return;
  await redis.del(...keys);
};

module.exports = {
  getCache,
  setCache,
  delCache,
  delCacheByPrefix,
  DEFAULT_TTL_SECONDS,
};
