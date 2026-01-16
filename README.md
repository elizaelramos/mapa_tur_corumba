# 🗺️ Mapa Turismo — Guia de Turismo de Corumbá (MS)

Sistema Full-Stack desenvolvido para a **Prefeitura de Corumbá/MS** para visualização pública em mapa e gerenciamento de pontos turísticos, atrações, serviços e eventos da cidade.

## 📖 Sobre o Projeto

O **Mapa Turismo** é uma plataforma moderna que disponibiliza informações completas sobre a oferta turística de Corumbá, facilitando o acesso da população e visitantes a dados como:

- 📍 Localização geográfica de pontos turísticos, trilhas e atrativos
- 📞 Contatos e telefones de estabelecimentos e guias
- 🏨 Informações sobre hospedagem e serviços
- 🍽️ Restaurantes e opções gastronômicas
- 🕒 Horários de funcionamento e eventos
- 🌐 Redes sociais e canais de comunicação

Este sistema moderniza o acesso às informações educacionais, promovendo transparência e facilitando a comunicação entre a comunidade escolar e a gestão municipal.

## 🏗️ Arquitetura Técnica

- **Monorepo**: Estrutura modular com npm workspaces para compartilhamento de código
- **Backend API**: Node.js + Express + JWT + RBAC (Controle de Acesso Baseado em Funções)
- **ETL Worker**: Pipeline automatizado para sincronização e validação de dados
- **Frontend**: React + Redux Toolkit + Ant Design + React Leaflet (mapas interativos)
- **Banco de Dados**: MySQL com Prisma ORM
- **Auditoria**: Sistema completo de logs e rastreamento de alterações

## 📦 Estrutura do Projeto

```
mapa_turismo_corumba/
├── apps/
│   ├── api/              # Backend API REST (Express + Node.js)
│   ├── etl-worker/       # Worker para processamento de dados
│   └── web/              # Frontend (React + Leaflet)
├── packages/
│   ├── database/         # Prisma Schema & Migrations
│   ├── shared/           # Tipos e utilitários compartilhados
│   └── logger/           # Sistema de logs estruturados
├── scripts/              # Scripts utilitários para manutenção
├── uploads/              # Arquivos enviados (ícones, imagens)
└── docs/                 # Documentação técnica
```

## 🚀 Início Rápido

### 1. Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
copy .env.example .env

# Editar .env com suas credenciais de banco de dados
```

### 2. Configuração do Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

### 3. Criar Superadmin

```bash
npm run create:superadmin
```

### 4. Executar em Desenvolvimento

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - ETL Worker
npm run dev:worker

# Terminal 3 - Frontend
npm run dev:web
```

## 🔐 Controle de Acesso (RBAC)

### Papéis

- **Admin**: CRUD em dados validados, validação e enriquecimento de staging
- **Superadmin**: Todas as permissões de Admin + gerenciamento de usuários + acesso total a logs

### Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação stateless. O token contém o `role` do usuário no payload.

## 🔄 Pipeline ETL

### Fluxo de Trabalho de Dados

1. **Extract (Extração)**: Coleta de dados das fontes oficiais
2. **Transform (Transformação)**: Limpeza, padronização e validação dos dados
3. **Load (Carregamento)**: Dados carregados na área de staging com status 'pendente'
4. **Validação Humana**: Administradores validam e enriquecem os dados (coordenadas, informações adicionais)
5. **Promoção para Produção**: Dados validados são promovidos para as tabelas de produção

### Sincronização Inteligente

- **UPSERT Automático**: Atualização incremental baseada em identificadores únicos
- **Transações Otimizadas**: Processamento em lote para alta performance
- **Agendamento Flexível**: Execução automática configurável via cron

## 🗺️ Sistema de Mapas Interativos

### Funcionalidades do Mapa

- **Visualização Interativa**: Mapa com todas as escolas municipais de Corumbá
- **Marcadores Personalizados**: Ícones diferenciados por tipo de unidade escolar
- **Popups Informativos**: Detalhes completos ao clicar em cada escola
- **Filtros Dinâmicos**: Busca e filtragem por bairro, tipo de escola, etc.
- **Responsivo**: Funciona perfeitamente em dispositivos móveis e desktops

### Configuração Geográfica (Corumbá/MS)

- **Área de Cobertura**: Município de Corumbá, Mato Grosso do Sul
- **Bounding Box** (limites do mapa):
  - Sudoeste: Lat -22.0, Lng -60.5
  - Nordeste: Lat -16.0, Lng -56.0
- **Centro Padrão**: Lat -19.008, Lng -57.651 (Centro de Corumbá)
- **Restrição de Visualização**: Mapa limitado à área de interesse com `maxBounds`

## 📊 Sistema de Auditoria e Rastreabilidade

### Audit Trail (Trilha de Auditoria)

- **Triggers Automáticos**: Capturam todas as operações (INSERT, UPDATE, DELETE) nas tabelas de produção
- **Registro Imutável**: Estado anterior e novo armazenados em formato JSON na tabela `AUDIT_LOG`
- **Metadados Completos**: Inclui user_id, role, timestamp, correlation_id para rastreamento total
- **Conformidade**: Atende requisitos de transparência e governança de dados públicos

### Logs de Aplicação

- **Formato Estruturado**: JSON com Winston para fácil análise e integração
- **Níveis Hierárquicos**: error, warn, info, debug
- **Contexto Rico**: Cada log contém user_id, role, correlation_id para depuração eficiente
- **Rotação Automática**: Logs organizados por data para gerenciamento eficiente

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento
npm run dev:api          # Inicia API
npm run dev:worker       # Inicia ETL Worker
npm run dev:web          # Inicia Frontend

# Build
npm run build:api        # Build API
npm run build:worker     # Build Worker
npm run build:web        # Build Frontend

# Database
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:migrate   # Executa migrations
npm run prisma:studio    # Abre Prisma Studio

# Utilitários
npm run create:superadmin  # Cria usuário superadmin
```

## 📝 Variáveis de Ambiente

Consulte `.env.example` para todas as variáveis disponíveis.

### Essenciais

- `DATABASE_URL`: Conexão MySQL (SIGLS - Destino)
- `SOURCE_DATABASE_URL`: Conexão MySQL (Base da Saúde - Fonte)
- `JWT_SECRET`: Chave secreta para JWT
- `API_PORT`: Porta da API (padrão: 3001)

## 🔒 Segurança

- ✅ JWT para autenticação stateless
- ✅ bcryptjs para hash de senhas
- ✅ Helmet para headers HTTP seguros
- ✅ RBAC para controle de acesso granular
- ✅ Validação de entrada em todas as rotas
- ✅ Connection pooling para performance
- ✅ Prepared statements (Prisma) contra SQL injection

## 📚 Tecnologias Principais

### Backend
- Node.js + Express
- Prisma ORM
- JWT + bcryptjs
- Winston (Logging)
- Helmet (Security)

### Frontend
- React 18
- Redux Toolkit + RTK Query
- Ant Design
- React Leaflet
- React Hook Form

### Database
- MySQL 8+
- Prisma Migrations

## 🤝 Contribuindo

Este projeto é desenvolvido e mantido pela **Prefeitura de Corumbá/MS**.

Para contribuir ou reportar problemas:
- Abra uma issue neste repositório
- Entre em contato com a Secretaria Municipal de Educação
- Envie pull requests seguindo as diretrizes em [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com ❤️ pela <strong>Prefeitura de Corumbá/MS</strong><br>
  Em prol da educação e transparência pública
</p>
