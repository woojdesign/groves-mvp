/**
 * DTO representing a single match candidate with scoring information.
 * Returned to the frontend with explainability reasons.
 */
export class MatchCandidateDto {
  id?: string; // Match ID for accept/pass actions
  candidateId: string;
  name: string;
  score: number; // Similarity score 0-1
  reason: string; // Human-readable explanation
  sharedInterests: string[]; // List of shared interests
  confidence: number; // Confidence level 0-1
  status?: string; // Match status: pending, accepted, passed, expired
  expiresAt?: string; // ISO timestamp when match expires
}
