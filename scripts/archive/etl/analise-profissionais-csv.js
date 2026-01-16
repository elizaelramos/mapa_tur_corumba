const path = require('path');
const fs = require('fs');

console.log('\n=== Análise do CSV de Profissionais ===\n');

const csvPath = path.join(__dirname, '../uploads/processed/profissionais_parsed_clean.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n').slice(1); // Pula header

const cpfMap = new Map();
const cnesSet = new Set();
let totalLines = 0;

for (const line of lines) {
  if (!line.trim()) continue;
  
  const parts = line.split(',');
  if (parts.length >= 6) {
    const cnes = parts[0];
    const cpf = parts[2];
    const nome = parts[4];
    
    totalLines++;
    cnesSet.add(cnes);
    
    if (!cpfMap.has(cpf)) {
      cpfMap.set(cpf, []);
    }
    cpfMap.get(cpf).push({ cnes, nome });
  }
}

console.log(`📊 Total de registros: ${totalLines}`);
console.log(`📊 CPFs únicos: ${cpfMap.size}`);
console.log(`📊 CPFs duplicados: ${Array.from(cpfMap.values()).filter(v => v.length > 1).length}`);
console.log(`📊 CNES únicos: ${cnesSet.size}\n`);

// Mostrar exemplos de duplicados
console.log('=== CPFs Duplicados (exemplos) ===\n');
let count = 0;
for (const [cpf, registros] of cpfMap.entries()) {
  if (registros.length > 1 && count < 5) {
    console.log(`CPF: ${cpf} (${registros.length} registros)`);
    registros.forEach(r => {
      console.log(`   - ${r.nome} @ CNES ${r.cnes}`);
    });
    console.log('');
    count++;
  }
}

console.log('\n=== Estratégia Recomendada ===\n');
console.log('1. Importar UNIDADES primeiro (50 CNES do unidades_cnes_final.csv)');
console.log('2. Importar PROFISSIONAIS com deduplicação por CPF');
console.log('   - Usar ON DUPLICATE KEY UPDATE para lidar com CPFs repetidos');
console.log('   - Um médico pode ter múltiplos vínculos (Junction table)');
console.log('3. Criar VÍNCULOS para cada combinação profissional-unidade\n');
