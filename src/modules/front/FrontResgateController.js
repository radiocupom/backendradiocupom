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

      // Buscar cupom com detalhes - USANDO ÍNDICE NATURAL (id)
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

      // 🔥 NOVA REGRA: Verificar se ainda há QR codes NÃO VALIDADOS disponíveis
      // Usando índice composto em qrCodesUsados (cupomId, validado)
      const qrCodesNaoValidados = await prisma.qrCodeUsado.count({
        where: {
          cupomId,
          validado: false
        }
      });

      if (qrCodesNaoValidados >= cupom.totalQrCodes) {
        return res.status(400).json({
          success: false,
          error: 'Todos os QR codes deste cupom já foram resgatados'
        });
      }

      // Verificar limite do cliente - usando índice composto (clienteId, cupomId)
      const resgateExistente = await prisma.resgate.findUnique({
        where: {
          clienteId_cupomId: {
            clienteId,
            cupomId
          }
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

        // 2. 🔥 NÃO incrementa mais qrCodesUsados (agora só na validação)

        // 3. Gerar código único para o QR code
        const sequencial = await prisma.qrCodeUsado.count({
          where: { cupomId }
        }) + 1;
        
        const codigoQR = `${cupom.codigo}-${sequencial}-${Date.now()}`;

        // 4. Registrar QR code NÃO VALIDADO
        const qrCodeUsado = await prisma.qrCodeUsado.create({
          data: {
            cupomId,
            codigo: codigoQR,
            clienteId,
            validado: false,
            usadoEm: new Date()
          }
        });

        return { 
          resgate, 
          qrCode: qrCodeUsado
        };
      });

      // ================= GERAR IMAGEM DO QR CODE =================
      const qrCodeImage = await QRCode.toDataURL(resultado.qrCode.codigo);

      // 🔥 Calcular disponibilidade baseado em NÃO VALIDADOS
      const qrCodesNaoValidadosTotal = await prisma.qrCodeUsado.count({
        where: {
          cupomId,
          validado: false
        }
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
  // sequencial: sequencial - 1,  ← REMOVER ESTA LINHA!
  validado: false
},
          cupom: {
            id: cupom.id,
            descricao: cupom.descricao,
            codigo: cupom.codigo
          },
          estatisticas: {
            resgatesRestantes: cupom.quantidadePorCliente - (quantidadeAtual + 1),
            qrCodesDisponiveis: cupom.totalQrCodes - qrCodesNaoValidadosTotal
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

      // Buscar resgates com índices otimizados
      const resgates = await prisma.resgate.findMany({
        where: { clienteId }, // Usa índice em clienteId
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

      // Buscar QR codes do cliente - usando índice em clienteId
      const qrCodesUsados = await prisma.qrCodeUsado.findMany({
        where: { clienteId }, // Usa índice em clienteId
        orderBy: { usadoEm: 'desc' }
      });

      // Mapear QR codes para os resgates (em memória - mais rápido que múltiplas queries)
      const qrCodeMap = new Map();
      qrCodesUsados.forEach(qr => {
        qrCodeMap.set(qr.cupomId, qr);
      });

      const resgatesComQrCode = resgates.map(resgate => ({
        ...resgate,
        qrCode: qrCodeMap.get(resgate.cupomId) || null
      }));

      // Gerar imagens (paralelo para performance)
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

      // Buscar cupom e resgate em paralelo para performance
      const [cupom, resgate] = await Promise.all([
        prisma.cupom.findUnique({
          where: { id: cupomId }, // Usa índice em id
          select: {
            id: true,
            quantidadePorCliente: true,
            dataExpiracao: true,
            totalQrCodes: true,
            loja: {
              select: { payment: true }
            }
          }
        }),
        prisma.resgate.findUnique({
          where: {
            clienteId_cupomId: { // Usa índice composto
              clienteId,
              cupomId
            }
          }
        })
      ]);

      if (!cupom) {
        return res.status(404).json({
          success: false,
          error: 'Cupom não encontrado'
        });
      }

      // Contar QR codes não validados - usando índice composto
      const qrCodesNaoValidados = await prisma.qrCodeUsado.count({
        where: {
          cupomId,
          validado: false
        }
      });

      const quantidadeAtual = resgate ? resgate.quantidade : 0;
      const podeResgatar = quantidadeAtual < cupom.quantidadePorCliente;
      const lojaAtiva = cupom.loja.payment;
      const naoExpirado = new Date() < cupom.dataExpiracao;
      const temQrCode = qrCodesNaoValidados < cupom.totalQrCodes;

      res.json({
        success: true,
        data: {
          podeResgatar: podeResgatar && lojaAtiva && naoExpirado && temQrCode,
          quantidadeAtual,
          limite: cupom.quantidadePorCliente,
          restantes: cupom.quantidadePorCliente - quantidadeAtual,
          qrCodesDisponiveis: cupom.totalQrCodes - qrCodesNaoValidados,
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
        where: { id }, // Usa índice em id
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
          validado: qrCode.validado,
          validadoEm: qrCode.validadoEm,
          cupom: {
            id: qrCode.cupom.id,
            descricao: qrCode.cupom.descricao,
            codigo: qrCode.cupom.codigo,
            loja: qrCode.cupom.loja.nome
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
      const { codigo } = req.body;
      
      if (!codigo) {
        return res.status(400).json({
          success: false,
          error: 'Código do QR code é obrigatório'
        });
      }

      // Buscar loja do usuário em paralelo com o QR code
      const [usuario, qrCode] = await Promise.all([
        prisma.usuario.findUnique({
          where: { id: req.user.id }, // Usa índice em id
          include: { loja: true }
        }),
        prisma.qrCodeUsado.findUnique({
          where: { codigo }, // Usa índice único em codigo
          include: {
            cupom: { 
              include: { 
                loja: true 
              } 
            },
            cliente: {
              select: { id: true, nome: true, email: true }
            }
          }
        })
      ]);

      const lojaId = usuario?.loja?.id;
      if (!lojaId) {
        return res.status(400).json({
          success: false,
          error: 'Lojista não possui uma loja associada'
        });
      }

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR Code inválido ou não encontrado',
          valido: false
        });
      }

      // VERIFICAÇÕES
      if (qrCode.cupom.lojaId !== lojaId) {
        return res.status(403).json({
          success: false,
          error: 'Este QR code não pertence à sua loja',
          valido: false
        });
      }

      if (new Date() > qrCode.cupom.dataExpiracao) {
        return res.status(400).json({
          success: false,
          error: 'Cupom expirado',
          valido: false
        });
      }

      if (!qrCode.cupom.loja.payment) {
        return res.status(400).json({
          success: false,
          error: 'Loja com pagamento pendente',
          valido: false
        });
      }

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

      // ✅ VALIDAÇÃO EM TRANSAÇÃO
      const resultado = await prisma.$transaction(async (prisma) => {
        // 1. Marcar QR code como validado
        const qrCodeAtualizado = await prisma.qrCodeUsado.update({
          where: { id: qrCode.id },
          data: {
            validado: true,
            validadoEm: new Date()
          }
        });

        // 2. Incrementar contador de QR codes usados no cupom
        await prisma.cupom.update({
          where: { id: qrCode.cupom.id },
          data: {
            qrCodesUsados: {
              increment: 1
            }
          }
        });

        return qrCodeAtualizado;
      });

      res.json({
        success: true,
        message: 'QR Code validado com sucesso!',
        valido: true,
        data: {
          codigo: resultado.codigo,
          usadoEm: resultado.usadoEm,
          validadoEm: resultado.validadoEm,
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
    console.log('🔍 listarResgatesLoja - Iniciando');
    console.log('👤 Usuário:', req.user);
    
    const usuarioId = req.user.id;
    console.log('🔍 Usuário ID:', usuarioId);

    // Buscar a loja do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { loja: true }
    });

    console.log('🔍 Usuário encontrado:', usuario ? 'sim' : 'não');
    
    if (!usuario?.loja) {
      console.log('❌ Lojista não possui loja associada');
      return res.status(400).json({
        success: false,
        error: 'Lojista não possui uma loja associada'
      });
    }

    const lojaId = usuario.loja.id;
    console.log('🏪 Loja ID:', lojaId);

    // Buscar todos os resgates dos cupons da loja
    console.log('🔍 Buscando resgates...');
    const resgates = await prisma.resgate.findMany({
      where: {
        cupom: {
          lojaId: lojaId
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            whatsapp: true
          }
        },
        cupom: {
          select: {
            id: true,
            codigo: true,
            descricao: true,
            logo: true
          }
        }
        // 🔥 REMOVA O BLOCO qrCodes COMPLETAMENTE
      },
      orderBy: {
        resgatadoEm: 'desc'
      }
    });

    console.log(`✅ Encontrados ${resgates.length} resgates`);

    // Formatar os dados para o frontend
    const resgatesFormatados = resgates.map(resgate => ({
      id: resgate.id,
      clienteId: resgate.cliente.id,
      clienteNome: resgate.cliente.nome,
      clienteEmail: resgate.cliente.email,
      clienteWhatsapp: resgate.cliente.whatsapp,
      cupomId: resgate.cupom.id,
      cupomCodigo: resgate.cupom.codigo,
      cupomDescricao: resgate.cupom.descricao,
      cupomLogo: resgate.cupom.logo,
      quantidade: resgate.quantidade,
      resgatadoEm: resgate.resgatadoEm,
      // 🔥 TEMPORARIAMENTE SEM DADOS DE QR CODE
      qrCodeId: null,
      qrCodeValidado: false,
      qrCodeValidadoEm: null
    }));

    res.json({
      success: true,
      data: resgatesFormatados
    });

  } catch (err) {
    console.error('❌ Erro detalhado:', err);
    console.error('❌ Stack:', err.stack);
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
    console.log('🔍 listarQrCodesLoja - Iniciando');
    
    const usuarioId = req.user.id;

    // Buscar a loja do usuário
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

    // Buscar todos os QR codes dos cupons da loja
    const qrCodes = await prisma.qrCodeUsado.findMany({
      where: {
        cupom: {
          lojaId: lojaId
        }
      },
      include: {
        cupom: {
          select: {
            id: true,
            codigo: true,
            descricao: true,
            logo: true
          }
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        usadoEm: 'desc'
      }
    });

    console.log(`✅ Encontrados ${qrCodes.length} QR codes`);

    // Formatar os dados
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
        email: qr.cliente.email
      } : null
    }));

    res.json({
      success: true,
      data: qrCodesFormatados
    });

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