import { useState, useEffect } from 'react';
import { api } from '../../lib/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { ErrorMessage } from '../../components/ui/error-message';
import { Users, UserCheck, Zap, TrendingUp } from 'lucide-react';

interface Analytics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    suspended: number;
  };
  matches: {
    generated: number;
    accepted: number;
    passed: number;
    acceptanceRate: number;
  };
  activity: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
  };
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        // Fetch users data
        const usersResponse = await api.get('/admin/users', { params: { page: 1, limit: 1000 } });
        const users = usersResponse.data.users;

        // Calculate metrics
        const totalUsers = users.length;
        const activeUsers = users.filter((u: any) => u.status === 'active').length;
        const suspendedUsers = users.filter((u: any) => u.status === 'suspended').length;

        // Users created this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = users.filter((u: any) => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= startOfMonth;
        }).length;

        // Active in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyActive = users.filter((u: any) => {
          if (!u.lastActive) return false;
          return new Date(u.lastActive) >= thirtyDaysAgo;
        }).length;

        // Active in last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const dailyActive = users.filter((u: any) => {
          if (!u.lastActive) return false;
          return new Date(u.lastActive) >= oneDayAgo;
        }).length;

        setAnalytics({
          users: {
            total: totalUsers,
            active: activeUsers,
            newThisMonth,
            suspended: suspendedUsers,
          },
          matches: {
            generated: 0, // Would need to query matches
            accepted: 0,
            passed: 0,
            acceptanceRate: 0,
          },
          activity: {
            dailyActiveUsers: dailyActive,
            monthlyActiveUsers: monthlyActive,
          },
        });
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of platform metrics and user activity
        </p>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">User Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.users.total}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.users.active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.users.newThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                New user signups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activity.dailyActiveUsers}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activity.monthlyActiveUsers}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <h2 className="text-xl font-semibold mb-4">User Status</h2>
        <Card>
          <CardHeader>
            <CardTitle>Account Status Distribution</CardTitle>
            <CardDescription>Breakdown of user account statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <div className="text-sm font-bold">{analytics.users.active}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">Suspended</span>
                </div>
                <div className="text-sm font-bold">{analytics.users.suspended}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle>Platform Engagement</CardTitle>
            <CardDescription>User engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Daily Active Rate</span>
                  <span className="text-sm font-bold">
                    {analytics.users.total > 0
                      ? Math.round((analytics.activity.dailyActiveUsers / analytics.users.total) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: analytics.users.total > 0
                        ? `${(analytics.activity.dailyActiveUsers / analytics.users.total) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Active Rate</span>
                  <span className="text-sm font-bold">
                    {analytics.users.total > 0
                      ? Math.round((analytics.activity.monthlyActiveUsers / analytics.users.total) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: analytics.users.total > 0
                        ? `${(analytics.activity.monthlyActiveUsers / analytics.users.total) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
