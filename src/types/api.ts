/**
 * API Type Definitions
 *
 * TypeScript interfaces for all API requests and responses
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
  status: 'active' | 'paused' | 'deleted';
  hasCompletedOnboarding: boolean;
  createdAt: string;
  lastActive: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
  expiresIn: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ============================================================================
// Profile & Onboarding Types
// ============================================================================

export type ConnectionType = 'collaboration' | 'mentorship' | 'friendship' | 'knowledge_exchange';

export interface OnboardingResponses {
  niche_interest: string;
  project: string;
  connection_type: ConnectionType;
  rabbit_hole?: string;
  preferences?: string;
}

export interface Profile {
  id: string;
  userId: string;
  nicheInterest: string;
  project: string;
  connectionType: ConnectionType;
  rabbitHole?: string;
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingResponse {
  profile: Profile;
  embeddingStatus: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface UpdateProfileRequest {
  nicheInterest?: string;
  project?: string;
  connectionType?: ConnectionType;
  rabbitHole?: string;
  preferences?: string;
}

// ============================================================================
// Match Types
// ============================================================================

export type MatchStatus = 'pending' | 'accepted' | 'passed' | 'expired';

export interface MatchCandidate {
  id: string;
  name: string;
  role?: string;
}

export interface Match {
  id: string;
  candidate: MatchCandidate;
  sharedInterest: string;
  context: string;
  interests: string[];
  score: number;
  status: MatchStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MatchesResponse {
  matches: Match[];
  total: number;
  hasMore: boolean;
}

export interface MatchActionResponse {
  status: string;
  mutualMatch: boolean;
  message: string;
  intro?: {
    id: string;
    status: string;
  };
}

// ============================================================================
// Introduction Types
// ============================================================================

export interface IntroMatch {
  name: string;
  email: string;
  sharedInterest: string;
  interests: string[];
}

export interface Intro {
  id: string;
  match: IntroMatch;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
}

export interface IntrosResponse {
  intros: Intro[];
}

// ============================================================================
// Feedback Types
// ============================================================================

export interface FeedbackRequest {
  didMeet: 'yes' | 'scheduled' | 'no';
  helpful?: boolean;
  note?: string;
}

export interface FeedbackResponse {
  message: string;
  feedback: {
    id: string;
    didMeet: string;
    helpful?: boolean;
    createdAt: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: Array<{
    field: string;
    constraint: string;
    message: string;
  }>;
}

export interface RateLimitError extends ApiError {
  retryAfter: number;
}
