const { logger } = require('@mapatur/logger');

// ============================================================================
// TRANSFORM - Transformação e limpeza de dados
// ============================================================================

/**
 * Transforma e limpa dados extraídos
 * - Remove duplicatas
 * - Padroniza para UPPER CASE
 * - Remove espaços extras
 * - Valida campos obrigatórios
 */
function transformData(records) {
  logger.info('Starting data transformation', {
    input_records: records.length,
  });
  
  const uniqueRecords = new Map();
  let skipped = 0;
  
  for (const record of records) {
    try {
      // Validar campos obrigatórios
      if (!record.id_origem || !record.nome_medico || !record.nome_unidade || !record.nome_especialidade) {
        skipped++;
        continue;
      }

      // Verificar se já existe (usar o id_origem como chave única)
      if (uniqueRecords.has(record.id_origem)) {
        continue;
      }

      // Transformar campos
      const transformed = {
        id_origem: record.id_origem,
        nome_medico_bruto: cleanString(record.nome_medico),
        nome_unidade_bruto: cleanString(record.nome_unidade),
        nome_especialidade_bruto: cleanString(record.nome_especialidade),
      };

      uniqueRecords.set(record.id_origem, transformed);
      
    } catch (error) {
      logger.warn('Failed to transform record', {
        record,
        error: error.message,
      });
      skipped++;
    }
  }
  
  const transformedArray = Array.from(uniqueRecords.values());
  
  logger.info('Data transformation completed', {
    input_records: records.length,
    output_records: transformedArray.length,
    skipped,
    duplicates_removed: records.length - transformedArray.length - skipped,
  });
  
  return transformedArray;
}

/**
 * Limpa e padroniza string
 */
function cleanString(str) {
  if (!str) return null;
  
  return str
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' '); // Remove múltiplos espaços
}

/**
 * Extrai lista única de especialidades
 */
function extractUniqueEspecialidades(records) {
  const especialidades = new Set();
  
  for (const record of records) {
    if (record.nome_especialidade_bruto) {
      especialidades.add(record.nome_especialidade_bruto);
    }
  }
  
  return Array.from(especialidades).sort();
}

/**
 * Extrai lista única de médicos
 */
function extractUniqueMedicos(records) {
  const medicos = new Map();
  
  for (const record of records) {
    if (record.nome_medico_bruto) {
      medicos.set(record.id_origem, record.nome_medico_bruto);
    }
  }
  
  return Array.from(medicos.entries()).map(([id, nome]) => ({
    id_origem: id,
    nome: nome,
  }));
}

/**
 * Extrai lista única de unidades
 */
function extractUniqueUnidades(records) {
  const unidades = new Map();

  for (const record of records) {
    if (record.nome_unidade_bruto && record.id_origem) {
      unidades.set(record.id_origem, record.nome_unidade_bruto);
    }
  }

  return Array.from(unidades.entries()).map(([id, nome]) => ({
    id_origem: id,
    nome: nome,
  }));
}

module.exports = {
  transformData,
  cleanString,
  extractUniqueEspecialidades,
  extractUniqueMedicos,
  extractUniqueUnidades,
};
