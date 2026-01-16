# Proposta Arquitetural para Mapa Turismo — Guia de Turismo de Corumbá (MAPATUR)

O presente relatório técnico-arquitetural define a estrutura fundamental para o desenvolvimento do projeto Mapa Turismo (MAPATUR) no município de Corumbá, Mato Grosso do Sul. A proposta utiliza a stack tecnológica robusta e escalável, composta por MySQL (Banco de Dados), Node.js (Backend, API e Processamento ETL) e React (Frontend). O foco reside na governança de dados, garantindo a integridade, rastreabilidade e segurança através da sincronização controlada de dados, modelagem espelho (Staging/Produção) e controle de acesso hierárquico.

---

## I. Fundamentos Arquiteturais e Estratégia Tecnológica (Stack MERN+)

A seleção da stack tecnológica foi orientada pela necessidade de alta performance para a API transacional, eficiência no processamento assíncrono de dados brutos (ETL), e uma interface de usuário rica e responsiva, especialmente para fluxos de trabalho administrativos complexos.

### I.1. Arquitetura de Projeto e Monorepo

Para projetos full-stack que englobam múltiplas aplicações interconectadas (API, worker de sincronização e cliente web), a adoção de uma arquitetura Monorepo (repositório único) é altamente recomendada.

#### Justificativa para Monorepo com Nx

O Monorepo, utilizando ferramentas de gestão como Nx, é a solução arquitetural ideal para o MAPATUR, que exige a criação de pelo menos três projetos lógicos distintos que compartilham lógica de negócios e contratos de dados:

- **API Transacional**: Servidor Node.js/Express responsável por atender as requisições do frontend (CRUD em dados operacionais).
- **ETL Data Worker**: Serviço Node.js/Prisma dedicado a tarefas intensivas de I/O, como extração, transformação e carregamento de grandes volumes de dados.
- **Cliente Administrativo**: Aplicação React para a interface do usuário (mapa e dashboards).

A principal vantagem é a capacidade de compartilhar código comum (definições de tipos TypeScript e modelos de dados do Prisma) diretamente entre backend e frontend, otimizando o fluxo de desenvolvimento e assegurando a consistência do contrato de dados.

#### Separação de Preocupações e Isolamento de Carga

A separação em projetos Node.js distintos dentro do Monorepo garante que o processamento intensivo de dados (ETL Worker) não interfira na performance transacional da API que atende o frontend React, o que é crítico para a escalabilidade.

### I.2. Seleção do ORM e Driver de Banco de Dados

A interação com o MySQL requer uma camada de abstração (ORM) que garanta segurança de tipo, manutenibilidade e suporte nativo às operações de sincronização. A escolha recai sobre o Prisma ORM.

#### Justificativa Técnica para Prisma ORM

- **Segurança de Tipo**: O Prisma gera um cliente de banco de dados que é type-safe (seguro em tipos), reduzindo erros de tempo de execução.
- **Schema-Driven Development**: O desenvolvimento é orientado pela definição do esquema (schema.prisma), servindo como fonte única de verdade para a estrutura do banco de dados.
- **Suporte Otimizado a UPSERT**: Simplifica a implementação da lógica de UPSERT (Insert or Update), crucial para o pipeline de sincronização (ETL) ao carregar dados da Staging para a Produção de forma incremental e repetível.

#### Pacotes Essenciais de Backend (Node.js)

- **Servidor e Roteamento**: `express` e `cors`.
- **Autenticação/Segurança**: `jsonwebtoken` (JWT) para autenticação stateless e `bcryptjs` para hashing seguro de senhas.
- **Práticas de Produção**: `dotenv` e `helmet` (para HTTP headers seguros).
- **Gerenciamento de Logs**: Winston ou Pino para logs estruturados (JSON) e observabilidade.
- **ETL e Processamento de Dados**: `axios` para extração de APIs externas.

### I.3. Seleção de Pacotes Frontend (React)

O frontend será construído para oferecer uma experiência de usuário profissional e altamente responsiva.

| Categoria | Tecnologia Recomendada | Justificativa |
|-----------|------------------------|---------------|
| **Gerenciamento de Estado** | Redux Toolkit (RTK) com RTK Query | Oferece a estrutura, previsibilidade e escalabilidade para aplicações complexas. O RTK Query elimina boilerplate e gerencia data fetching e caching de forma robusta. |
| **Biblioteca de UI** | Ant Design | Superior para o contexto de aplicações enterprise e administrativas. Oferece um conjunto extenso e sofisticado de componentes (tabelas avançadas, formulários complexos) otimizados para performance e design responsivo. |
| **Mapas (GIS)** | React Leaflet | Biblioteca de mapeamento leve e performática. Fornece uma abstração limpa de componentes e suporta funcionalidades nativas como a restrição de limites geográficos (maxBounds). |
| **Formulários** | React Hook Form | Focado em validação não controlada, minimizando re-renderizações e garantindo alta performance mesmo com formulários extensos na interface administrativa. |

---

## II. Modelagem de Dados MySQL para Governança (Tabelas Espelho)

A arquitetura de tabelas espelho (Staging vs. Produção) é crucial para a governança de dados, separando dados brutos de entrada (Staging) de dados validados e operacionais (Produção).

### II.1. Estrutura Relacional Chave para Entidades de Saúde (PROD)

A modelagem utiliza o Modelo Entidade-Relacionamento (ER) com tabelas de junção para relações Muitos-para-Muitos (N:N).

| Tabela | Entidade/Relacionamento | Campos Chave Essenciais | Propósito |
|--------|-------------------------|-------------------------|-----------|
| **PROD_Unidade_Saude** | Entidade | `id`, `nome`, `cnpj`, `latitude`, `longitude`, `id_origem` (CNES ID) | Armazena dados geo-referenciados limpos, prontos para exibição no mapa. |
| **PROD_Especialidade** | Entidade | `id`, `nome_especialidade` | Lista mestra de serviços/especialidades. |
| **PROD_Medico** | Entidade | `id`, `crm`, `nome`, `cpf_opcional` | Cadastro de médicos. |
| **Junction_Medico_Especialidade** | N:N (Junção) | `medico_id` (FK), `especialidade_id` (FK) | Vincula os profissionais às suas áreas de atuação. |

### II.2. Arquitetura de Tabelas Espelho (Staging vs. Produção)

- **STAGING_Tabela (Tabela Espelho)**: Armazena dados brutos (Raw Data). Inclui campos de metadados para gerenciamento do fluxo de trabalho: `status_processamento` (ex: 'pendente', 'validado', 'erro') e `data_validacao`.
- **PROD_Tabela (Tabela de Produção)**: Contém apenas dados que passaram pelo controle de qualidade e estão normalizados.

| Campo | STAGING_Unidade_Saude | PROD_Unidade_Saude | Propósito |
|-------|------------------------|---------------------|-----------|
| **id** | PK (Auto-Incremento) | PK (Auto-Incremento) | Identificador local da tabela. |
| **id_origem** | Chave Natural (CNES/Source ID) | Chave Natural (CNES/Source ID) | Usado para lógica de UPSERT e identificação externa. |
| **id_prod_link** | INT FK → PROD.id (Opcional) | Não Aplicável | Rastreia para qual registro limpo o dado bruto foi promovido. |
| **status_processamento** | ENUM ('pendente', 'validado', 'erro') | Não Aplicável | Controla o fluxo de trabalho administrativo de ETL. |
| **latitude, longitude** | NULLable | NOT NULL | Garante que o dado na Produção é geo-referenciado e utilizável pelo mapa. |

---

## III. Backend e Pipeline de Sincronização (ETL em Node.js)

O Node.js, como ETL Worker separado (Monorepo), é responsável por mover dados de fontes externas para a Staging e, após validação, para a Produção.

### III.1. Fluxo de Execução do ETL

1. **Extract (Extração)**: Coleta de dados de fontes externas (APIs, arquivos CSV/JSON), utilizando a abordagem de streaming no Node.js para evitar memory crashes com grandes volumes.
2. **Transform (Limpeza e Enriquecimento)**: Aplica lógica de negócio (Normalização, Validação Inicial). Registros com falha são marcados com `status_processamento: erro` para revisão manual.
3. **Load (Carregamento para PROD)**: Ativada quando um Admin valida um registro. Exige otimização rigorosa.

### III.2. Estratégias de Carregamento Otimizado

- **Bulk Insert e Transações**: Para transferir grandes volumes da Staging para a Produção, é imperativo utilizar operações de inserção em lote (Bulk Insert) em uma única transação MySQL. Isso reduz o overhead de comunicação, garantindo que a operação seja atômica (ou todos os registros são inseridos/atualizados, ou nenhum é).
- **Lógica de UPSERT (Sincronização Incremental)**: Implementada via Prisma ORM (ou SQL nativo com `INSERT... ON DUPLICATE KEY UPDATE`) usando o `id_origem` como critério de unicidade. Garante a idempotência do processo de sincronização.

---

## IV. Segurança, Controle de Acesso (RBAC) e Auditoria

A segurança é estruturada em três camadas: Autenticação (JWT), Autorização (RBAC por Middleware) e Rastreabilidade (Sistema de Logs/Auditoria).

### IV.1. Role-Based Access Control (RBAC)

O controle de acesso é baseado em papéis, forçando a autorização no backend através de um middleware Express.

**Hierarquia de Papéis:**

- **Admin**: Responsável pela validação operacional de dados nas tabelas STAGING (limpeza, enriquecimento manual). Permissões para CRUD nos dados operacionais validados na PROD.
- **Superadmin**: Permissões administrativas totais, incluindo gerenciamento de usuários, acesso aos logs de auditoria e controle final sobre o disparo e aprovação do pipeline de sincronização de dados (Load final).

### IV.2. Logs de Aplicação e Auditoria de Acesso

- **Structured Logging**: Utilizar bibliotecas como Winston ou Pino para gerar logs no formato JSON.
- **Contexto Detalhado**: Cada entrada de log deve incluir metadados essenciais como `timestamp`, `log_level`, `user_id`, `role`, `action` e um `correlation_id` para rastrear o fluxo completo de uma transação.

### IV.3. Sistema de Auditoria de Dados (Audit Trail)

Para garantir que todas as alterações nos dados primários sejam rastreadas, o sistema deve implementar uma auditoria de dados persistente e imutável.

#### Justificativa para Triggers MySQL

A metodologia mais robusta é o uso de Triggers (Gatilhos) no MySQL. Um trigger é executado automaticamente no banco de dados em resposta a eventos (INSERT, UPDATE, DELETE), garantindo que a alteração seja registrada na Tabela de Auditoria, independentemente da origem da query (prevenindo bypass de segurança por um Superadmin).

| Campo | Tipo MySQL | Descrição |
|-------|------------|-----------|
| **audit_id** | BIGINT PK AUTO_INCREMENT | Identificador do registro de auditoria. |
| **tabela_afetada** | VARCHAR(100) | Nome da tabela auditada (ex: PROD_Unidade_Saude). |
| **registro_id** | INT | ID (FK) do registro da tabela auditada. |
| **tipo_operacao** | ENUM('INSERT', 'UPDATE', 'DELETE') | Tipo de modificação realizada. |
| **valor_antigo** | JSON | Dados do registro antes da ação (via MySQL OLD). |
| **valor_novo** | JSON | Dados do registro depois da ação (via MySQL NEW). |
| **usuario_id** | INT FK | Quem realizou a ação. |
| **timestamp_acao** | DATETIME | Data e hora exatas da modificação. |

---

## V. Estratégia Frontend (React) e Mapeamento Geográfico

### V.1. Restrição Geográfica em Corumbá, MS

O requisito de "mapa limitado em Corumbá, MS" é implementado através da opção `maxBounds` do componente React Leaflet. Esta opção restringe a área de visualização do mapa aos limites geográficos fornecidos.

#### Definição dos Limites Geográficos de Corumbá

Devido à vasta área territorial do município, o `maxBounds` deve ser configurado para cobrir a totalidade da área municipal através de um bounding box retangular (lat/lng min e max) para garantir que todas as unidades, incluindo as rurais, estejam acessíveis.

**Exemplo de Configuração Leaflet (Recomendação Inicial):**

```javascript
// Exemplo ilustrativo de um Bounding Box que cobre a vasta região de Corumbá
const CORUMBA_BOUNDS = [
    [-22.0, -60.5],  // SouthWest Lat/Lng (aproximação para incluir limites distantes)
    [-16.0, -56.0]   // NorthEast Lat/Lng
]; 

// Aplicação no componente React Leaflet:
// <MapContainer maxBounds={CORUMBA_BOUNDS} maxBoundsViscosity={1.0} center={[-19.00, -57.65]} zoom={10}>
```

O parâmetro `maxBoundsViscosity: 1.0` é crucial para garantir que a borda do limite seja "dura", impedindo o arrasto para fora.

### V.2. UI/UX Administrativa e Fluxo de Validação

A interface administrativa utiliza Ant Design para garantir a adaptação fluida (design responsivo).

#### Interface de Validação de Dados (Staging)

O processo de validação requer que o administrador:

1. **Compare Dados**: Exiba lado a lado o registro bruto (STAGING_Tabela) e, se aplicável, o registro limpo (PROD_Tabela).
2. **Enriqueça Manualmente**: Formulários robustos (React Hook Form) para correção e enriquecimento, como a inserção manual de coordenadas Latitude/Longitude.
3. **Gerencie Status**: Permita a alteração do `status_processamento` (de 'pendente' para 'validado', ou 'erro', com justificativa).

---

## VI. Conclusões e Plano de Implementação

O SIGLS exige uma arquitetura que equilibre a agilidade do desenvolvimento full-stack em JavaScript (Node.js/React) com a robustez e integridade de um sistema de dados crítico (MySQL).

### VI.1. Síntese Arquitetural

| Componente Requisitado | Tecnologia Recomendada | Justificativa Arquitetural |
|------------------------|------------------------|----------------------------|
| **Arquitetura Geral** | Monorepo (Nx) | Consistência de código e separação lógica entre API transacional e ETL Worker. |
| **Banco de Dados** | MySQL + Prisma ORM | Alta performance, schema-driven development e type safety. Essencial para o UPSERT. |
| **Sincronização/ETL** | Node.js Worker + Bulk Insert | Assincronia para I/O e otimização de performance através de transações em lote. |
| **Modelagem de Dados** | Tabelas Espelho (Staging/Prod) | Governança de dados e rastreabilidade via `id_origem` e `id_prod_link`. |
| **Controle de Acesso** | JWT + Express Middleware | RBAC definido no payload do token para controle de rotas por Admin/Superadmin. |
| **Logs/Auditoria** | Triggers MySQL + Logs Estruturados | Garantia de auditoria imutável (Audit Trail) no nível do BD, prevenindo bypass de segurança. |
| **Design Responsivo** | React + Ant Design | Foco em UI/UX para aplicações administrativas e dashboards complexos. |
| **Mapa Limitado** | React Leaflet + maxBounds | Performance e controle granular para restrição geográfica estrita à área municipal. |

### VI.2. Plano de Implementação Sugerido

1. **Fase 1: Infraestrutura e Modelagem (Base de Dados)**: Criação das tabelas PROD e STAGING, configuração do Monorepo/Prisma, e implementação das Triggers MySQL para o Audit Trail.
2. **Fase 2: Backend, Segurança e ETL**: Desenvolvimento do Node.js API Server (Express) com Autenticação/Autorização (JWT/RBAC). Construção do ETL Worker com lógicas de streaming e implementação otimizada do UPSERT e Bulk Insert.
3. **Fase 3: Frontend e Funcionalidades Core**: Criação da aplicação React com Redux Toolkit/RTK Query. Implementação do componente de mapa com React Leaflet e maxBounds. Desenvolvimento da interface administrativa de Validação de Dados com Ant Design e React Hook Form.
