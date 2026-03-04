// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient(); // usa a DATABASE_URL do seu ambiente

async function main() {
  const email = 'belmontprogramador@gmail.com';
  const existing = await prisma.usuario.findUnique({ where: { email } });

  if (existing) {
    console.log('Superadmin já existe:', email);
    return;
  }

  const hashedPassword = await bcrypt.hash('SuaSenhaForte123', 10);

  const superadmin = await prisma.usuario.create({
    data: {
      nome: 'Felipe Belmont',
      email,
      senha: hashedPassword,
      role: 'superadmin',
    },
  });

  console.log('Superadmin criado com sucesso:', superadmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
