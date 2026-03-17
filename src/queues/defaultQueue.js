const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Exemplo de fila Bull para processar jobs em background.
 *
 * Para usar, importe e adicione jobs no seu código:
 *
 *   const { defaultQueue } = require('../queues/defaultQueue');
 *   defaultQueue.add({ type: 'sendEmail', payload: {...} });
 */

const defaultQueue = new Queue('backendradiocupom-default', {
  redis: { url: REDIS_URL }
});

// Exemplo simples de processador (pode ser movido para outro módulo)
defaultQueue.process(async (job) => {
  console.log(`📦 Processando job ${job.id} (${job.name})`, job.data);
  // TODO: implemente aqui a lógica do job
  return { processed: true };
});

module.exports = {
  defaultQueue,
};
