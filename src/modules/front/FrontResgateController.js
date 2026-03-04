const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Log para debug (opcional)
});

class FrontResgateController {
  // ================= RESGATAR CUPOM =================
  resgatarCupom = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const { cupomId } = req.body;

      if (!cupomId) {
        return res.status(400).json({
          success: false,
          error: 'ID do cupom é obrigatório'
        });
      }

      // Buscar cupom com detalhes
      const cupom = await prisma.cupom.findUnique({
        where: { id: cupomId },
        include: { loja: true }
      });

      if (!cupom) {
        return res.status(404).json({
          success: false,
          error: 'Cupom não encontrado'
        });
      }

      // ================= VERIFICAÇÕES DE SEGURANÇA =================
      if (!cupom.loja.payment) {
        return res.status(400).json({
          success: false,
          error: 'Loja com pagamento pendente'
        });
      }

      if (new Date() > cupom.dataExpiracao) {
        return res.status(400).json({
          success: false,
          error: 'Cupom expirado'
        });
      }

      // Verificar se ainda há QR codes disponíveis (limite total do cupom)
      const qrCodesExistentes = await prisma.qrCodeUsado.count({
        where: { cupomId }
      });

      if (qrCodesExistentes >= cupom.totalQrCodes) {
        return res.status(400).json({
          success: false,
          error: 'Todos os QR codes deste cupom já foram gerados'
        });
      }

      // 🔥 VERIFICAR LIMITE POR CLIENTE (soma de todas as quantidades)
      const resgatesDoCliente = await prisma.resgate.findMany({
        where: { clienteId, cupomId }
      });

      const quantidadeAtual = resgatesDoCliente.reduce((total, r) => total + r.quantidade, 0);

      if (quantidadeAtual >= cupom.quantidadePorCliente) {
        return res.status(400).json({
          success: false,
          error: `Você já resgatou ${quantidadeAtual} de ${cupom.quantidadePorCliente} vezes`,
          limite: cupom.quantidadePorCliente,
          resgatados: quantidadeAtual
        });
      }

      // ================= FAZER O RESGATE EM TRANSAÇÃO =================
      const resultado = await prisma.$transaction(async (prisma) => {
        // 1. Criar um NOVO registro de resgate
        const resgate = await prisma.resgate.create({
          data: {
            clienteId,
            cupomId,
            quantidade: 1,
            resgatadoEm: new Date()
          }
        });

        // 2. Gerar código ÚNICO para o QR code (cada resgate tem seu próprio código)
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const codigoUnico = `${cupom.codigo}-${timestamp}-${clienteId.substring(0, 8)}-${random}`;

        // 3. Registrar QR code NÃO VALIDADO com o código único e resgateId
        const qrCodeUsado = await prisma.qrCodeUsado.create({
          data: {
            cupomId,
            codigo: codigoUnico,
            clienteId,
            resgateId: resgate.id, // ← CAMPO ADICIONADO
            validado: false,
            usadoEm: new Date()
          }
        });

        return { resgate, qrCode: qrCodeUsado };
      });

      // 🔥 GERAR QR CODE COM A URL COMPLETA (usando o ID do QR code)
      const baseUrl = process.env.BASE_URL || 'https://adm.radiocupom.online';
      const urlValidacao = `${baseUrl}/dashboard-loja/validar/dados/${resultado.qrCode.id}`;
      
      const qrCodeImage = await QRCode.toDataURL(urlValidacao);

      // Calcular estatísticas atualizadas
      const resgatesAtualizados = await prisma.resgate.findMany({
        where: { clienteId, cupomId }
      });
      const novaQuantidade = resgatesAtualizados.reduce((total, r) => total + r.quantidade, 0);
      
      const qrCodesGerados = await prisma.qrCodeUsado.count({
        where: { cupomId }
      });

      res.json({
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
      });

    } catch (err) {
      console.error('❌ Erro ao resgatar cupom:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao processar resgate'
      });
    }
  };

  // ================= HISTÓRICO DE RESGATES =================
  historicoResgates = async (req, res) => {
    try {
      const clienteId = req.cliente.id;

      // Busca TODOS os QR codes do cliente (cada resgate tem seu próprio QR code)
      const qrCodes = await prisma.qrCodeUsado.findMany({
        where: { clienteId },
        include: {
          cupom: {
            include: {
              loja: {
                select: { nome: true, logo: true }
              }
            }
          }
        },
        orderBy: { usadoEm: 'desc' }
      });

      // Gerar imagens para cada QR code
      const baseUrl = process.env.BASE_URL || 'https://adm.radiocupom.online';
      
      const qrCodesComImagem = await Promise.all(
        qrCodes.map(async (qrCode) => {
          const urlValidacao = `${baseUrl}/dashboard-loja/validar/dados/${qrCode.id}`;
          const imagem = await QRCode.toDataURL(urlValidacao);
          
          return {
            id: qrCode.id,
            codigo: qrCode.codigo,
            imagem,
            url: urlValidacao,
            usadoEm: qrCode.usadoEm,
            validado: qrCode.validado,
            validadoEm: qrCode.validadoEm,
            cupom: {
              id: qrCode.cupom.id,
              codigo: qrCode.cupom.codigo,
              descricao: qrCode.cupom.descricao,
              titulo: qrCode.cupom.titulo,
              nomeProduto: qrCode.cupom.nomeProduto,
              loja: qrCode.cupom.loja
            }
          };
        })
      );

      res.json({
        success: true,
        data: qrCodesComImagem
      });

    } catch (err) {
      console.error('❌ Erro ao buscar histórico:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar histórico'
      });
    }
  };

  // ================= VERIFICAR SE PODE RESGATAR =================
  verificarResgate = async (req, res) => {
    try {
      const clienteId = req.cliente.id;
      const { cupomId } = req.params;

      const cupom = await prisma.cupom.findUnique({
        where: { id: cupomId },
        select: {
          id: true,
          quantidadePorCliente: true,
          dataExpiracao: true,
          totalQrCodes: true,
          loja: { select: { payment: true } }
        }
      });

      if (!cupom) {
        return res.status(404).json({
          success: false,
          error: 'Cupom não encontrado'
        });
      }

      // Contar quantos QR codes o cliente já tem para este cupom
      const qrCodesDoCliente = await prisma.qrCodeUsado.count({
        where: { 
          clienteId, 
          cupomId 
        }
      });

      const lojaAtiva = cupom.loja.payment;
      const naoExpirado = new Date() < cupom.dataExpiracao;
      const temQrCode = qrCodesDoCliente < cupom.totalQrCodes;
      const podeResgatar = qrCodesDoCliente < cupom.quantidadePorCliente;

      res.json({
        success: true,
        data: {
          podeResgatar: podeResgatar && lojaAtiva && naoExpirado && temQrCode,
          quantidadeAtual: qrCodesDoCliente,
          limite: cupom.quantidadePorCliente,
          restantes: cupom.quantidadePorCliente - qrCodesDoCliente,
          qrCodesDisponiveis: cupom.totalQrCodes - qrCodesDoCliente,
          lojaAtiva,
          naoExpirado
        }
      });

    } catch (err) {
      console.error('❌ Erro ao verificar resgate:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar resgate'
      });
    }
  };

  // ================= BUSCAR QR CODE ESPECÍFICO =================
  getQRCode = async (req, res) => {
    try {
      const { id } = req.params;
      const clienteId = req.cliente.id;

      const qrCode = await prisma.qrCodeUsado.findUnique({
        where: { id },
        include: { 
          cupom: { 
            include: { 
              loja: true 
            } 
          } 
        }
      });

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR Code não encontrado'
        });
      }

      if (qrCode.clienteId !== clienteId) {
        return res.status(403).json({
          success: false,
          error: 'Este QR code não pertence a você'
        });
      }

      const baseUrl = process.env.BASE_URL || 'https://adm.radiocupom.online';
      const urlValidacao = `${baseUrl}/dashboard-loja/validar/dados/${qrCode.id}`;
      const imagem = await QRCode.toDataURL(urlValidacao);

      res.json({
        success: true,
        data: {
          id: qrCode.id,
          codigo: qrCode.codigo,
          imagem,
          url: urlValidacao,
          usadoEm: qrCode.usadoEm,
          validado: qrCode.validado,
          validadoEm: qrCode.validadoEm,
          cupom: {
            id: qrCode.cupom.id,
            codigo: qrCode.cupom.codigo,
            descricao: qrCode.cupom.descricao,
            titulo: qrCode.cupom.titulo,
            nomeProduto: qrCode.cupom.nomeProduto,
            precoOriginal: qrCode.cupom.precoOriginal,
            precoComDesconto: qrCode.cupom.precoComDesconto,
            percentualDesconto: qrCode.cupom.percentualDesconto,
            dataExpiracao: qrCode.cupom.dataExpiracao,
            termos: qrCode.cupom.termos,
            observacoes: qrCode.cupom.observacoes,
            loja: {
              id: qrCode.cupom.loja.id,
              nome: qrCode.cupom.loja.nome,
              logo: qrCode.cupom.loja.logo
            }
          }
        }
      });

    } catch (err) {
      console.error('❌ Erro ao buscar QR code:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar QR code'
      });
    }
  };

  // ================= VALIDAR QR CODE NA LOJA =================
  validarQrCodeLoja = async (req, res) => {
    try {
      // Aceitar tanto codigo (manual) quanto qrCodeId (QR code)
      const { codigo, qrCodeId } = req.body;
      
      if (!codigo && !qrCodeId) {
        return res.status(400).json({
          success: false,
          error: 'Código do QR code ou ID é obrigatório'
        });
      }

      const [usuario] = await Promise.all([
        prisma.usuario.findUnique({
          where: { id: req.user.id },
          include: { loja: true }
        })
      ]);

      const lojaId = usuario?.loja?.id;
      if (!lojaId) {
        return res.status(400).json({
          success: false,
          error: 'Lojista não possui uma loja associada'
        });
      }

      // Buscar QR code por ID ou por código
      let qrCode;
      if (qrCodeId) {
        // Validação via QR code (por ID)
        qrCode = await prisma.qrCodeUsado.findUnique({
          where: { id: qrCodeId },
          include: {
            cupom: { include: { loja: true } },
            cliente: { select: { id: true, nome: true, email: true, whatsapp: true } }
          }
        });
      } else {
        // Validação manual (por código)
        qrCode = await prisma.qrCodeUsado.findUnique({
          where: { codigo },
          include: {
            cupom: { include: { loja: true } },
            cliente: { select: { id: true, nome: true, email: true, whatsapp: true } }
          }
        });
      }

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR Code inválido ou não encontrado',
          valido: false
        });
      }

      // Verificar se o QR code pertence à loja do comerciante
      if (qrCode.cupom.lojaId !== lojaId) {
        return res.status(403).json({
          success: false,
          error: 'Este QR code não pertence à sua loja',
          valido: false
        });
      }

      // Verificar se o cupom não expirou
      if (new Date() > qrCode.cupom.dataExpiracao) {
        return res.status(400).json({
          success: false,
          error: 'Cupom expirado',
          valido: false
        });
      }

      // Verificar se a loja está com pagamento em dia
      if (!qrCode.cupom.loja.payment) {
        return res.status(400).json({
          success: false,
          error: 'Loja com pagamento pendente',
          valido: false
        });
      }

      // Verificar se já foi validado
      if (qrCode.validado) {
        return res.status(400).json({
          success: false,
          error: 'Este QR code já foi utilizado e validado anteriormente',
          valido: false,
          data: {
            codigo: qrCode.codigo,
            validadoEm: qrCode.validadoEm,
            cliente: qrCode.cliente
          }
        });
      }

      // Validar o QR code
      const qrCodeAtualizado = await prisma.qrCodeUsado.update({
        where: { id: qrCode.id },
        data: { validado: true, validadoEm: new Date() }
      });

      // Se veio da validação por URL (qrCodeId), pode querer redirecionar ou mostrar página de sucesso
      const viaQRCode = !!qrCodeId;

      res.json({
        success: true,
        message: 'QR Code validado com sucesso!',
        valido: true,
        viaQRCode, // Indicar se veio da validação por QR code ou manual
        data: {
          id: qrCodeAtualizado.id,
          codigo: qrCodeAtualizado.codigo,
          usadoEm: qrCodeAtualizado.usadoEm,
          validadoEm: qrCodeAtualizado.validadoEm,
          cliente: qrCode.cliente,
          cupom: {
            id: qrCode.cupom.id,
            descricao: qrCode.cupom.descricao,
            codigo: qrCode.cupom.codigo,
            titulo: qrCode.cupom.titulo,
            nomeProduto: qrCode.cupom.nomeProduto
          },
          loja: { 
            id: qrCode.cupom.loja.id,
            nome: qrCode.cupom.loja.nome 
          }
        }
      });

    } catch (err) {
      console.error('❌ Erro ao validar QR code:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao validar QR code'
      });
    }
  };

  // ================= LISTAR RESGATES DA LOJA =================
  listarResgatesLoja = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { loja: true }
      });

      if (!usuario?.loja) {
        return res.status(400).json({
          success: false,
          error: 'Lojista não possui uma loja associada'
        });
      }

      const lojaId = usuario.loja.id;

      // Agora listamos os QR codes em vez dos resgates
      const qrCodes = await prisma.qrCodeUsado.findMany({
        where: { 
          cupom: { lojaId } 
        },
        include: {
          cliente: { select: { id: true, nome: true, email: true, whatsapp: true } },
          cupom: { select: { id: true, codigo: true, descricao: true, logo: true } }
        },
        orderBy: { usadoEm: 'desc' }
      });

      const qrCodesFormatados = qrCodes.map(qr => ({
        id: qr.id,
        codigo: qr.codigo,
        clienteId: qr.cliente?.id,
        clienteNome: qr.cliente?.nome,
        clienteEmail: qr.cliente?.email,
        clienteWhatsapp: qr.cliente?.whatsapp,
        cupomId: qr.cupom.id,
        cupomCodigo: qr.cupom.codigo,
        cupomDescricao: qr.cupom.descricao,
        cupomLogo: qr.cupom.logo,
        usadoEm: qr.usadoEm,
        validado: qr.validado,
        validadoEm: qr.validadoEm
      }));

      res.json({ success: true, data: qrCodesFormatados });

    } catch (err) {
      console.error('❌ Erro detalhado:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao carregar resgates',
        details: err.message
      });
    }
  };

  // ================= LISTAR QR CODES DA LOJA =================
  listarQrCodesLoja = async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { loja: true }
      });

      if (!usuario?.loja) {
        return res.status(400).json({
          success: false,
          error: 'Lojista não possui uma loja associada'
        });
      }

      const lojaId = usuario.loja.id;

      const qrCodes = await prisma.qrCodeUsado.findMany({
        where: { cupom: { lojaId } },
        include: {
          cupom: { select: { id: true, codigo: true, descricao: true, logo: true } },
          cliente: { select: { id: true, nome: true, email: true, whatsapp: true } }
        },
        orderBy: { usadoEm: 'desc' }
      });

      const qrCodesFormatados = qrCodes.map(qr => ({
        id: qr.id,
        codigo: qr.codigo,
        cupomId: qr.cupom.id,
        cupomCodigo: qr.cupom.codigo,
        cupomDescricao: qr.cupom.descricao,
        cupomLogo: qr.cupom.logo,
        usadoEm: qr.usadoEm,
        validado: qr.validado,
        validadoEm: qr.validadoEm,
        cliente: qr.cliente ? {
          id: qr.cliente.id,
          nome: qr.cliente.nome,
          email: qr.cliente.email,
          whatsapp: qr.cliente.whatsapp
        } : null
      }));

      res.json({ success: true, data: qrCodesFormatados });

    } catch (err) {
      console.error('❌ Erro ao listar QR codes:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao carregar QR codes'
      });
    }
  };
}

module.exports = new FrontResgateController();