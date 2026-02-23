-- ============================================================================
-- RESTAURAR REFERÊNCIAS: icone_id com base no mapeamento
-- Data: 2026-02-10
-- Fonte: dump-mapa_tur-icone x unidades.sql (linha 323+)
-- ============================================================================

-- Atualizar icone_id para cada unidade baseado no mapeamento original
UPDATE prod_unidade_turistica SET icone_id = 6 WHERE id IN (63,64,65,66,67,68,69,70,72,73,74,75,76,77,78,79,80,82,84,89,90,91,92,147,180,181,319,320,321,322,323,324,325);
UPDATE prod_unidade_turistica SET icone_id = 16 WHERE id IN (71,143,149,150,151,153,154);
UPDATE prod_unidade_turistica SET icone_id = 11 WHERE id IN (94,95,96,98,100,101,103,104,105,106,107,109,110,111,112,113,232,234,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,303,304,306,326,327,328,329,339);
UPDATE prod_unidade_turistica SET icone_id = 8 WHERE id IN (114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,139,140,141,142,182,311,315,318);
UPDATE prod_unidade_turistica SET icone_id = 14 WHERE id IN (160,161,162,163,184,186,187,188,189,190,191,192,193,194,296,297,298,299,300,301,302);
UPDATE prod_unidade_turistica SET icone_id = 7 WHERE id IN (164,165,166,168,169,170,171,172,173,174,175,176,177,178,179,305,307,312,314);
UPDATE prod_unidade_turistica SET icone_id = 12 WHERE id IN (167,231,233);
UPDATE prod_unidade_turistica SET icone_id = 17 WHERE id IN (195,224,225,226);
UPDATE prod_unidade_turistica SET icone_id = 15 WHERE id IN (218,219,220,221,222,223,227,228,229,230);
UPDATE prod_unidade_turistica SET icone_id = 21 WHERE id IN (235,236,237,238,239,240,241,242,243,244,245,246,247,249,250,251,254);
UPDATE prod_unidade_turistica SET icone_id = 18 WHERE id IN (330,331,332,333,334,335,336,337,338);

-- Unidades que devem permanecer com icone_id NULL (sem ícone definido):
-- UT_ID: 87, 102, 148, 155, 159

-- Verificar resultados
SELECT
  'TOTAL' as tipo,
  COUNT(*) as quantidade
FROM prod_unidade_turistica
UNION ALL
SELECT
  'COM ICONE_ID' as tipo,
  COUNT(*) as quantidade
FROM prod_unidade_turistica
WHERE icone_id IS NOT NULL
UNION ALL
SELECT
  'SEM ICONE_ID' as tipo,
  COUNT(*) as quantidade
FROM prod_unidade_turistica
WHERE icone_id IS NULL
UNION ALL
SELECT
  'SINCRONIZADOS (ID + URL)' as tipo,
  COUNT(*) as quantidade
FROM prod_unidade_turistica ut
INNER JOIN prod_icone ic ON ut.icone_id = ic.id
WHERE ut.icone_url = ic.url;
