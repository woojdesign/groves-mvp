/**
 * Environment Configuration
 *
 * Centralized configuration for API endpoints and environment-specific settings
 */

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  apiTimeout: 30000, // 30 seconds
  tokenRefreshThreshold: 60 * 1000, // Refresh token 1 minute before expiry
} as const;

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
