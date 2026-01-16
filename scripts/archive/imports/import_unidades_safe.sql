-- ============================================================================
-- Script de Import Seguro de Unidades CNES
-- ============================================================================
-- Atualiza apenas campos vazios/NULL, preserva dados existentes
-- Banco: MySQL
-- Execução: mysql -u root -p mapa_saude < scripts/import_unidades_safe.sql
-- ============================================================================

START TRANSACTION;

-- Criar tabela temporária
CREATE TEMPORARY TABLE unidades_import_tmp (
  cnes VARCHAR(10),
  nome VARCHAR(255),
  endereco VARCHAR(500),
  telefone VARCHAR(100),
  whatsapp VARCHAR(100),
  detail_url VARCHAR(500)
);

-- IMPORTANTE: Ajuste o caminho absoluto do CSV antes de executar
-- Carregar dados do CSV
LOAD DATA LOCAL INFILE 'C:/dev/Mapa_Saude_Corumba/uploads/processed/unidades_cnes_final.csv'
INTO TABLE unidades_import_tmp
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(cnes, nome, endereco, telefone, whatsapp, detail_url);

-- ============================================================================
-- VALIDAÇÕES PRÉ-IMPORT
-- ============================================================================

SELECT '=== VALIDAÇÕES ===' AS status;

SELECT CONCAT('Total de unidades a importar: ', COUNT(*)) AS status 
FROM unidades_import_tmp;

SELECT CONCAT('CNES duplicados no CSV: ', COUNT(*)) AS status 
FROM (
  SELECT cnes, COUNT(*) AS cnt
  FROM unidades_import_tmp 
  GROUP BY cnes 
  HAVING cnt > 1
) d;

SELECT CONCAT('Unidades que já existem no sistema: ', COUNT(*)) AS status
FROM unidades_import_tmp i 
WHERE EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes);

SELECT CONCAT('Unidades novas a serem inseridas: ', COUNT(*)) AS status
FROM unidades_import_tmp i 
WHERE NOT EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes);

SELECT '=== Amostra de dados a importar (5 primeiras) ===' AS status;
SELECT cnes, LEFT(nome, 40) AS nome, LEFT(endereco, 50) AS endereco, whatsapp 
FROM unidades_import_tmp 
LIMIT 5;

SELECT '=== EXECUTANDO UPSERT ===' AS status;

-- ============================================================================
-- UPSERT DE UNIDADES
-- ============================================================================
-- IMPORTANTE: Este script atualiza PROD_Unidade_Saude
-- Usa id_origem (CNES) como chave de matching
-- 
-- NOTA CRÍTICA: latitude/longitude são obrigatórios (NOT NULL no schema)
-- Unidades sem coordenadas precisam ser geocodificadas antes do import
-- Por ora, usamos coordenadas genéricas de Corumbá como fallback
-- ============================================================================

-- Atualizar unidades existentes (apenas campos vazios)
UPDATE PROD_Unidade_Saude u
INNER JOIN unidades_import_tmp i ON u.id_origem = i.cnes
SET 
  u.endereco = IF(u.endereco IS NULL OR u.endereco = '', i.endereco, u.endereco),
  u.telefone = IF(u.telefone IS NULL OR u.telefone = '', i.telefone, u.telefone),
  u.whatsapp = IF(u.whatsapp IS NULL OR u.whatsapp = '', i.whatsapp, u.whatsapp),
  u.updated_at = NOW();
  -- NOTA: 'nome' NÃO é atualizado para preservar customizações manuais

-- Inserir novas unidades (com coordenadas genéricas - REQUER GEOCODIFICAÇÃO posterior)
INSERT INTO PROD_Unidade_Saude (
  nome, endereco, telefone, whatsapp, 
  latitude, longitude, id_origem, 
  ativo, created_at, updated_at
)
SELECT 
  i.nome,
  i.endereco,
  i.telefone,
  i.whatsapp,
  -19.0078, -- Latitude genérica de Corumbá centro (TEMPORÁRIO)
  -57.6547, -- Longitude genérica de Corumbá centro (TEMPORÁRIO)
  i.cnes,
  1,
  NOW(),
  NOW()
FROM unidades_import_tmp i
WHERE NOT EXISTS (
  SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes
);

-- ============================================================================
-- VALIDAÇÕES PÓS-IMPORT
-- ============================================================================

SELECT '=== RESULTADO DO IMPORT ===' AS status;

SELECT CONCAT('Total de unidades no sistema após import: ', COUNT(*)) AS status 
FROM PROD_Unidade_Saude;

SELECT CONCAT('Unidades com endereço preenchido: ', COUNT(*)) AS status 
FROM PROD_Unidade_Saude 
WHERE endereco IS NOT NULL AND endereco != '';

SELECT CONCAT('Unidades com WhatsApp preenchido: ', COUNT(*)) AS status 
FROM PROD_Unidade_Saude 
WHERE whatsapp IS NOT NULL AND whatsapp != '';

SELECT '=== Amostra de unidades atualizadas (5 aleatórias) ===' AS status;
SELECT id_origem AS cnes, LEFT(nome, 40) AS nome, LEFT(endereco, 40) AS endereco, whatsapp 
FROM PROD_Unidade_Saude 
WHERE id_origem IN (SELECT cnes FROM unidades_import_tmp)
ORDER BY RAND()
LIMIT 5;

-- ============================================================================
-- ATENÇÃO: GEOCODIFICAÇÃO NECESSÁRIA
-- ============================================================================
SELECT '=== UNIDADES QUE PRECISAM DE GEOCODIFICAÇÃO ===' AS status;
SELECT id_origem AS cnes, nome, endereco
FROM PROD_Unidade_Saude
WHERE id_origem IN (SELECT cnes FROM unidades_import_tmp)
  AND (latitude = -19.0078 AND longitude = -57.6547)
LIMIT 10;

-- ============================================================================
-- DECISÃO FINAL
-- ============================================================================

-- Revise os resultados acima.
-- Se estiver tudo OK, descomente a linha abaixo:
-- COMMIT;

-- Mantém rollback por segurança:
ROLLBACK;
