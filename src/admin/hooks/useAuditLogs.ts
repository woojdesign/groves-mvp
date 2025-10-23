import { useState, useEffect } from 'react';
import { api } from '../../lib/apiService';

export interface AuditLog {
  id: string;
  performedByUserId: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  performedBy?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AuditLogsResponse {
  actions: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export function useAuditLogs(page: number = 1, limit: number = 50) {
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AuditLogsResponse>('/admin/actions', {
        params: { page, limit },
      });
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  return { data, loading, error, refetch: fetchLogs };
}
