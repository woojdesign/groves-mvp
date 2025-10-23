import { Navigate } from 'react-router-dom';
import { api } from '../lib/apiService';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/ui/loading-spinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'org_admin' | 'super_admin';
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // Get current user info from API
        const response = await api.get<User>('/users/me');
        const userData = response.data;

        // Check if user has admin role
        if (userData.role === 'org_admin' || userData.role === 'super_admin') {
          setUser(userData);
        } else {
          setError('Access denied: Admin role required');
        }
      } catch (err: any) {
        console.error('Admin access check failed:', err);
        setError('Failed to verify admin access');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Verifying admin access..." />
      </div>
    );
  }

  if (error || !user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
