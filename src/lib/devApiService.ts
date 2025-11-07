/**
 * Dev Dashboard API Service Functions
 *
 * API calls for test persona generation and management
 */

import api from './api';

// ============================================================================
// Types
// ============================================================================

export interface PersonaResponse {
  id: string;
  name: string;
  email: string;
  interests: string;
  project: string;
  connectionType: string;
  deepDive?: string;
  preferences?: string;
  embeddingStatus: 'generated' | 'pending' | 'failed';
  createdAt: string;
}

export interface GeneratePersonasResponse {
  success: boolean;
  count: number;
  personas: PersonaResponse[];
  message: string;
}

export interface PersonaGenerationJobLaunchResponse {
  success: boolean;
  jobId: string;
  status: 'queued';
  message: string;
}

export type PersonaGenerationJobStatus =
  | 'queued'
  | 'active'
  | 'delayed'
  | 'completed'
  | 'failed'
  | 'not_found';

export interface PersonaGenerationJobStatusResponse {
  status: PersonaGenerationJobStatus;
  progress: number;
  result?: GeneratePersonasResponse;
  error?: string;
}

export interface GeneratePresetRequest {
  template: 'casual_10' | 'engaged_10' | 'deep_10' | 'mixed_10' | 'diverse_50';
}

export interface GenerateCustomRequest {
  count: number;
  intensityLevels: ('casual' | 'engaged' | 'deep')[];
  categories?: string[];
  customPrompt?: string;
}

export interface CreateManualPersonaRequest {
  name: string;
  email: string;
  interests: string;
  project: string;
  connectionType: string;
  deepDive?: string;
  preferences?: string;
}

export interface BulkUploadRequest {
  personas: CreateManualPersonaRequest[];
}

export interface MatchPreview {
  userId: string;
  name: string;
  email: string;
  interests: string;
  similarityScore: number;
}

export interface MatchPreviewResponse {
  userId: string;
  matches: MatchPreview[];
  message?: string;
}

export interface EmbeddingStatusResponse {
  status: 'generated' | 'pending';
  dimensions?: number;
  createdAt?: string;
  interestsText?: string;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  count?: number;
}

export interface ExportResponse {
  exportedAt: string;
  count: number;
  personas: Partial<PersonaResponse>[];
}

// ============================================================================
// Persona Generation Services
// ============================================================================

/**
 * Generate personas from a preset template
 */
export async function generatePreset(
  template: GeneratePresetRequest['template']
): Promise<PersonaGenerationJobLaunchResponse> {
  const response = await api.post<PersonaGenerationJobLaunchResponse>(
    '/admin/dev/personas/preset',
    { template }
  );
  return response.data;
}

/**
 * Fetch persona generation job status
 */
export async function getPersonaGenerationJobStatus(
  jobId: string
): Promise<PersonaGenerationJobStatusResponse> {
  const response = await api.get<PersonaGenerationJobStatusResponse>(
    `/admin/dev/personas/jobs/${jobId}`
  );
  return response.data;
}

/**
 * Generate personas with custom parameters
 */
export async function generateCustom(
  request: GenerateCustomRequest
): Promise<GeneratePersonasResponse> {
  const response = await api.post<GeneratePersonasResponse>(
    '/admin/dev/personas/custom',
    request
  );
  return response.data;
}

/**
 * Create a single manual persona
 */
export async function createManualPersona(
  persona: CreateManualPersonaRequest
): Promise<PersonaResponse> {
  const response = await api.post<PersonaResponse>(
    '/admin/dev/personas/manual',
    persona
  );
  return response.data;
}

/**
 * Bulk upload personas
 */
export async function bulkUploadPersonas(
  personas: CreateManualPersonaRequest[]
): Promise<GeneratePersonasResponse> {
  const response = await api.post<GeneratePersonasResponse>(
    '/admin/dev/personas/upload',
    { personas }
  );
  return response.data;
}

// ============================================================================
// Status & Monitoring Services
// ============================================================================

/**
 * List all test personas
 */
export async function listPersonas(): Promise<PersonaResponse[]> {
  const response = await api.get<PersonaResponse[]>('/admin/dev/personas');
  return response.data;
}

/**
 * Get embedding status for a persona
 */
export async function getEmbeddingStatus(
  userId: string
): Promise<EmbeddingStatusResponse> {
  const response = await api.get<EmbeddingStatusResponse>(
    `/admin/dev/personas/${userId}/embedding`
  );
  return response.data;
}

/**
 * Preview potential matches for a persona
 */
export async function previewMatches(
  userId: string,
  limit: number = 10
): Promise<MatchPreviewResponse> {
  const response = await api.get<MatchPreviewResponse>(
    `/admin/dev/personas/${userId}/matches`,
    { params: { limit } }
  );
  return response.data;
}

// ============================================================================
// Management Services
// ============================================================================

/**
 * Delete a single test persona
 */
export async function deletePersona(userId: string): Promise<DeleteResponse> {
  const response = await api.delete<DeleteResponse>(
    `/admin/dev/personas/${userId}`
  );
  return response.data;
}

/**
 * Delete all test personas
 */
export async function deleteAllPersonas(): Promise<DeleteResponse> {
  const response = await api.delete<DeleteResponse>('/admin/dev/personas');
  return response.data;
}

/**
 * Export all test personas as JSON
 */
export async function exportPersonas(): Promise<ExportResponse> {
  const response = await api.get<ExportResponse>('/admin/dev/personas/export');
  return response.data;
}

/**
 * Check if dev dashboard is accessible
 */
export async function checkDevHealth(): Promise<{
  status: string;
  environment: string;
  message: string;
}> {
  const response = await api.get('/admin/dev/health');
  return response.data;
}
