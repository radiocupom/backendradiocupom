// src/modules/front/FrontResgateController.js
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const prisma = new PrismaClient();

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
        include: {
          loja: true
        }
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

      // Verificar se ainda há QR codes disponíveis
      if (cupom.qrCodesUsados >= cupom.totalQrCodes) {
        return res.status(400).json({
          success: false,
          error: 'Todos os QR codes deste cupom já foram usados'
        });
      }

      // Verificar limite do cliente
      const resgateExistente = await prisma.resgate.findFirst({
        where: {
          clienteId,
          cupomId
        }
      });

      const quantidadeAtual = resgateExistente ? resgateExistente.quantidade : 0;

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
        // 1. Atualizar ou criar resgate
        const resgate = await prisma.resgate.upsert({
          where: {
            clienteId_cupomId: {
              clienteId,
              cupomId
            }
          },
          update: {
            quantidade: {
              increment: 1
            }
          },
          create: {
            clienteId,
            cupomId,
            quantidade: 1
          }
        });

        // 2. Incrementar contador de QR codes usados no cupom
        const cupomAtualizado = await prisma.cupom.update({
          where: { id: cupomId },
          data: {
            qrCodesUsados: {
              increment: 1
            }
          }
        });

        // 3. Gerar código único para o QR code
        const sequencial = cupomAtualizado.qrCodesUsados;
        const codigoQR = `${cupom.codigo}-${sequencial}-${Date.now()}`;

        // 4. Registrar QR code usado
        const qrCodeUsado = await prisma.qrCodeUsado.create({
          data: {
            cupomId,
            codigo: codigoQR,
            clienteId
          }
        });

        return { 
          resgate, 
          qrCode: qrCodeUsado,
          cupomAtualizado 
        };
      });

      // ================= GERAR IMAGEM DO QR CODE =================
      const qrCodeImage = await QRCode.toDataURL(resultado.qrCode.codigo);

      res.json({
        success: true,
        message: 'Cupom resgatado com sucesso!',
        data: {
          resgate: resultado.resgate,
          qrCode: {
            id: resultado.qrCode.id,
            codigo: resultado.qrCode.codigo,
            imagem: qrCodeImage,
            sequencial: resultado.cupomAtualizado.qrCodesUsados
          },
          cupom: {
            id: cupom.id,
            descricao: cupom.descricao,
            codigo: cupom.codigo
          },
          estatisticas: {
            resgatesRestantes: cupom.quantidadePorCliente - (quantidadeAtual + 1),
            qrCodesRestantes: cupom.totalQrCodes - resultado.cupomAtualizado.qrCodesUsados
          }
        }
      });

    } catch (err) {
      console.error('Erro ao resgatar cupom:', err);
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

      // Buscar resgates
      const resgates = await prisma.resgate.findMany({
        where: { clienteId },
        include: {
          cupom: {
            include: {
              loja: {
                select: {
                  nome: true,
                  logo: true
                }
              }
            }
          }
        },
        orderBy: {
          resgatadoEm: 'desc'
        }
      });

      // Buscar QR codes usados pelo cliente
      const qrCodesUsados = await prisma.qrCodeUsado.findMany({
        where: { clienteId },
        orderBy: { usadoEm: 'desc' }
      });

      // Mapear QR codes para os resgates
      const resgatesComQrCode = resgates.map(resgate => {
        const qrCode = qrCodesUsados.find(qr => qr.cupomId === resgate.cupomId);
        return {
          ...resgate,
          qrCode: qrCode || null
        };
      });

      // Gerar imagens
      const resgatesComImagem = await Promise.all(
        resgatesComQrCode.map(async (item) => {
          if (item.qrCode) {
            const imagem = await QRCode.toDataURL(item.qrCode.codigo);
            return {
              ...item,
              qrCode: {
                ...item.qrCode,
                imagem
              }
            };
          }
          return item;
        })
      );

      res.json({
        success: true,
        data: resgatesComImagem
      });

    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
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
          qrCodesUsados: true,
          loja: {
            select: { payment: true }
          }
        }
      });

      if (!cupom) {
        return res.status(404).json({
          success: false,
          error: 'Cupom não encontrado'
        });
      }

      const resgate = await prisma.resgate.findFirst({
        where: {
          clienteId,
          cupomId
        }
      });

      const quantidadeAtual = resgate ? resgate.quantidade : 0;
      const podeResgatar = quantidadeAtual < cupom.quantidadePorCliente;
      const lojaAtiva = cupom.loja.payment;
      const naoExpirado = new Date() < cupom.dataExpiracao;
      const temQrCode = cupom.qrCodesUsados < cupom.totalQrCodes;

      res.json({
        success: true,
        data: {
          podeResgatar: podeResgatar && lojaAtiva && naoExpirado && temQrCode,
          quantidadeAtual,
          limite: cupom.quantidadePorCliente,
          restantes: cupom.quantidadePorCliente - quantidadeAtual,
          qrCodesDisponiveis: cupom.totalQrCodes - cupom.qrCodesUsados,
          lojaAtiva,
          naoExpirado
        }
      });

    } catch (err) {
      console.error('Erro ao verificar resgate:', err);
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

      // Verificar se o QR code pertence ao cliente
      if (qrCode.clienteId !== clienteId) {
        return res.status(403).json({
          success: false,
          error: 'Este QR code não pertence a você'
        });
      }

      // Gerar imagem
      const imagem = await QRCode.toDataURL(qrCode.codigo);

      res.json({
        success: true,
        data: {
          id: qrCode.id,
          codigo: qrCode.codigo,
          imagem,
          usadoEm: qrCode.usadoEm,
          cupom: {
            id: qrCode.cupom.id,
            descricao: qrCode.cupom.descricao,
            loja: qrCode.cupom.loja.nome
          }
        }
      });

    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar QR code'
      });
    }
  };

  // ================= VALIDAR QR CODE NA LOJA (NOVO) =================
validarQrCodeLoja = async (req, res) => {
  try {
    const { codigo } = req.body;
    
    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Código do QR code é obrigatório'
      });
    }

    // BUSCAR A LOJA DO USUÁRIO
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: { loja: true }
    });

    const lojaId = usuario?.loja?.id;
    if (!lojaId) {
      return res.status(400).json({
        success: false,
        error: 'Lojista não possui uma loja associada'
      });
    }

    // BUSCAR O QR CODE
    const qrCode = await prisma.qrCodeUsado.findUnique({
      where: { codigo },
      include: {
        cupom: { include: { loja: true } },
        cliente: {
          select: { id: true, nome: true, email: true }
        }
      }
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR Code inválido ou não encontrado',
        valido: false
      });
    }

    // VERIFICAR SE PERTENCE À LOJA
    if (qrCode.cupom.lojaId !== lojaId) {
      return res.status(403).json({
        success: false,
        error: 'Este QR code não pertence à sua loja',
        valido: false
      });
    }

    // VERIFICAR SE O CUPOM EXPIRou
    if (new Date() > qrCode.cupom.dataExpiracao) {
      return res.status(400).json({
        success: false,
        error: 'Cupom expirado',
        valido: false
      });
    }

    // VERIFICAR SE A LOJA ESTÁ ATIVA
    if (!qrCode.cupom.loja.payment) {
      return res.status(400).json({
        success: false,
        error: 'Loja com pagamento pendente',
        valido: false
      });
    }

    // 🚨🚨🚨 VERIFICAÇÃO CRÍTICA: JÁ FOI VALIDADO ANTES?
    if (qrCode.validado) {
      return res.status(400).json({
        success: false,
        error: 'Este QR code já foi utilizado e validado anteriormente',
        valido: false,
        data: {
          codigo: qrCode.codigo,
          validadoEm: qrCode.validadoEm,
          cliente: qrCode.cliente,
          primeiraValidacao: qrCode.validadoEm
        }
      });
    }

    // ✅ PRIMEIRA VALIDAÇÃO - MARCAR COMO VALIDADO
    const qrCodeAtualizado = await prisma.qrCodeUsado.update({
      where: { id: qrCode.id },
      data: {
        validado: true,
        validadoEm: new Date()
      }
    });

    // RETORNAR SUCESSO
    res.json({
      success: true,
      message: 'QR Code validado com sucesso!',
      valido: true,
      data: {
        codigo: qrCodeAtualizado.codigo,
        usadoEm: qrCodeAtualizado.usadoEm,
        validadoEm: qrCodeAtualizado.validadoEm,
        cliente: qrCode.cliente,
        cupom: {
          id: qrCode.cupom.id,
          descricao: qrCode.cupom.descricao,
          codigo: qrCode.cupom.codigo
        },
        loja: {
          nome: qrCode.cupom.loja.nome
        }
      }
    });

  } catch (err) {
    console.error('❌ Erro:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar QR code'
    });
  }
};

}

module.exports = new FrontResgateController();