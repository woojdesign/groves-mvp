/**
 * DTO for introduction response.
 * Contains matched user information and shared interests.
 */
export class IntroResponseDto {
  id: string;
  match: {
    id: string;
    name: string;
    email: string;
    sharedInterest: string;
    interests: string[];
  };
  status: string; // 'active' | 'completed' | 'expired'
  createdAt: string;
}
