// ClienteRepository.js
const prisma = require("../../database/prismaClient.cjs");

class ClienteRepository {
  constructor() {
    this.prisma = prisma;
  }

  // ================= LOG =================
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [ClienteRepository] ${message}`, data);
  }

  // ================= CRIAÇÃO =================
  create(data) {
    this.log('log', 'create', { data });
    return this.prisma.cliente.create({ data });
  }

  // ================= BUSCAS =================
  findById(id) {
    this.log('log', 'findById', { id });
    return this.prisma.cliente.findUnique({
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
        ultimoLogin: true,
        _count: {
          select: {
            resgates: true,
            qrCodesUsados: true
          }
        }
      }
    });
  }

  findByEmail(email) {
    this.log('log', 'findByEmail', { email });
    return this.prisma.cliente.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        ativo: true,
        createdAt: true
      }
    });
  }

  findByEmailWithPassword(email) {
    this.log('log', 'findByEmailWithPassword', { email });
    return this.prisma.cliente.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        whatsapp: true,
        ativo: true,
        cidade: true,
        estado: true
      }
    });
  }

  async findAll(skip = 0, take = 20, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
    this.log('log', 'findAll', { skip, take, filters, sortBy, sortOrder });

    const where = this.buildWhereClause(filters);

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [clientes, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          nome: true,
          email: true,
          whatsapp: true,
          cidade: true,
          estado: true,
          ativo: true,
          createdAt: true,
          ultimoLogin: true,
          _count: {
            select: {
              resgates: true
            }
          }
        }
      }),
      this.prisma.cliente.count({ where })
    ]);

    return { clientes, total };
  }

  buildWhereClause(filters) {
    const where = {};

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { whatsapp: { contains: filters.search } }
      ];
    }

    if (filters.cidade) {
      where.cidade = { contains: filters.cidade, mode: 'insensitive' };
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters.dataInicio || filters.dataFim) {
      where.createdAt = {};
      if (filters.dataInicio) {
        where.createdAt.gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        where.createdAt.lte = new Date(filters.dataFim);
      }
    }

    return where;
  }

  // ================= RESGATES =================
  async findResgatesByCliente(clienteId, skip = 0, take = 10) {
    this.log('log', 'findResgatesByCliente', { clienteId, skip, take });

    const where = { clienteId };

    const [resgates, total] = await Promise.all([
      this.prisma.resgate.findMany({
        where,
        skip,
        take,
        orderBy: { resgatadoEm: 'desc' },
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
              logo: true,
              loja: {
                select: {
                  id: true,
                  nome: true,
                  logo: true
                }
              }
            }
          }
        }
      }),
      this.prisma.resgate.count({ where })
    ]);

    return { resgates, total };
  }

  // ================= QR CODES =================
  async findQrCodesByCliente(clienteId, skip = 0, take = 20, status = null) {
    this.log('log', 'findQrCodesByCliente', { clienteId, skip, take, status });

    const where = { clienteId };
    
    if (status === 'validado') {
      where.validado = true;
    } else if (status === 'pendente') {
      where.validado = false;
    }

    const [qrCodes, total] = await Promise.all([
      this.prisma.qrCodeUsado.findMany({
        where,
        skip,
        take,
        orderBy: { usadoEm: 'desc' },
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
              logo: true,
              loja: {
                select: {
                  id: true,
                  nome: true,
                  logo: true
                }
              }
            }
          },
          resgate: {
            select: {
              id: true,
              resgatadoEm: true
            }
          }
        }
      }),
      this.prisma.qrCodeUsado.count({ where })
    ]);

    return { qrCodes, total };
  }

  async findQrCodeById(clienteId, qrCodeId) {
    this.log('log', 'findQrCodeById', { clienteId, qrCodeId });

    return this.prisma.qrCodeUsado.findFirst({
      where: {
        id: qrCodeId,
        clienteId
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
            logo: true,
            loja: {
              select: {
                id: true,
                nome: true,
                logo: true
              }
            }
          }
        },
        resgate: {
          select: {
            id: true,
            resgatadoEm: true
          }
        }
      }
    });
  }

  async findQrCodesPorResgate(lojaId, clienteId, resgateId) {
    this.log('log', 'findQrCodesPorResgate', { lojaId, clienteId, resgateId });

    // Primeiro verificar se o resgate existe e pertence à loja/cliente
    const resgateWhere = {
      id: resgateId,
      clienteId
    };

    if (lojaId) {
      resgateWhere.cupom = { lojaId };
    }

    const resgate = await this.prisma.resgate.findFirst({
      where: resgateWhere,
      select: { id: true }
    });

    if (!resgate) {
      this.log('log', 'findQrCodesPorResgate - Resgate não encontrado');
      return [];
    }

    // Buscar QR codes do resgate
    const qrCodes = await this.prisma.qrCodeUsado.findMany({
      where: {
        resgateId
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

    return qrCodes;
  }

  // ================= CLIENTES POR LOJA =================
 // No ClienteRepository.js - método findClientesByLoja
async findClientesByLoja(lojaId, skip = 0, take = 20, filters = {}, sortBy = 'ultimoResgate', sortOrder = 'desc') {
  this.log('log', 'findClientesByLoja', { lojaId, skip, take, filters, sortBy, sortOrder });

  // Construir where clause
  const where = {
    resgates: {
      some: {
        cupom: { lojaId }
      }
    }
  };

  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { whatsapp: { contains: filters.search } }
    ];
  }

  if (filters.dataInicio || filters.dataFim) {
    where.resgates = {
      some: {
        cupom: { lojaId },
        resgatadoEm: {}
      }
    };
    if (filters.dataInicio) {
      where.resgates.some.resgatadoEm.gte = new Date(filters.dataInicio);
    }
    if (filters.dataFim) {
      where.resgates.some.resgatadoEm.lte = new Date(filters.dataFim);
    }
  }

  // Buscar clientes
  const clientes = await this.prisma.cliente.findMany({
    where,
    skip,
    take,
    select: {
      id: true,
      nome: true,
      email: true,
      whatsapp: true,
      cidade: true,
      estado: true,
      dataNascimento: true,
      genero: true,
      createdAt: true,
      ultimoLogin: true,
      resgates: {
        where: {
          cupom: { lojaId }
        },
        orderBy: { resgatadoEm: 'desc' },
        take: 1,
        select: {
          id: true,
          resgatadoEm: true,
          cupom: {
            select: {
              id: true,
              codigo: true,
              descricao: true
            }
          }
        }
      },
      _count: {
        select: {
          resgates: {
            where: {
              cupom: { lojaId }
            }
          },
          qrCodesUsados: {
            where: {
              cupom: { lojaId }
            }
          }
        }
      }
    }
  });

  // Contar total
  const total = await this.prisma.cliente.count({ where });

  // Enriquecer com dados adicionais
  const clientesEnriquecidos = await Promise.all(
    clientes.map(async (cliente) => {
      // 🔥 BUSCAR APENAS QR CODES VALIDADOS para calcular o totalGasto
      const qrCodesValidados = await this.prisma.qrCodeUsado.findMany({
        where: {
          clienteId: cliente.id,
          cupom: { lojaId },
          validado: true
        },
        select: {
          cupom: {
            select: {
              precoComDesconto: true
            }
          }
        }
      });

      // 🔥 Calcular totalGasto baseado APENAS em QR codes validados
      const totalGasto = qrCodesValidados.reduce((acc, qr) => {
        return acc + (qr.cupom?.precoComDesconto || 0);
      }, 0);

      // Buscar total de QR codes validados (apenas para o contador)
      const qrCodesValidadosCount = qrCodesValidados.length;

      // Buscar total de QR codes (todos)
      const totalQrCodes = await this.prisma.qrCodeUsado.count({
        where: {
          clienteId: cliente.id,
          cupom: { lojaId }
        }
      });

      // Buscar economia total (opcional, se precisar)
      const qrCodesEconomia = await this.prisma.qrCodeUsado.findMany({
        where: {
          clienteId: cliente.id,
          cupom: { lojaId },
          validado: true
        },
        select: {
          cupom: {
            select: {
              precoOriginal: true,
              precoComDesconto: true
            }
          }
        }
      });

      const totalEconomizado = qrCodesEconomia.reduce((acc, qr) => {
        const original = qr.cupom?.precoOriginal || 0;
        const desconto = qr.cupom?.precoComDesconto || 0;
        return acc + (original - desconto);
      }, 0);

      return {
        ...cliente,
        estatisticas: {
          totalResgates: cliente._count.resgates,
          totalQrCodes,
          qrCodesValidados: qrCodesValidadosCount,
          totalGasto, // 🔥 AGORA É BASEADO APENAS EM QR CODES VALIDADOS
          totalEconomizado
        }
      };
    })
  );

  // Ordenar
  if (sortBy === 'ultimoResgate') {
    clientesEnriquecidos.sort((a, b) => {
      const aDate = a.resgates[0]?.resgatadoEm || new Date(0);
      const bDate = b.resgates[0]?.resgatadoEm || new Date(0);
      return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
    });
  } else if (sortBy === 'totalResgates') {
    clientesEnriquecidos.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.estatisticas.totalResgates - a.estatisticas.totalResgates
        : a.estatisticas.totalResgates - b.estatisticas.totalResgates;
    });
  } else if (sortBy === 'totalGasto') {
    clientesEnriquecidos.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.estatisticas.totalGasto - a.estatisticas.totalGasto
        : a.estatisticas.totalGasto - b.estatisticas.totalGasto;
    });
  }

  return { clientes: clientesEnriquecidos, total };
}

  async findClienteByLoja(lojaId, clienteId) {
    this.log('log', 'findClienteByLoja', { lojaId, clienteId });

    return this.prisma.cliente.findFirst({
      where: {
        id: clienteId,
        resgates: {
          some: {
            cupom: { lojaId }
          }
        }
      },
      include: {
        resgates: {
          where: { cupom: { lojaId } },
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
                logo: true
              }
            },
            qrCodes: {
              select: {
                id: true,
                codigo: true,
                usadoEm: true,
                validado: true,
                validadoEm: true
              }
            }
          },
          orderBy: { resgatadoEm: 'desc' }
        },
        _count: {
          select: {
            resgates: {
              where: {
                cupom: { lojaId }
              }
            },
            qrCodesUsados: {
              where: {
                cupom: { lojaId }
              }
            }
          }
        }
      }
    });
  }

  async findResgatesClienteByLoja(lojaId, clienteId, skip = 0, take = 10) {
    this.log('log', 'findResgatesClienteByLoja', { lojaId, clienteId, skip, take });

    const where = {
      clienteId,
      cupom: { lojaId }
    };

    const [resgates, total] = await Promise.all([
      this.prisma.resgate.findMany({
        where,
        skip,
        take,
        orderBy: { resgatadoEm: 'desc' },
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
              logo: true
            }
          },
          qrCodes: {
            select: {
              id: true,
              codigo: true,
              usadoEm: true,
              validado: true,
              validadoEm: true
            }
          }
        }
      }),
      this.prisma.resgate.count({ where })
    ]);

    return { resgates, total };
  }

  async findQrCodesClienteByLoja(lojaId, clienteId, skip = 0, take = 20, status = null) {
    this.log('log', 'findQrCodesClienteByLoja', { lojaId, clienteId, skip, take, status });

    const where = {
      clienteId,
      cupom: { lojaId }
    };

    if (status === 'validado') {
      where.validado = true;
    } else if (status === 'pendente') {
      where.validado = false;
    }

    const [qrCodes, total] = await Promise.all([
      this.prisma.qrCodeUsado.findMany({
        where,
        skip,
        take,
        orderBy: { usadoEm: 'desc' },
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
              logo: true
            }
          },
          resgate: {
            select: {
              id: true,
              resgatadoEm: true
            }
          }
        }
      }),
      this.prisma.qrCodeUsado.count({ where })
    ]);

    return { qrCodes, total };
  }

  // ================= QR CODES POR LOJA =================
  async findQrCodesPorLoja(lojaId, skip = 0, take = 20, filters = {}) {
    this.log('log', 'findQrCodesPorLoja', { lojaId, skip, take, filters });

    const where = {
      cupom: { lojaId }
    };

    if (filters.status === 'validado') {
      where.validado = true;
    } else if (filters.status === 'pendente') {
      where.validado = false;
    }

    if (filters.search) {
      where.OR = [
        { codigo: { contains: filters.search } },
        { cliente: { nome: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    if (filters.dataInicio || filters.dataFim) {
      where.usadoEm = {};
      if (filters.dataInicio) {
        where.usadoEm.gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        where.usadoEm.lte = new Date(filters.dataFim);
      }
    }

    const [qrCodes, total] = await Promise.all([
      this.prisma.qrCodeUsado.findMany({
        where,
        skip,
        take,
        orderBy: { usadoEm: 'desc' },
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
              descricao: true
            }
          },
          resgate: {
            select: {
              id: true,
              resgatadoEm: true
            }
          }
        }
      }),
      this.prisma.qrCodeUsado.count({ where })
    ]);

    return { qrCodes, total };
  }

  // ================= RESGATES POR LOJA =================
 async findResgatesPorLoja(lojaId, skip = 0, take = 20, filters = {}) {
  this.log('log', 'findResgatesPorLoja', { lojaId, skip, take, filters });

  const where = {
    cupom: { lojaId }
  };

  if (filters.dataInicio || filters.dataFim) {
    where.resgatadoEm = {};
    if (filters.dataInicio) where.resgatadoEm.gte = new Date(filters.dataInicio);
    if (filters.dataFim) where.resgatadoEm.lte = new Date(filters.dataFim);
  }

  const [resgates, total] = await Promise.all([
    this.prisma.resgate.findMany({
      where,
      skip,
      take,
      orderBy: { resgatadoEm: 'desc' },
      include: {
        // 🔥 CLIENTE COM TODOS OS CAMPOS DO MODEL
        cliente: {
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
        },
        cupom: {
          select: {
            id: true,
            codigo: true,
            descricao: true,
            precoOriginal: true,
            precoComDesconto: true,
            percentualDesconto: true,
            nomeProduto: true,
            logo: true
          }
        },
        qrCodes: {
          select: {
            id: true,
            codigo: true,
            usadoEm: true,
            validado: true,
            validadoEm: true
          }
        }
      }
    }),
    this.prisma.resgate.count({ where })
  ]);

  return { resgates, total };
}

  // ================= ESTATÍSTICAS =================
  findEstatisticas(id) {
    return this.prisma.cliente.findUnique({
      where: { id },
      include: {
        resgates: {
          include: {
            cupom: {
              select: {
                id: true,
                codigo: true,
                precoOriginal: true,
                precoComDesconto: true
              }
            }
          }
        }
      }
    });
  }

  // ================= CONTAGENS =================
  countClientes() {
    return this.prisma.cliente.count();
  }

  countClientesAtivos() {
    return this.prisma.cliente.count({
      where: { ativo: true }
    });
  }

  countClientesNovosMes() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.prisma.cliente.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });
  }

  countTotalResgates() {
    return this.prisma.resgate.count();
  }

  countResgatesMes() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.prisma.resgate.count({
      where: {
        resgatadoEm: {
          gte: startOfMonth
        }
      }
    });
  }

  countTotalQrCodes() {
    return this.prisma.qrCodeUsado.count();
  }

  countQrCodesValidados() {
    return this.prisma.qrCodeUsado.count({
      where: { validado: true }
    });
  }

  countResgatesByCliente(clienteId) {
    return this.prisma.resgate.count({
      where: { clienteId }
    });
  }

  async sumEconomiaClientes() {
    const resgates = await this.prisma.resgate.findMany({
      select: {
        cupom: {
          select: {
            precoOriginal: true,
            precoComDesconto: true
          }
        }
      }
    });

    return resgates.reduce((acc, r) => {
      const original = r.cupom?.precoOriginal || 0;
      const desconto = r.cupom?.precoComDesconto || 0;
      return acc + (original - desconto);
    }, 0);
  }

  // ================= TOP CLIENTES =================
  async getTopClientes(limit = 5) {
    const clientes = await this.prisma.cliente.findMany({
      take: limit,
      orderBy: {
        resgates: {
          _count: 'desc'
        }
      },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        _count: {
          select: {
            resgates: true
          }
        }
      }
    });

    return clientes.map(c => ({
      id: c.id,
      nome: c.nome,
      email: c.email,
      whatsapp: c.whatsapp,
      totalResgates: c._count.resgates
    }));
  }

  // ================= CONTAGENS POR LOJA =================
  countClientesByLoja(lojaId) {
    return this.prisma.cliente.count({
      where: {
        resgates: {
          some: {
            cupom: { lojaId }
          }
        }
      }
    });
  }

  countResgatesByLoja(lojaId) {
    return this.prisma.resgate.count({
      where: {
        cupom: { lojaId }
      }
    });
  }

  countResgatesMesByLoja(lojaId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.prisma.resgate.count({
      where: {
        cupom: { lojaId },
        resgatadoEm: {
          gte: startOfMonth
        }
      }
    });
  }

  countQrCodesByLoja(lojaId) {
    return this.prisma.qrCodeUsado.count({
      where: {
        cupom: { lojaId }
      }
    });
  }

  countQrCodesValidadosByLoja(lojaId) {
    return this.prisma.qrCodeUsado.count({
      where: {
        cupom: { lojaId },
        validado: true
      }
    });
  }

  async sumEconomiaByLoja(lojaId) {
    const resgates = await this.prisma.resgate.findMany({
      where: {
        cupom: { lojaId }
      },
      select: {
        cupom: {
          select: {
            precoOriginal: true,
            precoComDesconto: true
          }
        }
      }
    });

    return resgates.reduce((acc, r) => {
      const original = r.cupom?.precoOriginal || 0;
      const desconto = r.cupom?.precoComDesconto || 0;
      return acc + (original - desconto);
    }, 0);
  }

  async getTopClientesByLoja(lojaId, limit = 5) {
    // Esta é uma consulta mais complexa, faremos em duas etapas
    const clientes = await this.prisma.cliente.findMany({
      where: {
        resgates: {
          some: {
            cupom: { lojaId }
          }
        }
      },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        _count: {
          select: {
            resgates: {
              where: {
                cupom: { lojaId }
              }
            }
          }
        }
      }
    });

    // Ordenar por total de resgates e pegar os top
    return clientes
      .sort((a, b) => b._count.resgates - a._count.resgates)
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        nome: c.nome,
        email: c.email,
        whatsapp: c.whatsapp,
        totalResgates: c._count.resgates
      }));
  }

  // ================= PERMISSÕES =================
  async verificarPermissaoLoja(userId, lojaId) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { loja: true }
    });
    
    return usuario?.loja?.id === lojaId;
  }

  // ================= ATUALIZAÇÃO =================
  update(id, data) {
    this.log('log', 'update', { id, data });
    return this.prisma.cliente.update({
      where: { id },
      data,
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
        updatedAt: true
      }
    });
  }

  // ================= EXCLUSÃO =================
  delete(id) {
    this.log('log', 'delete', { id });
    return this.prisma.cliente.delete({ where: { id } });
  }
}

module.exports = ClienteRepository;