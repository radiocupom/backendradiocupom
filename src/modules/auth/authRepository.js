// src/modules/auth/authRepository.js
const prisma = require('../../database/prismaClient.cjs');

const findUserByEmail = (email) => prisma.usuario.findUnique({ where: { email } });

module.exports = {
  findUserByEmail
};