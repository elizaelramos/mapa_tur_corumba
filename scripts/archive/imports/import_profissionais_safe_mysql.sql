-- ============================================================================
-- Script de Import Seguro de Profissionais e Vínculos com Unidades - MySQL
-- ============================================================================
-- Vincula profissionais às unidades por CNES, preserva dados existentes
-- Banco: MySQL
-- Execução: mysql -u root -p mapa_saude < scripts/import_profissionais_safe_mysql.sql
-- ============================================================================

START TRANSACTION;

-- Criar tabela temporária
CREATE TEMPORARY TABLE profissionais_import_tmp (
  cpf VARCHAR(14),
  cns VARCHAR(15),
  nome VARCHAR(255),
  cbo VARCHAR(10),
  cnes_unidade VARCHAR(10)
);

-- IMPORTANTE: Ajuste o caminho absoluto do CSV antes de executar
-- NOTA: Requer local_infile=1 em my.ini/my.cnf ou SET GLOBAL local_infile=1;
LOAD DATA LOCAL INFILE 'C:/dev/Mapa_Saude_Corumba/uploads/processed/profissionais_parsed_clean.csv'
INTO TABLE profissionais_import_tmp
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(cpf, cns, nome, cbo, cnes_unidade);

-- ============================================================================
-- VALIDAÇÕES PRÉ-IMPORT
-- ============================================================================

SELECT '=== VALIDAÇÕES DE PROFISSIONAIS ===' AS info;

SELECT CONCAT('Total de profissionais a importar: ', COUNT(*)) AS status 
FROM profissionais_import_tmp;

SELECT CONCAT('CPFs duplicados no CSV: ', COUNT(*)) AS status
FROM (
  SELECT cpf
  FROM profissionais_import_tmp 
  GROUP BY cpf 
  HAVING COUNT(*) > 1
) d;

SELECT CONCAT('Profissionais que já existem no sistema: ', COUNT(*)) AS status
FROM profissionais_import_tmp i 
WHERE EXISTS (SELECT 1 FROM PROD_Medico m WHERE m.cpf = i.cpf);

SELECT CONCAT('Profissionais novos a serem inseridos: ', COUNT(*)) AS status
FROM profissionais_import_tmp i 
WHERE NOT EXISTS (SELECT 1 FROM PROD_Medico m WHERE m.cpf = i.cpf);

SELECT '=== VALIDAÇÃO DE VÍNCULOS ===' AS info;

SELECT CONCAT('CNES únicos no import: ', COUNT(DISTINCT cnes_unidade)) AS status 
FROM profissionais_import_tmp;

SELECT CONCAT('CNES que NÃO existem no sistema (vínculos não serão criados): ', COUNT(DISTINCT cnes_unidade)) AS status
FROM profissionais_import_tmp i
WHERE NOT EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes_unidade);

SELECT '=== CNES não encontrados (se houver) ===' AS info;
SELECT DISTINCT cnes_unidade AS cnes_sem_unidade
FROM profissionais_import_tmp p
WHERE NOT EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = p.cnes_unidade)
LIMIT 10;

SELECT '=== Amostra de profissionais (5 primeiros) ===' AS info;
SELECT cpf, LEFT(nome, 40) AS nome, cbo, cnes_unidade 
FROM profissionais_import_tmp 
LIMIT 5;

SELECT '=== EXECUTANDO UPSERT DE PROFISSIONAIS ===' AS info;

-- ============================================================================
-- UPSERT DE PROFISSIONAIS (MySQL Pattern)
-- ============================================================================
-- Estratégia:
-- 1. Atualiza profissionais existentes (por CPF)
-- 2. Insere novos profissionais (CPF que não existem)
-- - Atualiza apenas CNS/CBO se estiverem vazios
-- - NÃO atualiza nome para preservar correções manuais
-- ============================================================================

-- PASSO 1: Atualizar profissionais existentes
UPDATE PROD_Medico m
INNER JOIN profissionais_import_tmp tmp ON m.cpf = tmp.cpf
SET 
  m.cns = CASE 
    WHEN m.cns IS NULL OR m.cns = '' THEN tmp.cns 
    ELSE m.cns 
  END,
  m.cbo = CASE 
    WHEN m.cbo IS NULL OR m.cbo = '' THEN tmp.cbo 
    ELSE m.cbo 
  END,
  m.updated_at = NOW()
  -- NOTA: 'nome' NÃO é atualizado para preservar correções manuais;

-- PASSO 2: Inserir novos profissionais
INSERT INTO PROD_Medico (cpf, cns, nome, cbo, created_at, updated_at)
SELECT 
  tmp.cpf,
  tmp.cns,
  tmp.nome,
  tmp.cbo,
  NOW(),
  NOW()
FROM profissionais_import_tmp tmp
WHERE NOT EXISTS (
  SELECT 1 FROM PROD_Medico m WHERE m.cpf = tmp.cpf
);

SELECT '=== CRIANDO VÍNCULOS MEDICO-UNIDADE ===' AS info;

-- ============================================================================
-- CRIAR VÍNCULOS (Junction Table) - MySQL Pattern
-- ============================================================================
-- Cria vínculos apenas se:
-- - O profissional existe (foi inserido/atualizado acima)
-- - A unidade existe (tem CNES cadastrado em id_origem)
-- - O vínculo ainda NÃO existe (evita duplicação)
-- ============================================================================

INSERT INTO Junction_Unidade_Medico (id_unidade, id_medico, created_at, updated_at)
SELECT DISTINCT 
  u.id AS id_unidade,
  m.id AS id_medico,
  NOW(),
  NOW()
FROM profissionais_import_tmp tmp
INNER JOIN PROD_Medico m ON m.cpf = tmp.cpf
INNER JOIN PROD_Unidade_Saude u ON u.id_origem = tmp.cnes_unidade
WHERE NOT EXISTS (
  SELECT 1 
  FROM Junction_Unidade_Medico j 
  WHERE j.id_unidade = u.id AND j.id_medico = m.id
);

-- ============================================================================
-- VALIDAÇÕES PÓS-IMPORT
-- ============================================================================

SELECT '=== VALIDAÇÕES PÓS-IMPORT ===' AS info;

SELECT CONCAT('Total de profissionais no banco: ', COUNT(*)) AS resultado 
FROM PROD_Medico;

SELECT CONCAT('Total de vínculos criados: ', COUNT(*)) AS resultado 
FROM Junction_Unidade_Medico;

SELECT CONCAT('Profissionais SEM vínculo: ', COUNT(*)) AS resultado
FROM PROD_Medico m
WHERE NOT EXISTS (SELECT 1 FROM Junction_Unidade_Medico j WHERE j.id_medico = m.id);

SELECT '=== Unidades com mais profissionais vinculados (top 5) ===' AS info;
SELECT 
  u.nome AS unidade,
  u.id_origem AS cnes,
  COUNT(j.id_medico) AS total_profissionais
FROM PROD_Unidade_Saude u
LEFT JOIN Junction_Unidade_Medico j ON j.id_unidade = u.id
GROUP BY u.id, u.nome, u.id_origem
ORDER BY total_profissionais DESC
LIMIT 5;

SELECT '=== Amostra de profissionais importados (5 aleatórios) ===' AS info;
SELECT 
  m.cpf,
  m.nome,
  m.cbo,
  COUNT(j.id_unidade) AS unidades_vinculadas
FROM PROD_Medico m
LEFT JOIN Junction_Unidade_Medico j ON j.id_medico = m.id
WHERE m.cpf IN (SELECT cpf FROM profissionais_import_tmp)
GROUP BY m.id, m.cpf, m.nome, m.cbo
ORDER BY RAND()
LIMIT 5;

-- ============================================================================
-- CONFIRMAÇÃO FINAL
-- ============================================================================

SELECT '=== IMPORT CONCLUÍDO COM SUCESSO ===' AS info;
SELECT 'Revise os resultados acima. Se estiver OK, execute: COMMIT;' AS proxima_acao;
SELECT 'Se houver problemas, execute: ROLLBACK;' AS alternativa;

-- NÃO EXECUTAR COMMIT AUTOMATICAMENTE - deixa para revisão manual
-- COMMIT;
