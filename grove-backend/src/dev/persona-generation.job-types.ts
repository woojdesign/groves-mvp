import type { GeneratePersonasResponse } from './dto/persona-response.dto';

export interface PersonaGenerationJobPayload {
  orgId: string;
  template: string;
  count: number;
  intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed';
  categories?: string[];
  customPrompt?: string;
}

export type PersonaGenerationJobResult = GeneratePersonasResponse;

