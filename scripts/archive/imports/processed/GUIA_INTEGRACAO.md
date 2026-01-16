# Guia de Integração - Dados CNES

## 📦 Arquivos Disponíveis

### Dados Processados
- `uploads/processed/unidades_cnes_final.csv` - 50 unidades com endereço, telefone e WhatsApp
- `uploads/processed/profissionais_parsed_clean.csv` - 1.111 profissionais validados (CPF, CNS, CBO)
- `uploads/processed/unidades_cnes_with_whatsapp.md` - Markdown legível com todas as informações

### Scripts de Import
- `scripts/generate_unidades_final_csv.py` - Gera CSV final mesclando endereços e WhatsApp
- `scripts/import_unidades_safe.sql` - Import seguro de unidades (upsert por CNES)
- `scripts/import_profissionais_safe.sql` - Import seguro de profissionais e vínculos

## 🚀 Passo a Passo de Integração

### 1. Gerar CSV Final de Unidades

```powershell
# Na raiz do projeto
python scripts/generate_unidades_final_csv.py
```

**Resultado:** `uploads/processed/unidades_cnes_final.csv` com 50 unidades completas.

### 2. Backup do Banco de Dados

```bash
# PostgreSQL
pg_dump -h localhost -U postgres -d mapa_saude > backup_mapa_saude_$(date +%Y%m%d_%H%M).sql

# Ou específico para as tabelas
pg_dump -h localhost -U postgres -d mapa_saude -t Unidade -t Medico -t UnidadeMedico > backup_tables_$(date +%Y%m%d).sql
```

### 3. Ajustar Caminhos nos Scripts SQL

Edite os scripts SQL e ajuste o caminho do CSV:

**Em `scripts/import_unidades_safe.sql` (linha 22):**
```sql
\copy unidades_import_tmp FROM 'C:/dev/Mapa_Saude_Corumba/uploads/processed/unidades_cnes_final.csv' CSV HEADER ENCODING 'UTF8';
```

**Em `scripts/import_profissionais_safe.sql` (linha 22):**
```sql
\copy profissionais_import_tmp FROM 'C:/dev/Mapa_Saude_Corumba/uploads/processed/profissionais_parsed_clean.csv' CSV HEADER ENCODING 'UTF8';
```

### 4. Testar em Ambiente de Desenvolvimento/Staging

```bash
# Conectar ao banco de dev/staging
psql -h localhost -U postgres -d mapa_saude_dev -f scripts/import_unidades_safe.sql

# Revisar os outputs das validações
# O script termina com ROLLBACK por segurança
```

**Verifique:**
- ✅ Número de unidades importadas
- ✅ Sem CNES duplicados
- ✅ Campos preenchidos corretamente
- ✅ Amostras aleatórias para conferência

### 5. Aplicar Import de Unidades em Produção

```bash
# 1. Executar o script (ainda com ROLLBACK)
psql -h <host_producao> -U <user> -d mapa_saude -f scripts/import_unidades_safe.sql

# 2. Se tudo estiver OK, edite o script:
#    Comente a linha: ROLLBACK;
#    Descomente a linha: -- COMMIT;

# 3. Execute novamente para confirmar
psql -h <host_producao> -U <user> -d mapa_saude -f scripts/import_unidades_safe.sql
```

### 6. Aplicar Import de Profissionais

```bash
# Mesmo processo do passo 5
psql -h <host_producao> -U <user> -d mapa_saude -f scripts/import_profissionais_safe.sql

# Revisar → Editar ROLLBACK/COMMIT → Executar novamente
```

## 🔍 Queries de Validação Manual

### Verificar Unidades Atualizadas

```sql
-- Ver unidades que receberam endereço/whatsapp
SELECT cnes, nome, endereco, whatsapp 
FROM "Unidade" 
WHERE endereco IS NOT NULL AND endereco != ''
ORDER BY cnes
LIMIT 20;
```

### Verificar Vínculos Profissional-Unidade

```sql
-- Listar profissionais por unidade
SELECT 
  u.cnes,
  u.nome AS unidade,
  COUNT(um."medicoId") AS total_profissionais
FROM "Unidade" u
LEFT JOIN "UnidadeMedico" um ON um."unidadeId" = u.id AND um.ativo = true
GROUP BY u.id, u.cnes, u.nome
ORDER BY total_profissionais DESC
LIMIT 20;
```

### Ver Profissionais de uma Unidade Específica

```sql
-- Exemplo: CNES 0148636
SELECT 
  m.nome AS profissional,
  m.cpf,
  m.cbo,
  um.ativo
FROM "UnidadeMedico" um
JOIN "Medico" m ON m.id = um."medicoId"
JOIN "Unidade" u ON u.id = um."unidadeId"
WHERE u.cnes = '0148636'
ORDER BY m.nome;
```

## ⚠️ Comportamento dos Scripts

### Import de Unidades (`import_unidades_safe.sql`)

| Campo | Comportamento |
|-------|---------------|
| `cnes` | Chave de upsert (PK) |
| `nome` | **NÃO atualiza** (preserva customizações) |
| `endereco` | Atualiza **apenas se vazio** no DB |
| `telefone` | Atualiza **apenas se vazio** no DB |
| `whatsapp` | Atualiza **apenas se vazio** no DB |

### Import de Profissionais (`import_profissionais_safe.sql`)

| Campo | Comportamento |
|-------|---------------|
| `cpf` | Chave de upsert (PK) |
| `nome` | **NÃO atualiza** (preserva correções manuais) |
| `cns` | Atualiza **apenas se vazio** no DB |
| `cbo` | Atualiza **apenas se vazio** no DB |

**Vínculos:** Cria automaticamente, evita duplicatas com `ON CONFLICT DO NOTHING`.

## 🎯 Checklist de Execução

- [ ] Backup completo do banco de dados
- [ ] Gerar CSV final com `generate_unidades_final_csv.py`
- [ ] Ajustar caminhos absolutos nos scripts SQL
- [ ] Testar em ambiente de dev/staging
- [ ] Validar amostras de dados importados
- [ ] Revisar outputs das validações (contadores, duplicatas)
- [ ] Aplicar em produção com ROLLBACK primeiro
- [ ] Confirmar resultados e trocar para COMMIT
- [ ] Validar no frontend que dados aparecem corretamente
- [ ] Documentar data/hora do import para referência

## 📊 Estatísticas Esperadas

- **Unidades:** 50 (46 pré-existentes + 4 novas)
- **Profissionais:** 1.111 registros válidos
- **Vínculos:** ~1.111 (alguns profissionais podem atuar em múltiplas unidades)
- **WhatsApp:** ~14 unidades com número preenchido

## 🆘 Troubleshooting

### Erro: "relation Unidade does not exist"
- Verifique o nome exato da tabela no seu schema (pode ser `unidades` minúsculo)
- Ajuste os scripts SQL conforme sua convenção de nomes

### Erro: "column cnes does not exist"
- Verifique os nomes das colunas no seu schema
- Ajuste os scripts conforme necessário

### CNES não encontrados no sistema
- Execute primeiro o import de unidades
- Ou ajuste o CSV de profissionais para remover CNES inexistentes

### Vínculos duplicados
- O script já trata isso com `ON CONFLICT DO NOTHING`
- Se persistir, revise a constraint da junction table

## 📞 Suporte

Se encontrar problemas:
1. Revise os outputs das validações nos scripts
2. Execute queries de diagnóstico acima
3. Verifique logs do PostgreSQL
4. Confira nomes de tabelas/colunas no schema atual
