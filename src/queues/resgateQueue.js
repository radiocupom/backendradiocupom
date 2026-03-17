const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Fila Bull dedicada para processar resgates de cupons.
 * Garante que nenhum pedido de resgate seja perdido, com retry automático.
 */
const resgateQueue = new Queue('backendradiocupom-resgates', {
  redis: { url: REDIS_URL },
  defaultJobOptions: {
    attempts: 3, // Retry até 3 vezes
    backoff: {
      type: 'exponential',
      delay: 2000 // Começa com 2s, depois exponencial
    },
    removeOnComplete: true, // Remove jobs completos após 1 hora
    removeOnFail: false // Mantém jobs falhados para análise
  }
});

// Eventos da fila
resgateQueue.on('error', (err) => {
  console.error('❌ Erro na fila de resgates:', err);
});

resgateQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} falhou:`, err.message);
});

resgateQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completado com sucesso`);
});

resgateQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} travou e será retentado`);
});

module.exports = {
  resgateQueue,
};
