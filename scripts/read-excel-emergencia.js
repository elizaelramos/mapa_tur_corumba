const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'Mapas_Tur_2026_01_26_PontosdeEmergencia_Preenchido.xlsx');

console.log('Lendo planilha:', excelPath);

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];

console.log('Abas disponíveis:', workbook.SheetNames);
console.log('Usando a aba:', sheetName);

const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

console.log('\n=== ESTRUTURA DA PLANILHA ===');
console.log('Total de linhas:', data.length);

if (data.length > 0) {
  console.log('\nColunas encontradas:');
  Object.keys(data[0]).forEach(col => {
    console.log(`  - ${col}`);
  });

  console.log('\n=== TODAS AS LINHAS DE EXEMPLO ===');
  data.forEach((row, idx) => {
    console.log(`\nLinha ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  });
}
