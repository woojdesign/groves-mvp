export interface PersonaResponse {
  id: string;
  name: string;
  email: string;
  nicheInterest: string;
  project: string;
  connectionType: string;
  rabbitHole?: string;
  preferences?: string;
  embeddingStatus: 'generated' | 'pending' | 'failed';
  createdAt: Date;
}

export interface GeneratePersonasResponse {
  success: boolean;
  count: number;
  personas: PersonaResponse[];
  message: string;
}
