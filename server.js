// server.js
const app = require("./app");
console.log('✅ JWT_SECRET:', process.env.JWT_SECRET ? 'Definido' : '❌ NÃO DEFINIDO');
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'Definido' : '❌ NÃO DEFINIDO');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
