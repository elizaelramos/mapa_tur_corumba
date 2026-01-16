# SIGLS - Guia de Instalação e Configuração

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **MySQL** 8.0+ (para banco SIGLS - destino)
- **PostgreSQL** (acesso à Base da Saúde - fonte)
- **Git**

## 🚀 Instalação Passo a Passo

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd Mapa_Saude_Corumba
```

### 2. Instalar Dependências

```bash
npm install
```

Este comando instalará todas as dependências de todos os workspaces (packages e apps).

### 3. Configurar Variáveis de Ambiente

```bash
copy .env.example .env
```

Edite o arquivo `.env` com suas configurações:

**IMPORTANTE:** Use credenciais separadas para evitar problemas com caracteres especiais (@, :, /) nas senhas.

```env
# Database Configuration (SIGLS - Destino - MySQL)
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="sigls_db"
DB_USER="root"
DB_PASSWORD="sua_senha"

# Source Database Configuration (Base da Saúde - Fonte - PostgreSQL)
SOURCE_DB_HOST="localhost"
SOURCE_DB_PORT="5432"
SOURCE_DB_NAME="base_saude"
SOURCE_DB_USER="usuario"
SOURCE_DB_PASSWORD="senha"

# JWT Configuration
JWT_SECRET="sua-chave-secreta-muito-forte-aqui"
JWT_EXPIRES_IN="24h"

# API Configuration
API_PORT=3001
NODE_ENV="development"

# ETL Worker Configuration
ETL_SCHEDULE_CRON="0 2 * * *"
ETL_BATCH_SIZE=1000

# Frontend Configuration
VITE_API_URL="http://localhost:3001"

# Logging
LOG_LEVEL="info"
LOG_FILE_PATH="./logs/app.log"
```
### 3.1 Testar Conexão com o MySQL

```bash
npm run test:mysql
```
### 3.2 Testar Conexão com o PostgreSQL

```bash
npm run test:postgres
```
### 4. Configurar Banco de Dados

#### 4.1. Criar o Banco de Dados

```sql
CREATE DATABASE sigls_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 4.2. Gerar Cliente Prisma

```bash
npm run prisma:generate
```

#### 4.3. Setup Completo do Banco (Migrations + Triggers)

```bash
npm run setup:db
```

Este comando executa:
1. Migrations do Prisma (criação de tabelas)
2. Aplicação automática dos triggers de auditoria

Quando solicitado, dê um nome para a migration (ex: "initial").

**Ou execute separadamente:**

```bash
# Apenas migrations
npm run prisma:migrate

# Apenas triggers (após migrations)
npm run prisma:triggers
```

### 5. Criar Usuário Superadmin

```bash
npm run create:superadmin
```

Siga as instruções no terminal para criar o primeiro usuário superadmin.

### 6. Verificar Setup

```bash
node scripts/setup-database.js
```

Este script verifica se tudo está configurado corretamente.

## 🏃 Executando o Sistema

### Desenvolvimento (3 terminais)

**Terminal 1 - API:**
```bash
npm run dev:api
```

**Terminal 2 - ETL Worker:**
```bash
npm run dev:worker
```

**Terminal 3 - Frontend:**
```bash
npm run dev:web
```

### Acessar o Sistema

- **Frontend Público (Mapa):** http://localhost:5173
- **Admin Login:** http://localhost:5173/login
- **API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/health

## 🔧 Configuração do ETL

### Ajustar Query de Extração

Edite o arquivo `apps/etl-worker/src/extract.js` e ajuste a query `EXTRACTION_QUERY` conforme a estrutura da sua Base da Saúde:

```javascript
const EXTRACTION_QUERY = `
  SELECT 
    id_origem,
    nome_medico,
    nome_unidade,
    nome_especialidade
  FROM sua_view_ou_tabela
  WHERE condicoes
`;
```

### Executar ETL Manualmente (Desenvolvimento)

Para executar o ETL imediatamente ao iniciar o worker (útil para testes):

```env
# No arquivo .env
ETL_RUN_ON_START=true
```

### Ajustar Agendamento

Modifique a variável `ETL_SCHEDULE_CRON` no `.env`:

```env
# Exemplos:
ETL_SCHEDULE_CRON="0 2 * * *"      # Diariamente às 2h
ETL_SCHEDULE_CRON="0 */6 * * *"    # A cada 6 horas
ETL_SCHEDULE_CRON="0 0 * * 0"      # Semanalmente (domingo à meia-noite)
```

## 📊 Prisma Studio (Visualizar Dados)

Para abrir uma interface visual do banco de dados:

```bash
npm run prisma:studio
```

Acesse: http://localhost:5555

## 🔒 Segurança em Produção

### 1. Variáveis de Ambiente

- ✅ Nunca commite o arquivo `.env`
- ✅ Use senhas fortes para `JWT_SECRET`
- ✅ Configure `NODE_ENV=production`

### 2. Banco de Dados

- ✅ Use usuários MySQL com permissões limitadas
- ✅ Configure SSL/TLS para conexões remotas
- ✅ Faça backups regulares

### 3. API

- ✅ Configure CORS adequadamente
- ✅ Use HTTPS em produção
- ✅ Configure rate limiting

### 4. Frontend

- ✅ Configure variáveis de ambiente de produção
- ✅ Faça build otimizado: `npm run build:web`

## 🐛 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```bash
npm run prisma:generate
```

### Erro: "Connection refused" no MySQL

Verifique:
1. MySQL está rodando
2. Credenciais corretas no `.env`
3. Firewall permite conexão na porta 3306

### Erro: "JWT_SECRET is not defined"

Certifique-se de que o arquivo `.env` existe e contém `JWT_SECRET`.

### Frontend não conecta com API

Verifique:
1. API está rodando na porta correta
2. `VITE_API_URL` no `.env` está correto
3. CORS está configurado corretamente

## 📝 Logs

Os logs são salvos em:
- `./logs/app-YYYY-MM-DD.log` - Logs gerais
- `./logs/error-YYYY-MM-DD.log` - Apenas erros

## 🔄 Atualizações

### Atualizar Schema do Banco

1. Edite `packages/database/prisma/schema.prisma`
2. Execute: `npm run prisma:migrate`
3. Execute: `npm run prisma:generate`

### Atualizar Dependências

```bash
npm update
```

## 📚 Documentação Adicional

- [README.md](./README.md) - Visão geral do projeto
- [API Documentation](./docs/API.md) - Documentação da API (criar)
- [ETL Documentation](./docs/ETL.md) - Documentação do ETL (criar)

## 🆘 Suporte

Para problemas ou dúvidas, entre em contato com a equipe de desenvolvimento da Prefeitura de Corumbá.
