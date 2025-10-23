/**
 * API Service Functions
 *
 * High-level service functions for all API endpoints
 */

import api, { tokenManager } from './api';
import type {
  MagicLinkRequest,
  MagicLinkResponse,
  VerifyTokenRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  OnboardingResponses,
  OnboardingResponse,
  Profile,
  UpdateProfileRequest,
  MatchesResponse,
  MatchActionResponse,
  IntrosResponse,
  FeedbackRequest,
  FeedbackResponse,
} from '@/types/api';

// ============================================================================
// Authentication Services
// ============================================================================

/**
 * Request a magic link to be sent to the user's email
 */
export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  const response = await api.post<MagicLinkResponse>('/auth/magic-link', {
    email,
  } as MagicLinkRequest);
  return response.data;
}

/**
 * Verify magic link token and receive JWT tokens
 */
export async function verifyToken(token: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/verify', {
    token,
  } as VerifyTokenRequest);

  const { accessToken, refreshToken, user } = response.data;

  // Store tokens
  tokenManager.setTokens(accessToken, refreshToken);

  return response.data;
}

/**
 * Refresh the access token using refresh token
 */
export async function refreshAccessToken(): Promise<RefreshTokenResponse> {
  const refreshToken = tokenManager.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
    refreshToken,
  } as RefreshTokenRequest);

  const { accessToken } = response.data;
  tokenManager.setAccessToken(accessToken);

  return response.data;
}

/**
 * Logout user and clear tokens
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    tokenManager.clearTokens();
  }
}

// ============================================================================
// Profile & Onboarding Services
// ============================================================================

/**
 * Submit onboarding responses and create user profile
 */
export async function submitOnboarding(
  responses: OnboardingResponses
): Promise<OnboardingResponse> {
  const response = await api.post<OnboardingResponse>('/onboarding', {
    responses,
  });
  return response.data;
}

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<Profile> {
  const response = await api.get<Profile>('/profile');
  return response.data;
}

/**
 * Update current user's profile
 */
export async function updateProfile(updates: UpdateProfileRequest): Promise<OnboardingResponse> {
  const response = await api.patch<OnboardingResponse>('/profile', updates);
  return response.data;
}

/**
 * Get embedding generation status
 */
export async function getEmbeddingStatus(): Promise<{ status: string }> {
  const response = await api.get<{ status: string }>('/profile/embedding-status');
  return response.data;
}

// ============================================================================
// Match Services
// ============================================================================

/**
 * Get current matches for authenticated user
 */
export async function getMatches(
  limit: number = 10,
  status?: 'pending' | 'accepted' | 'passed' | 'expired'
): Promise<MatchesResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (status) {
    params.append('status', status);
  }

  const response = await api.get<MatchesResponse>(`/matches?${params.toString()}`);
  return response.data;
}

/**
 * Accept a match (express interest)
 */
export async function acceptMatch(matchId: string): Promise<MatchActionResponse> {
  const response = await api.post<MatchActionResponse>(`/matches/${matchId}/accept`);
  return response.data;
}

/**
 * Pass on a match (decline interest)
 */
export async function passMatch(matchId: string): Promise<MatchActionResponse> {
  const response = await api.post<MatchActionResponse>(`/matches/${matchId}/pass`);
  return response.data;
}

// ============================================================================
// Introduction Services
// ============================================================================

/**
 * Get active introductions for authenticated user
 */
export async function getIntros(): Promise<IntrosResponse> {
  const response = await api.get<IntrosResponse>('/intros');
  return response.data;
}

/**
 * Submit feedback after an introduction
 */
export async function submitIntroFeedback(
  introId: string,
  feedback: FeedbackRequest
): Promise<FeedbackResponse> {
  const response = await api.post<FeedbackResponse>(`/intros/${introId}/feedback`, feedback);
  return response.data;
}

// ============================================================================
// User Services
// ============================================================================

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthResponse['user']> {
  const response = await api.get<AuthResponse['user']>('/user/me');
  return response.data;
}
