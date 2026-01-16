// ============================================================================
// SHARED TYPES - Tipos compartilhados entre API, Worker e Frontend
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export enum StatusProcessamento {
  PENDENTE = 'pendente',
  VALIDADO = 'validado',
  ERRO = 'erro',
  IGNORADO = 'ignorado',
}

export enum OperacaoAudit {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum ETLStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  ativo?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ============================================================================
// STAGING TYPES
// ============================================================================

export interface StagingRecord {
  id: number;
  nome_medico_bruto?: string;
  nome_unidade_bruto?: string;
  nome_especialidade_bruto?: string;
  id_origem: string;
  status_processamento: StatusProcessamento;
  id_prod_link?: number;
  nome_familiar?: string;
  endereco_manual?: string;
  latitude_manual?: number;
  longitude_manual?: number;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StagingEnrichmentInput {
  nome_familiar?: string;
  endereco_manual?: string;
  latitude_manual?: number;
  longitude_manual?: number;
  observacoes?: string;
}

// ============================================================================
// PRODUCTION TYPES
// ============================================================================

export interface UnidadeSaude {
  id: number;
  nome: string;
  endereco?: string;
  latitude: number;
  longitude: number;
  id_origem: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  especialidades?: Especialidade[];
}

export interface Medico {
  id: number;
  nome: string;
  id_origem: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  especialidades?: Especialidade[];
}

export interface Especialidade {
  id: number;
  nome: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UnidadeSaudeCreateInput {
  nome: string;
  endereco?: string;
  latitude: number;
  longitude: number;
  id_origem: string;
  especialidades?: number[];
}

export interface UnidadeSaudeUpdateInput {
  nome?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  ativo?: boolean;
  especialidades?: number[];
}

export interface MedicoCreateInput {
  nome: string;
  id_origem: string;
  especialidades?: number[];
}

export interface MedicoUpdateInput {
  nome?: string;
  ativo?: boolean;
  especialidades?: number[];
}

export interface EspecialidadeCreateInput {
  nome: string;
}

export interface EspecialidadeUpdateInput {
  nome?: string;
  ativo?: boolean;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLog {
  id: number;
  tabela: string;
  operacao: OperacaoAudit;
  registro_id: number;
  valor_antigo?: string;
  valor_novo?: string;
  user_id?: number;
  correlation_id?: string;
  timestamp: Date;
  user?: User;
}

export interface AuditLogFilter {
  tabela?: string;
  operacao?: OperacaoAudit;
  user_id?: number;
  start_date?: Date;
  end_date?: Date;
}

// ============================================================================
// ETL TYPES
// ============================================================================

export interface ETLExecution {
  id: number;
  started_at: Date;
  finished_at?: Date;
  status: ETLStatus;
  records_extracted: number;
  records_loaded: number;
  records_failed: number;
  error_message?: string;
}

export interface ETLSourceRecord {
  id_origem: string;
  nome_medico?: string;
  nome_unidade?: string;
  nome_especialidade?: string;
}

// ============================================================================
// MAP TYPES
// ============================================================================

export interface MapBounds {
  southWest: [number, number]; // [lat, lng]
  northEast: [number, number]; // [lat, lng]
}

export interface MapCenter {
  lat: number;
  lng: number;
}

export const CORUMBA_MAP_CONFIG = {
  bounds: {
    southWest: [-22.0, -60.5] as [number, number],
    northEast: [-16.0, -56.0] as [number, number],
  },
  center: {
    lat: -19.008,
    lng: -57.651,
  },
  defaultZoom: 12,
  maxBoundsViscosity: 1.0,
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
}
