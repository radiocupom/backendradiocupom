const { resgateQueue } = require('../../queues/resgateQueue');
const ResgateService = require('./ResgateService');

/**
 * Processador de jobs da fila de resgates.
 * Executa a lógica de processar um resgate quando a fila dispara.
 */

// Configurar o processador
resgateQueue.process(async (job) => {
  const { clienteId, cupomId, baseUrl } = job.data;

  console.log(`\n📦 [Job ${job.id}] Processando resgate...`);
  console.log(`   Cliente: ${clienteId}, Cupom: ${cupomId}`);

  try {
    // Chamar o serviço para processar o resgate
    const resultado = await ResgateService.processarResgate(
      clienteId,
      cupomId,
      baseUrl
    );

    console.log(`✅ [Job ${job.id}] Resgate processado com sucesso!`);
    
    // Retornar resultado para que possa ser consultado depois
    return {
      success: true,
      resultado,
      processedAt: new Date()
    };

  } catch (error) {
    console.error(`❌ [Job ${job.id}] Erro ao processar resgate:`, error.message);
    
    // Relançar erro para que Bull cuide dos retries
    throw new Error(`Falha ao processar resgate: ${error.message}`);
  }
});

// ================= LISTENERS PARA MONITORAMENTO =================

resgateQueue.on('progress', (job, progress) => {
  console.log(`⏳ [Job ${job.id}] Progresso: ${progress}%`);
});

resgateQueue.on('active', (job) => {
  console.log(`🔄 [Job ${job.id}] Iniciado`);
});

// Limpar jobs antigos a cada 1 hora
setInterval(async () => {
  try {
    const cleaned = await resgateQueue.clean(3600000, 'completed');
    if (cleaned.length > 0) {
      console.log(`🧹 Limpeza de jobs: ${cleaned.length} jobs antigos removidos`);
    }
  } catch (err) {
    console.error('❌ Erro ao limpar jobs antigos:', err);
  }
}, 3600000);

console.log('✅ Processador de resgates inicializado');

module.exports = resgateQueue;
