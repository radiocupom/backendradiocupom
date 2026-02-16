const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// Importação correta para pdf-parse 2.4.5
const pdfModule = require('pdf-parse');
const PDFParse = pdfModule.PDFParse;

// Criar uma instância do parser
const pdfParser = new PDFParse();

const pdfPath = path.join(__dirname, "..", "files", "candidatos.pdf");
const outputPdfPath = path.join(__dirname, "..", "files", "candidatos_filtrados.pdf");

// Verificar se o arquivo PDF existe
if (!fs.existsSync(pdfPath)) {
  console.error(`ERRO: Arquivo não encontrado: ${pdfPath}`);
  console.error("Certifique-se de que o arquivo candidatos.pdf está na pasta files");
  process.exit(1);
}

console.log("Arquivo PDF encontrado. Processando...");
console.log("Caminho do arquivo:", pdfPath);

const dataBuffer = fs.readFileSync(pdfPath);

// Usar o parser para extrair o texto - NOTA: é parseBuffer, não pdf(dataBuffer)
pdfParser.parseBuffer(dataBuffer).then((data) => {
  console.log("PDF processado com sucesso!");
  console.log("Número de páginas:", data.numpages);
  console.log("Número de caracteres:", data.text.length);

  const text = data.text;
  const lines = text.split("\n");

  const candidatos = [];

  // Extrai e filtra candidatos com nota > 32
  lines.forEach((line) => {
    if (!line.trim() || line.startsWith("INSCRIÇÃO")) return;

    // Ajuste a regex conforme o formato real do seu PDF
    const match = line.match(/^(\d+)\s+(.+?)\s+(\d+,\d+|FALTOU)$/);

    if (match) {
      const inscricao = match[1];
      const nome = match[2].trim();
      const notaRaw = match[3];

      if (notaRaw.toUpperCase() === "FALTOU") return;

      const nota = parseFloat(notaRaw.replace(",", "."));

      if (nota > 32) {
        candidatos.push({ inscricao, nome, nota });
      }
    }
  });

  console.log(`Total de candidatos encontrados: ${candidatos.length}`);

  if (candidatos.length === 0) {
    console.log("Nenhum candidato com nota > 32 encontrado.");
    console.log("Primeiras 20 linhas do arquivo para debug:");
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`${i + 1}: ${line}`);
    });
    return;
  }

  // Ordena do maior para o menor
  candidatos.sort((a, b) => b.nota - a.nota);

  // Cria PDF
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(fs.createWriteStream(outputPdfPath));

  // Título
  doc.fontSize(18).text("Candidatos com Nota > 32", { align: "center" });
  doc.moveDown(1);

  // Cabeçalho da tabela
  doc.fontSize(12).font("Helvetica-Bold");
  const tableTop = doc.y;
  const rowHeight = 20;

  doc.text("POSIÇÃO", 30, tableTop);
  doc.text("INSCRIÇÃO", 80, tableTop);
  doc.text("NOME", 180, tableTop);
  doc.text("NOTA OBJETIVA", 480, tableTop);

  doc.moveDown(0.5);
  doc.font("Helvetica");

  // Adiciona linhas da tabela
  candidatos.forEach((candidato, index) => {
    const y = tableTop + rowHeight * (index + 1);
    doc.text(String(index + 1), 30, y);
    doc.text(candidato.inscricao, 80, y);
    doc.text(candidato.nome, 180, y, { width: 280 });
    doc.text(candidato.nota.toFixed(2).replace('.', ','), 480, y);
  });

  doc.end();

  console.log(`PDF gerado com sucesso: ${outputPdfPath}`);
  console.log(`Total de candidatos com nota > 32: ${candidatos.length}`);
}).catch(error => {
  console.error("Erro ao processar o PDF:", error);
});