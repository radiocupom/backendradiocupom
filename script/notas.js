const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, "..", "files", "candidatos.pdf");
const outputPdfPath = path.join(__dirname, "..", "files", "candidatos_filtrados.pdf");

// Verificar se o arquivo PDF existe
if (!fs.existsSync(pdfPath)) {
  console.error(`ERRO: Arquivo não encontrado: ${pdfPath}`);
  process.exit(1);
}

console.log("Arquivo PDF encontrado. Processando...");
console.log("Caminho do arquivo:", pdfPath);

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  console.log("PDF processado com sucesso!");
  console.log("Número de páginas:", data.numpages);

  const text = data.text;
  const lines = text.split("\n");

  const candidatos = [];

  // Pular as primeiras linhas vazias
  let inicio = 0;
  while (inicio < lines.length && lines[inicio].trim() === "") {
    inicio++;
  }

  // A linha de cabeçalho (pular também)
  inicio++;

  // Processar cada linha a partir do início
  for (let i = inicio; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Extrair inscrição (10 dígitos no início)
    const inscricaoMatch = line.match(/^(\d{10})/);
    if (!inscricaoMatch) continue;

    const inscricao = inscricaoMatch[1];
    
    // Extrair nota (no final da linha)
    const notaMatch = line.match(/(\d{1,2},\d{2}|FALTOU)$/);
    if (!notaMatch) continue;

    const notaRaw = notaMatch[1];
    
    // Extrair nome (tudo entre a inscrição e a nota)
    const nomeInicio = inscricao.length;
    const nomeFim = line.length - notaRaw.length;
    const nome = line.substring(nomeInicio, nomeFim).trim();

    if (notaRaw.toUpperCase() === "FALTOU") continue;

    const nota = parseFloat(notaRaw.replace(",", "."));

    if (nota > 32) {
      candidatos.push({ inscricao, nome, nota });
    }
  }

  console.log(`Total de candidatos encontrados com nota > 32: ${candidatos.length}`);

  if (candidatos.length === 0) {
    console.log("Nenhum candidato com nota > 32 encontrado.");
    return;
  }

  // Ordena do maior para o menor
  candidatos.sort((a, b) => b.nota - a.nota);

  // Cria PDF - garantir que o stream seja fechado corretamente
  const doc = new PDFDocument({ 
    margin: 50, 
    size: "A4",
    autoFirstPage: true 
  });
  
  // Criar stream de escrita
  const writeStream = fs.createWriteStream(outputPdfPath);
  
  // Pipe do PDF para o stream
  doc.pipe(writeStream);

  // Título
  doc.fontSize(18).text("Candidatos com Nota > 32", { align: "center" });
  doc.moveDown(2);

  // Cabeçalho da tabela
  doc.fontSize(12).font("Helvetica-Bold");
  
  let yPos = doc.y;
  const rowHeight = 25;
  const col1 = 50;  // POSIÇÃO
  const col2 = 100; // INSCRIÇÃO
  const col3 = 200; // NOME
  const col4 = 450; // NOTA

  // Desenhar cabeçalho
  doc.text("POSIÇÃO", col1, yPos);
  doc.text("INSCRIÇÃO", col2, yPos);
  doc.text("NOME", col3, yPos);
  doc.text("NOTA", col4, yPos);
  
  // Linha abaixo do cabeçalho
  doc.moveTo(col1 - 5, yPos + 15)
     .lineTo(550, yPos + 15)
     .stroke();

  doc.font("Helvetica");
  yPos += rowHeight;

  // Adiciona linhas da tabela
  candidatos.forEach((candidato, index) => {
    // Verificar se precisa de nova página
    if (yPos > doc.page.height - 70) {
      doc.addPage();
      yPos = 50;
      
      // Redesenhar cabeçalho na nova página
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("POSIÇÃO", col1, yPos);
      doc.text("INSCRIÇÃO", col2, yPos);
      doc.text("NOME", col3, yPos);
      doc.text("NOTA", col4, yPos);
      doc.moveTo(col1 - 5, yPos + 15)
         .lineTo(550, yPos + 15)
         .stroke();
      doc.font("Helvetica");
      yPos += rowHeight;
    }

    doc.text(String(index + 1), col1, yPos);
    doc.text(candidato.inscricao, col2, yPos);
    doc.text(candidato.nome, col3, yPos, { width: 240 });
    doc.text(candidato.nota.toFixed(2).replace('.', ','), col4, yPos);
    
    yPos += rowHeight;
  });

  // Finalizar o PDF
  doc.end();

  // Aguardar o stream terminar de escrever
  writeStream.on('finish', () => {
    console.log(`PDF gerado com sucesso: ${outputPdfPath}`);
    console.log(`Total de candidatos com nota > 32: ${candidatos.length}`);
    
    // Verificar se o arquivo foi criado e tem tamanho > 0
    const stats = fs.statSync(outputPdfPath);
    console.log(`Tamanho do arquivo: ${stats.size} bytes`);
  });

  writeStream.on('error', (err) => {
    console.error("Erro ao escrever o PDF:", err);
  });

}).catch(error => {
  console.error("Erro ao processar o PDF:", error);
});