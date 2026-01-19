const XLSX = require('xlsx');

const filePath = 'C:\\dev\\mapa_turismo_corumba\\Mapas_Turismo_Corumba_Pontos.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Converte para JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  console.log('=== INFORMAÇÕES DA PLANILHA ===');
  console.log(`Nome da aba: ${sheetName}`);
  console.log(`Total de registros: ${data.length}`);
  console.log('\n=== COLUNAS ENCONTRADAS ===');
  if (data.length > 0) {
    console.log(Object.keys(data[0]).join(', '));
  }
  console.log('\n=== PRIMEIROS 3 REGISTROS ===');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
  console.log('\n=== TODOS OS DADOS (JSON) ===');
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Erro ao ler arquivo:', error.message);
  process.exit(1);
}
