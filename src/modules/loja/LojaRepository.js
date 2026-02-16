const prisma = require("../../database/prismaClient.cjs");

class LojaRepository {
  create(data) {
    return prisma.loja.create({ data });
  }

  findAll() {
    return prisma.loja.findMany();
  }

  findById(id) {
    return prisma.loja.findUnique({ where: { id } });
  }

  findByEmail(email) {
    return prisma.loja.findUnique({ where: { email } });
  }

 update(id, data) {
  return prisma.loja.update({ 
    where: { id }, 
    data 
  });
}

  delete(id) {
    return prisma.loja.delete({ where: { id } });
  }
}

module.exports = LojaRepository;