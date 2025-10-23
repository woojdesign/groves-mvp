/**
 * API Client
 *
 * Axios instance with httpOnly cookie authentication, CSRF protection, and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import type { ApiError } from '../types/api';

// CSRF token storage (not httpOnly, needs to be readable by JS)
let csrfToken: string | null = null;

// Create axios instance with credentials enabled for cookies
const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// CSRF Token Management
// ============================================================================

/**
 * Initialize CSRF token by fetching from backend
 * Should be called on app load
 */
export async function initCsrf(): Promise<void> {
  try {
    const response = await axios.get(`${config.apiBaseUrl}/auth/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
}

/**
 * Get current CSRF token
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

// ============================================================================
// Request Interceptor - Add CSRF token
// ============================================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token to non-GET requests
    if (csrfToken && config.method && config.method.toLowerCase() !== 'get') {
      if (config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor - Handle authentication errors
// ============================================================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - Session expired, redirect to login
    if (error.response?.status === 401) {
      // Clear any client-side state if needed
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - Could be CSRF token issue
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.includes('CSRF')) {
        // CSRF token invalid, try to reinitialize
        await initCsrf();
      }
    }

    // Format error for consistent handling
    const apiError: ApiError = error.response?.data || {
      statusCode: error.response?.status || 500,
      message: error.message || 'An unexpected error occurred',
      error: error.response?.statusText || 'Unknown Error',
    };

    return Promise.reject(apiError);
  }
);

// ============================================================================
// Export
// ============================================================================

export default api;
