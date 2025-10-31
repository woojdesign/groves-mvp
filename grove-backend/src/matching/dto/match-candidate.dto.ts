/**
 * DTO representing a single match candidate with scoring information.
 * Returned to the frontend with explainability reasons.
 */
export class MatchCandidateDto {
  id: string; // Match ID for accept/pass actions
  candidate: {
    id: string;
    name: string;
    role?: string;
  };
  sharedInterest: string; // Primary shared interest
  context: string; // Detailed explanation/reason
  interests: string[]; // List of shared interests
  score: number; // Similarity score 0-1
  status: string; // Match status: pending, accepted, passed, expired
  createdAt: string; // ISO timestamp when match was created
  expiresAt: string; // ISO timestamp when match expires
}
