/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * With httpOnly cookies, we can't check localStorage.
 * The API will automatically return 401 if not authenticated,
 * which will redirect to login via the axios interceptor.
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // With httpOnly cookies, authentication is handled automatically
  // If the user is not authenticated, API calls will return 401
  // and the axios interceptor will redirect to /

  // We just render the children - the API layer handles auth checks
  return <>{children}</>;
}
