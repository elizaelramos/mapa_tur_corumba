# SIGLS - Arquitetura do Sistema

## 📐 Visão Geral

O SIGLS é um sistema Full-Stack construído como monorepo, dividido em três aplicações principais e três pacotes compartilhados.

```
sigls-monorepo/
├── apps/
│   ├── api/              # Backend REST API (Express)
│   ├── etl-worker/       # Worker ETL (Node.js)
│   └── web/              # Frontend (React + Vite)
└── packages/
    ├── database/         # Prisma Schema & Client
    ├── logger/           # Sistema de Logs (Winston)
    └── shared/           # Tipos e Validadores compartilhados
```

## 🏗️ Componentes Principais

### 1. Backend API (`apps/api`)

**Stack:**
- Node.js + Express
- Prisma ORM
- JWT para autenticação
- bcryptjs para hash de senhas
- Helmet para segurança

**Estrutura:**
```
api/
├── src/
│   ├── index.js                 # Entry point
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT + RBAC
│   │   └── error.middleware.js  # Error handling
│   └── routes/
│       ├── auth.routes.js       # Login, validação
│       ├── user.routes.js       # CRUD usuários (Superadmin)
│       ├── staging.routes.js    # Gerenciamento staging
│       ├── unidade.routes.js    # CRUD unidades
│       ├── medico.routes.js     # CRUD médicos
│       ├── especialidade.routes.js
│       ├── audit.routes.js      # Logs auditoria (Superadmin)
│       └── etl.routes.js        # Monitoramento ETL (Superadmin)
```

**Rotas Principais:**

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `/api/auth/login` | POST | - | Login |
| `/api/users` | GET/POST | Superadmin | Gerenciar usuários |
| `/api/staging` | GET | Admin | Listar staging |
| `/api/staging/:id/enrich` | PUT | Admin | Enriquecer registro |
| `/api/staging/:id/validate` | POST | Admin | Validar e promover |
| `/api/unidades` | GET | Público | Listar unidades |
| `/api/unidades` | POST/PUT/DELETE | Admin | CRUD unidades |
| `/api/audit` | GET | Superadmin | Logs de auditoria |
| `/api/etl/executions` | GET | Superadmin | Execuções ETL |

### 2. ETL Worker (`apps/etl-worker`)

**Stack:**
- Node.js
- node-cron (agendamento)
- mysql2 (conexão fonte)
- Prisma (conexão destino)

**Pipeline ETL:**

```
┌─────────────┐
│   EXTRACT   │  Extrai dados da Base da Saúde (fonte)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  TRANSFORM  │  Limpa, padroniza (UPPER), remove duplicatas
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    LOAD     │  Carrega em STAGING_Info_Origem (UPSERT)
└─────────────┘
```

**Fases:**

1. **Extract** (`extract.js`):
   - Conecta na Base da Saúde (MySQL remoto)
   - Executa query SQL configurável
   - Suporta streaming para grandes volumes

2. **Transform** (`transform.js`):
   - Remove duplicatas (baseado em `id_origem`)
   - Padroniza para UPPER CASE
   - Valida campos obrigatórios
   - Normaliza `id_origem`

3. **Load** (`load.js`):
   - UPSERT em `STAGING_Info_Origem`
   - Bulk insert com transações
   - Status inicial: 'pendente'

**Agendamento:**
- Configurável via cron expression
- Padrão: Diariamente às 2h da manhã
- Registra execução em `ETL_Execution`

### 3. Frontend Web (`apps/web`)

**Stack:**
- React 18
- Redux Toolkit + RTK Query
- Ant Design (UI)
- React Leaflet (Mapas)
- React Hook Form
- Vite (Build tool)

**Estrutura:**
```
web/
├── src/
│   ├── App.jsx                  # Rotas principais
│   ├── store/
│   │   ├── index.js             # Redux store
│   │   └── slices/
│   │       ├── authSlice.js     # Estado de autenticação
│   │       └── apiSlice.js      # RTK Query endpoints
│   ├── layouts/
│   │   ├── PublicLayout.jsx     # Layout público (mapa)
│   │   └── AdminLayout.jsx      # Layout admin (sidebar)
│   └── pages/
│       ├── LoginPage.jsx
│       ├── MapPage.jsx          # Mapa público
│       └── admin/
│           ├── DashboardPage.jsx
│           ├── StagingPage.jsx  # Validação e enriquecimento
│           ├── UnidadesPage.jsx
│           ├── UsersPage.jsx    # Superadmin only
│           ├── AuditPage.jsx    # Superadmin only
│           └── ETLPage.jsx      # Superadmin only
```

**Rotas:**

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Mapa de unidades de saúde |
| `/login` | Público | Login admin |
| `/admin/dashboard` | Admin | Dashboard |
| `/admin/staging` | Admin | Gerenciar staging |
| `/admin/unidades` | Admin | CRUD unidades |
| `/admin/users` | Superadmin | Gerenciar usuários |
| `/admin/audit` | Superadmin | Logs de auditoria |
| `/admin/etl` | Superadmin | Monitorar ETL |

## 🗄️ Modelagem de Dados

### Tabelas de Staging

**`STAGING_Info_Origem`**
- Dados brutos da fonte
- Status: pendente → validado/erro/ignorado
- Campos de enriquecimento manual (lat/lng, nome familiar)
- Link para produção (`id_prod_link`)

### Tabelas de Produção

**`PROD_Unidade_Saude`**
- Dados limpos e validados
- Latitude/Longitude obrigatórios
- Relação N:N com Especialidades

**`PROD_Medico`**
- Dados de médicos
- Relação N:N com Especialidades

**`PROD_Especialidade`**
- Lista mestra de especialidades
- Nome único (UPPER CASE)

### Tabelas de Junção (N:N)

- `Junction_Unidade_Especialidade`
- `Junction_Medico_Especialidade`

### Sistema de Usuários

**`User`**
- Autenticação e autorização
- Roles: `admin`, `superadmin`
- Password hash (bcryptjs)

### Auditoria

**`AUDIT_LOG`**
- Registro imutável de mudanças
- Capturado via triggers MySQL
- Campos: tabela, operação, valor_antigo, valor_novo, user_id

**`ETL_Execution`**
- Histórico de execuções ETL
- Status, contadores, timestamps

## 🔐 Segurança e RBAC

### Controle de Acesso

**Admin:**
- CRUD em dados validados (Unidades, Médicos, Especialidades)
- Validação e enriquecimento de staging
- Visualização de dashboard

**Superadmin:**
- Todas as permissões de Admin
- Gerenciamento de usuários (criar, editar, deletar)
- Acesso total aos logs de auditoria
- Monitoramento e controle do ETL

### Implementação

1. **JWT Token:**
   - Payload: `{ userId, username, role }`
   - Expira em 24h (configurável)
   - Armazenado no localStorage (frontend)

2. **Middleware de Autenticação:**
   - Valida token em todas as rotas protegidas
   - Adiciona `req.user` com dados do usuário

3. **Middleware de Autorização:**
   - `requireAdmin()` - Admin ou Superadmin
   - `requireSuperadmin()` - Apenas Superadmin

## 📊 Sistema de Logs

### Logs de Aplicação (Winston)

**Formato:** JSON estruturado

**Campos:**
- `timestamp`
- `level` (error, warn, info, debug)
- `message`
- `user_id`
- `role`
- `correlation_id`
- Metadados adicionais

**Arquivos:**
- `app-YYYY-MM-DD.log` - Todos os logs
- `error-YYYY-MM-DD.log` - Apenas erros
- Rotação diária
- Retenção: 14 dias (app), 30 dias (error)

### Audit Trail (MySQL Triggers)

**Triggers automáticos em:**
- `PROD_Unidade_Saude`
- `PROD_Medico`
- `PROD_Especialidade`

**Operações capturadas:**
- INSERT, UPDATE, DELETE

**Dados registrados:**
- Estado anterior (JSON)
- Estado novo (JSON)
- Timestamp
- User ID (quando disponível)

## 🗺️ Sistema de Mapas (GIS)

### Configuração de Corumbá

**Bounding Box:**
- SouthWest: [-22.0, -60.5]
- NorthEast: [-16.0, -56.0]

**Centro:**
- Latitude: -19.008
- Longitude: -57.651

**Restrições:**
- `maxBounds` com `maxBoundsViscosity: 1.0`
- Impede navegação fora de Corumbá

### Markers

- Cada unidade de saúde = 1 marker
- Popup com:
  - Nome da unidade
  - Endereço
  - Lista de especialidades

## 🔄 Fluxo de Dados

### 1. Extração (ETL Worker)

```
Base da Saúde (MySQL) 
    → Extract 
    → Transform 
    → STAGING_Info_Origem (status: pendente)
```

### 2. Validação Humana (Admin)

```
STAGING_Info_Origem 
    → Admin enriquece (lat/lng, nome familiar)
    → Admin valida
    → PROD_Unidade_Saude
    → STAGING_Info_Origem (status: validado, id_prod_link)
```

### 3. Visualização Pública

```
PROD_Unidade_Saude 
    → API GET /api/unidades
    → Frontend (MapPage)
    → React Leaflet (Mapa)
```

## 🚀 Deployment

### Backend (API + Worker)

**Opções:**
- VPS (Ubuntu/Debian)
- Docker containers
- Cloud (AWS, Azure, GCP)

**Requisitos:**
- Node.js 18+
- MySQL 8+
- PM2 ou systemd para gerenciamento de processos

### Frontend

**Build:**
```bash
npm run build:web
```

**Deploy:**
- Netlify
- Vercel
- Nginx (servir arquivos estáticos)

### Banco de Dados

**Produção:**
- MySQL 8+ com SSL
- Backups automáticos diários
- Connection pooling configurado
- Usuários com permissões mínimas

## 📈 Escalabilidade

### Horizontal

- API: Múltiplas instâncias atrás de load balancer
- Worker: Instância única (cron) ou múltiplas com lock distribuído
- Frontend: CDN para assets estáticos

### Vertical

- Database: Índices otimizados, query optimization
- API: Connection pooling, caching (Redis)
- Worker: Batch processing, streaming

## 🔧 Manutenção

### Monitoramento

- Logs centralizados (Winston)
- Audit trail completo
- Dashboard ETL (execuções, falhas)
- Health checks (`/health`)

### Backups

- Banco de dados: Diário
- Logs: Retenção configurável
- Código: Git + CI/CD

## 📚 Tecnologias Utilizadas

### Backend
- Node.js 18+
- Express 4
- Prisma ORM 5
- MySQL 8+
- JWT + bcryptjs
- Winston (logging)
- Helmet (security)

### Frontend
- React 18
- Redux Toolkit
- Ant Design 5
- React Leaflet
- Vite 5

### DevOps
- npm workspaces (monorepo)
- Prisma migrations
- Environment variables
- Git
