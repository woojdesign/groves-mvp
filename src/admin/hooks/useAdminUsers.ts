import { useState, useEffect } from 'react';
import { api } from '../../lib/apiService';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'org_admin' | 'super_admin';
  status: 'active' | 'suspended' | 'deleted';
  ssoProvider: string | null;
  createdAt: string;
  lastActive: string | null;
  hasProfile: boolean;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export function useAdminUsers(page: number = 1, limit: number = 50) {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<UsersResponse>('/admin/users', {
        params: { page, limit },
      });
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  return { data, loading, error, refetch: fetchUsers };
}

export async function createUser(userData: {
  email: string;
  name: string;
  role?: string;
}) {
  const response = await api.post('/admin/users', userData);
  return response.data;
}

export async function updateUser(userId: string, updates: {
  name?: string;
  role?: string;
  status?: string;
}) {
  const response = await api.put(`/admin/users/${userId}`, updates);
  return response.data;
}

export async function suspendUser(userId: string) {
  const response = await api.post(`/admin/users/${userId}/suspend`);
  return response.data;
}

export async function deleteUser(userId: string) {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
}
