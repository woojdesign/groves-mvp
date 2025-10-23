/**
 * DTO for match accept response.
 * Indicates whether this resulted in a mutual match.
 */
export class AcceptMatchResponseDto {
  status: 'accepted' | 'mutual_match';
  mutualMatch: boolean;
  intro?: {
    id: string;
    status: string;
  };
  message: string;
}
