const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

/**
 * Serviço centralizado para processar resgates de cupons.
 * Contém toda a lógica de negócio separada do controller.
 */
class ResgateService {
  /**
   * Processa um resgate de cupom - executa todas as validações e cria registros
   * @param {string} clienteId - ID do cliente
   * @param {string} cupomId - ID do cupom
   * @param {string} baseUrl - URL base para gerar links de validação
   * @returns {Object} Resultado do resgate { resgate, qrCode, cupom, estatisticas }
   */
  async processarResgate(clienteId, cupomId, baseUrl = 'https://adm.radiocupom.online') {
    // ================= VALIDAÇÕES INICIAIS =================
    if (!clienteId || !cupomId) {
      throw new Error('clienteId e cupomId são obrigatórios');
    }

    // Buscar cupom com detalhes
    const cupom = await prisma.cupom.findUnique({
      where: { id: cupomId },
      include: { loja: true }
    });

    if (!cupom) {
      throw new Error('Cupom não encontrado');
    }

    // Verificar pagamento da loja
    if (!cupom.loja.payment) {
      throw new Error('Loja com pagamento pendente');
    }

    // Verificar expiração do cupom
    if (new Date() > cupom.dataExpiracao) {
      throw new Error('Cupom expirado');
    }

    // Verificar se ainda há QR codes disponíveis (limite total do cupom)
    const qrCodesExistentes = await prisma.qrCodeUsado.count({
      where: { cupomId }
    });

    if (qrCodesExistentes >= cupom.totalQrCodes) {
      throw new Error('Todos os QR codes deste cupom já foram gerados');
    }

    // Verificar limite por cliente
    const resgatesDoCliente = await prisma.resgate.findMany({
      where: { clienteId, cupomId }
    });

    const quantidadeAtual = resgatesDoCliente.reduce((total, r) => total + r.quantidade, 0);

    if (quantidadeAtual >= cupom.quantidadePorCliente) {
      throw new Error(
        `Você já resgatou ${quantidadeAtual} de ${cupom.quantidadePorCliente} vezes`
      );
    }

    // ================= FAZER O RESGATE EM TRANSAÇÃO =================
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Criar registro de resgate
      const resgate = await prisma.resgate.create({
        data: {
          clienteId,
          cupomId,
          quantidade: 1,
          resgatadoEm: new Date()
        }
      });

      // 2. Gerar código ÚNICO para o QR code
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const codigoUnico = `${cupom.codigo}-${timestamp}-${clienteId.substring(0, 8)}-${random}`;

      // 3. Registrar QR code não validado
      const qrCodeUsado = await prisma.qrCodeUsado.create({
        data: {
          cupomId,
          codigo: codigoUnico,
          clienteId,
          resgateId: resgate.id,
          validado: false,
          usadoEm: new Date()
        }
      });

      return { resgate, qrCode: qrCodeUsado };
    });

    // ================= GERAR QR CODE COM IMAGEM =================
    const urlValidacao = `${baseUrl}/dashboard-loja/validar/dados/${resultado.qrCode.id}`;
    const qrCodeImage = await QRCode.toDataURL(urlValidacao);

    // ================= CALCULAR ESTATÍSTICAS ATUALIZADAS =================
    const resgatesAtualizados = await prisma.resgate.findMany({
      where: { clienteId, cupomId }
    });
    const novaQuantidade = resgatesAtualizados.reduce((total, r) => total + r.quantidade, 0);

    const qrCodesGerados = await prisma.qrCodeUsado.count({
      where: { cupomId }
    });

    // ================= RETORNAR RESULTADO PROCESSADO =================
    return {
      success: true,
      message: 'Cupom resgatado com sucesso!',
      data: {
        resgate: resultado.resgate,
        qrCode: {
          id: resultado.qrCode.id,
          codigo: resultado.qrCode.codigo,
          imagem: qrCodeImage,
          url: urlValidacao,
          validado: false
        },
        cupom: {
          id: cupom.id,
          codigo: cupom.codigo,
          descricao: cupom.descricao,
          titulo: cupom.titulo || cupom.descricao,
          nomeProduto: cupom.nomeProduto,
          precoOriginal: cupom.precoOriginal,
          precoComDesconto: cupom.precoComDesconto,
          percentualDesconto: cupom.percentualDesconto,
          dataExpiracao: cupom.dataExpiracao,
          termos: cupom.termos,
          observacoes: cupom.observacoes,
          loja: {
            id: cupom.loja.id,
            nome: cupom.loja.nome,
            logo: cupom.loja.logo,
            telefone: cupom.loja.telefone
          }
        },
        estatisticas: {
          resgatesRestantes: cupom.quantidadePorCliente - novaQuantidade,
          qrCodesDisponiveis: cupom.totalQrCodes - qrCodesGerados
        }
      }
    };
  }
}

module.exports = new ResgateService();
