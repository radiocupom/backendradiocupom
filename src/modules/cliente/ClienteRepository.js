const prisma = require("../../database/prismaClient.cjs");

class ClienteRepository {
  create(data) {
    return prisma.cliente.create({ data });
  }

  findAll() {
    return prisma.cliente.findMany({
      select: { // 🔥 SELECT específico
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        cidade: true,
        estado: true,
        ativo: true,
        createdAt: true
      }
    });
  }

  findById(id) {
    return prisma.cliente.findUnique({ 
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        bairro: true,
        cidade: true,
        estado: true,
        pais: true,
        genero: true,
        dataNascimento: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        receberOfertas: true,
        comoConheceu: true,
        observacoes: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        ultimoLogin: true
      }
    });
  }

  // ================= NOVO MÉTODO: Buscar QR codes por resgate =================
async findQrCodesPorResgate(lojaId, clienteId, resgateId) {
  console.log(`📊 Repository.findQrCodesPorResgate: resgate ${resgateId}, cliente ${clienteId}, loja ${lojaId}`);
  
  try {
    // Primeiro verificar se o resgate existe e pertence à loja e cliente
    const resgate = await prisma.resgate.findFirst({
      where: {
        id: resgateId,
        clienteId: clienteId,
        cupom: {
          lojaId: lojaId
        }
      },
      select: {
        id: true,
        quantidade: true,
        resgatadoEm: true
      }
    });

    if (!resgate) {
      console.log('❌ Resgate não encontrado ou não pertence à loja/cliente');
      return [];
    }

    console.log('✅ Resgate encontrado:', resgate.id);

    // Buscar QR codes do resgate
    const qrCodes = await prisma.qrCodeUsado.findMany({
      where: {
        resgateId: resgateId
      },
      include: {
        cupom: {
          select: {
            id: true,
            codigo: true,
            descricao: true,
            precoOriginal: true,
            precoComDesconto: true,
            percentualDesconto: true,
            nomeProduto: true,
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
        usadoEm: 'desc'
      }
    });

    console.log(`✅ Encontrados ${qrCodes.length} QR codes para o resgate ${resgateId}`);

    // Formatar os dados para o frontend
    return qrCodes.map(qr => ({
      id: qr.id,
      codigo: qr.codigo,
      usadoEm: qr.usadoEm,
      validado: qr.validado,
      validadoEm: qr.validadoEm,
      cupomId: qr.cupomId,
      cupomCodigo: qr.cupom?.codigo,
      cupomDescricao: qr.cupom?.descricao,
      cupomLogo: qr.cupom?.loja?.logo,
      precoOriginal: qr.cupom?.precoOriginal,
      precoComDesconto: qr.cupom?.precoComDesconto,
      percentualDesconto: qr.cupom?.percentualDesconto,
      nomeProduto: qr.cupom?.nomeProduto
    }));

  } catch (error) {
    console.error('❌ Erro ao buscar QR codes por resgate:', error);
    throw new Error('Erro ao buscar QR codes do resgate');
  }
}

 findByEmail(email) {
  return prisma.cliente.findUnique({ 
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      senha: true,
      whatsapp: true,  // ← Adicione se precisar
      ativo: true,      // ← Adicione se precisar
      // ❌ role: true   ← REMOVER COMPLETAMENTE!
    }
  });
}

  update(id, data) {
    return prisma.cliente.update({ 
      where: { id }, 
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true
      }
    });
  }

  delete(id) {
    return prisma.cliente.delete({ where: { id } });
  }

  async findWithResgates(id) {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        resgates: {
          include: {
            cupom: {
              include: {
                loja: {
                  select: { 
                    id: true,
                    nome: true, 
                    logo: true 
                  }
                }
              }
            }
          },
          orderBy: { resgatadoEm: 'desc' }
        }
      }
    });

    if (!cliente) return null;

    // 🔥 OTIMIZADO: Busca validações em lote
    const clienteCupomPairs = cliente.resgates.map(r => ({
      clienteId: r.clienteId,
      cupomId: r.cupomId,
      resgatadoEm: r.resgatadoEm
    }));

    const qrCodes = await prisma.qrCodeUsado.findMany({
      where: {
        OR: clienteCupomPairs.map(pair => ({
          clienteId: pair.clienteId,
          cupomId: pair.cupomId,
          usadoEm: {
            gte: new Date(new Date(pair.resgatadoEm).getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(new Date(pair.resgatadoEm).getTime() + 24 * 60 * 60 * 1000)
          }
        }))
      },
      select: {
        clienteId: true,
        cupomId: true,
        validado: true,
        validadoEm: true
      }
    });

    const qrCodeMap = new Map();
    qrCodes.forEach(qr => {
      const key = `${qr.clienteId}-${qr.cupomId}`;
      qrCodeMap.set(key, qr);
    });

    cliente.resgates = cliente.resgates.map(resgate => {
      const key = `${resgate.clienteId}-${resgate.cupomId}`;
      const qrCode = qrCodeMap.get(key);

      return {
        ...resgate,
        qrCodeValidado: qrCode?.validado || false,
        qrCodeValidadoEm: qrCode?.validadoEm || null
      };
    });

    return cliente;
  }

  findResgatesByCliente(id) {
    return prisma.cliente.findUnique({
      where: { id },
      select: {
        resgates: {
          select: {
            id: true,
            quantidade: true,
            resgatadoEm: true,
            cupom: {
              select: {
                id: true,
                descricao: true,
                codigo: true,
                precoOriginal: true,
                precoComDesconto: true,
                loja: {
                  select: {
                    nome: true,
                    logo: true
                  }
                }
              }
            }
          },
          orderBy: { resgatadoEm: 'desc' }
        }
      }
    });
  }

  findEstatisticas(id) {
    return prisma.cliente.findUnique({
      where: { id },
      include: {
        resgates: {
          select: {
            id: true,
            quantidade: true,
            resgatadoEm: true,
            cupomId: true
          }
        }
      }
    });
  }

  async findUsuarioWithLoja(userId) {
    return prisma.usuario.findUnique({
      where: { id: userId },
      include: { loja: true }
    });
  }

  async findClienteByLoja(lojaId, clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        resgates: {
          some: {
            cupom: { lojaId: lojaId }
          }
        }
      },
      include: {
        resgates: {
          where: { cupom: { lojaId: lojaId } },
          include: { 
            cupom: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
                precoOriginal: true,
                precoComDesconto: true,
                nomeProduto: true
              }
            }
          },
          orderBy: { resgatadoEm: 'desc' }
        }
      }
    });

    if (!cliente) return null;

    // 🔥 OTIMIZADO: Busca validações em lote
    const clienteCupomPairs = cliente.resgates.map(r => ({
      clienteId: r.clienteId,
      cupomId: r.cupomId,
      resgatadoEm: r.resgatadoEm
    }));

    const qrCodes = await prisma.qrCodeUsado.findMany({
      where: {
        OR: clienteCupomPairs.map(pair => ({
          clienteId: pair.clienteId,
          cupomId: pair.cupomId,
          usadoEm: {
            gte: new Date(new Date(pair.resgatadoEm).getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(new Date(pair.resgatadoEm).getTime() + 24 * 60 * 60 * 1000)
          }
        }))
      },
      select: {
        clienteId: true,
        cupomId: true,
        validado: true,
        validadoEm: true
      }
    });

    const qrCodeMap = new Map();
    qrCodes.forEach(qr => {
      const key = `${qr.clienteId}-${qr.cupomId}`;
      qrCodeMap.set(key, qr);
    });

    cliente.resgates = cliente.resgates.map(resgate => {
      const key = `${resgate.clienteId}-${resgate.cupomId}`;
      const qrCode = qrCodeMap.get(key);

      return {
        ...resgate,
        qrCodeValidado: qrCode?.validado || false,
        qrCodeValidadoEm: qrCode?.validadoEm || null
      };
    });

    return cliente;
  }

  async verificarPermissaoLoja(userId, lojaId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { loja: true }
    });
    
    return usuario?.loja?.id === lojaId;
  }

async findClientesByLoja(lojaId) {
  console.log('📊 Repository.findClientesByLoja:', lojaId);
  
  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        resgates: {
          some: {
            cupom: { lojaId: lojaId }
          }
        }
      },
      include: {
        resgates: {
          where: { cupom: { lojaId: lojaId } },
          include: { 
            cupom: {
              select: {
                id: true,
                codigo: true,
                descricao: true
              }
            }
          },
          orderBy: { resgatadoEm: 'desc' }
        }
      }
    });

    console.log('📊 Clientes encontrados (raw):', clientes.length);
    
    // 🔥 Processar os clientes com validação
    const clientesComValidacao = clientes.map(cliente => {
      // Se precisar de alguma lógica de validação adicional
      return {
        ...cliente,
        resgates: cliente.resgates.map(resgate => ({
          ...resgate,
          // Adicione campos calculados se necessário
          valorOriginal: resgate.cupom?.precoOriginal || 0,
          valorPago: resgate.cupom?.precoComDesconto || 0
        }))
      };
    });
    
    console.log('✅ Clientes processados:', clientesComValidacao.length);
    return clientesComValidacao;
    
  } catch (error) {
    console.error('❌ Erro no repository:', error);
    throw new Error('Erro ao buscar clientes da loja');
  }
}
}

module.exports = ClienteRepository;