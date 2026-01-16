import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS - Zod schemas para validação de entrada
// ============================================================================

// User Validation
export const userCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'superadmin']),
});

export const userUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'superadmin']).optional(),
  ativo: z.boolean().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(1),
});

// Staging Validation
export const stagingEnrichmentSchema = z.object({
  nome_familiar: z.string().max(255).optional(),
  endereco_manual: z.string().max(500).optional(),
  latitude_manual: z.number().min(-90).max(90).optional(),
  longitude_manual: z.number().min(-180).max(180).optional(),
  observacoes: z.string().optional(),
});

// Unidade Saúde Validation
export const unidadeSaudeCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  endereco: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  id_origem: z.string().max(100),
  especialidades: z.array(z.number()).optional(),
});

export const unidadeSaudeUpdateSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  endereco: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ativo: z.boolean().optional(),
  especialidades: z.array(z.number()).optional(),
});

// Médico Validation
export const medicoCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  id_origem: z.string().max(100),
  especialidades: z.array(z.number()).optional(),
});

export const medicoUpdateSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  ativo: z.boolean().optional(),
  especialidades: z.array(z.number()).optional(),
});

// Especialidade Validation
export const especialidadeCreateSchema = z.object({
  nome: z.string().min(1).max(255),
});

export const especialidadeUpdateSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  ativo: z.boolean().optional(),
});

// Pagination Validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function validateCorumbaCoordinates(lat: number, lng: number): boolean {
  // Verifica se as coordenadas estão dentro dos limites de Corumbá
  return lat >= -22.0 && lat <= -16.0 && lng >= -60.5 && lng <= -56.0;
}

export function sanitizeString(str: string): string {
  return str.trim().toUpperCase();
}

export function normalizeIdOrigem(id: string): string {
  return id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
