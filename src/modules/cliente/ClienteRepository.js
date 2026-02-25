const prisma = require("../../database/prismaClient.cjs");

class ClienteRepository {
  create(data) {
    return prisma.cliente.create({ data });
  }

  findAll() {
    return prisma.cliente.findMany();
  }

  findById(id) {
    return prisma.cliente.findUnique({ where: { id } });
  }

  findByEmail(email) {
    return prisma.cliente.findUnique({ where: { email } });
  }

  update(id, data) {
    return prisma.cliente.update({ where: { id }, data });
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

  // 🔥 ADICIONAR VALIDAÇÃO PARA CADA RESGATE (IGUAL AO findClienteByLoja)
  const resgatesComValidacao = await Promise.all(
    cliente.resgates.map(async (resgate) => {
      const qrCodeUsado = await prisma.qrCodeUsado.findFirst({
        where: {
          clienteId: resgate.clienteId,
          cupomId: resgate.cupomId,
          usadoEm: {
            gte: new Date(new Date(resgate.resgatadoEm).getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(new Date(resgate.resgatadoEm).getTime() + 24 * 60 * 60 * 1000)
          }
        },
        select: {
          validado: true,
          validadoEm: true
        }
      });

      return {
        ...resgate,
        qrCodeValidado: qrCodeUsado?.validado || false,
        qrCodeValidadoEm: qrCodeUsado?.validadoEm || null
      };
    })
  );

  // Substitui os resgates originais pelos com validação
  cliente.resgates = resgatesComValidacao;

  return cliente;
}

  findResgatesByCliente(id) {
    return prisma.cliente.findUnique({
      where: { id },
      include: {
        resgates: {
          include: {
            cupom: {
              include: {
                loja: {
                  select: { nome: true, logo: true }
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
    // Primeiro busca o cliente com os resgates
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

    // 🔥 BUSCAR VALIDAÇÃO PARA CADA RESGATE
    const resgatesComValidacao = await Promise.all(
      cliente.resgates.map(async (resgate) => {
        // Busca na tabela QrCodeUsado se existe validação
        const qrCodeUsado = await prisma.qrCodeUsado.findFirst({
          where: {
            clienteId: resgate.clienteId,
            cupomId: resgate.cupomId,
            usadoEm: {
              gte: new Date(new Date(resgate.resgatadoEm).getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(new Date(resgate.resgatadoEm).getTime() + 24 * 60 * 60 * 1000)
            }
          },
          select: {
            validado: true,
            validadoEm: true
          }
        });

        return {
          ...resgate,
          qrCodeValidado: qrCodeUsado?.validado || false,
          qrCodeValidadoEm: qrCodeUsado?.validadoEm || null
        };
      })
    );

    // Substitui os resgates originais pelos com validação
    cliente.resgates = resgatesComValidacao;

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

    // 🔥 Para cada cliente, adicionar informações de validação aos resgates
    const clientesComValidacao = await Promise.all(
      clientes.map(async (cliente) => {
        const resgatesComValidacao = await Promise.all(
          cliente.resgates.map(async (resgate) => {
            const qrCodeUsado = await prisma.qrCodeUsado.findFirst({
              where: {
                clienteId: cliente.id,
                cupomId: resgate.cupomId,
                usadoEm: {
                  gte: new Date(new Date(resgate.resgatadoEm).getTime() - 24 * 60 * 60 * 1000),
                  lte: new Date(new Date(resgate.resgatadoEm).getTime() + 24 * 60 * 60 * 1000)
                }
              },
              select: {
                validado: true,
                validadoEm: true
              }
            });

            return {
              ...resgate,
              qrCodeValidado: qrCodeUsado?.validado || false,
              qrCodeValidadoEm: qrCodeUsado?.validadoEm || null
            };
          })
        );

        return {
          ...cliente,
          resgates: resgatesComValidacao
        };
      })
    );

    return clientesComValidacao;
  }
}

module.exports = ClienteRepository;