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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Try to refresh token first
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the access token
        await axios.post(`${config.apiBaseUrl}/auth/refresh`, {}, {
          withCredentials: true,
        });

        // Refresh successful, process queued requests
        processQueue();
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear queue and redirect to login
        processQueue(refreshError);
        isRefreshing = false;
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - Could be CSRF token issue
    if (error.response?.status === 403 && !originalRequest._retry) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.includes('CSRF')) {
        originalRequest._retry = true;
        // CSRF token invalid, try to reinitialize and retry
        await initCsrf();
        return api(originalRequest);
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
