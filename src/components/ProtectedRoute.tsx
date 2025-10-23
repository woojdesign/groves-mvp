/**
 * Protected Route Component
 *
 * Wraps routes that require authentication
 */

import { Navigate } from 'react-router-dom';
import { tokenManager } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = tokenManager.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to welcome page if not authenticated
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
