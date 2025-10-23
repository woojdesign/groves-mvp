import { useState, useEffect } from 'react';
import { api } from '../../lib/apiService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { ErrorMessage } from '../../components/ui/error-message';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  domain: string;
  ssoEnabled: boolean;
  ssoProvider: string | null;
  samlEntryPoint: string | null;
  samlIssuer: string | null;
  samlCert: string | null;
  oidcIssuer: string | null;
  oidcClientId: string | null;
  createdAt: string;
}

export function OrganizationSettings() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    ssoEnabled: false,
  });

  useEffect(() => {
    async function fetchOrganization() {
      try {
        setLoading(true);
        const response = await api.get<Organization>('/admin/organization');
        setOrg(response.data);
        setFormData({
          name: response.data.name,
          ssoEnabled: response.data.ssoEnabled,
        });
      } catch (err: any) {
        console.error('Failed to fetch organization:', err);
        setError(err?.message || 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/organization', formData);
      toast.success('Organization settings updated successfully');

      // Refetch to get updated data
      const response = await api.get<Organization>('/admin/organization');
      setOrg(response.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" message="Loading organization settings..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!org) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization configuration
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={org.domain}
              disabled
              className="text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Domain cannot be changed after creation
            </p>
          </div>
          <div className="space-y-2">
            <Label>Organization ID</Label>
            <Input
              value={org.id}
              disabled
              className="font-mono text-xs text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label>Created</Label>
            <Input
              value={new Date(org.createdAt).toLocaleString()}
              disabled
              className="text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* SSO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Single Sign-On (SSO)</CardTitle>
          <CardDescription>
            Configure SAML 2.0 or OIDC authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SSO</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in with enterprise SSO
              </p>
            </div>
            <Switch
              checked={formData.ssoEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, ssoEnabled: checked })}
            />
          </div>

          {org.ssoProvider && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>SSO Provider</Label>
                <Input
                  value={org.ssoProvider.toUpperCase()}
                  disabled
                  className="text-muted-foreground"
                />
              </div>

              {org.ssoProvider === 'saml' && (
                <>
                  <div className="space-y-2">
                    <Label>SAML Entry Point</Label>
                    <Input
                      value={org.samlEntryPoint || 'Not configured'}
                      disabled
                      className="text-muted-foreground text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SAML Issuer</Label>
                    <Input
                      value={org.samlIssuer || 'Not configured'}
                      disabled
                      className="text-muted-foreground"
                    />
                  </div>
                </>
              )}

              {org.ssoProvider === 'oidc' && (
                <>
                  <div className="space-y-2">
                    <Label>OIDC Issuer</Label>
                    <Input
                      value={org.oidcIssuer || 'Not configured'}
                      disabled
                      className="text-muted-foreground text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OIDC Client ID</Label>
                    <Input
                      value={org.oidcClientId || 'Not configured'}
                      disabled
                      className="text-muted-foreground"
                    />
                  </div>
                </>
              )}

              <p className="text-xs text-muted-foreground">
                SSO provider details are configured automatically during first SSO login.
                Contact support to reconfigure SSO settings.
              </p>
            </div>
          )}

          {!org.ssoProvider && formData.ssoEnabled && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                SSO is enabled but not configured. Users can initiate SSO login from the login page,
                which will automatically configure the SSO provider details on first use.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
