import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Beaker,
  Users,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { PersonaGenerator } from './components/PersonaGenerator';
import { PersonaList } from './components/PersonaList';
import type { PersonaResponse } from '../../lib/devApiService';
import * as devApi from '../../lib/devApiService';

export function DevDashboardPage() {
  const [personas, setPersonas] = useState<PersonaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await devApi.listPersonas();
      setPersonas(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load personas');
      console.error('Failed to load personas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL test personas? This cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      const result = await devApi.deleteAllPersonas();
      setSuccess(`${result.message} (${result.count} personas deleted)`);
      await loadPersonas();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete personas');
      console.error('Failed to delete personas:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      const data = await devApi.exportPersonas();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grove-test-personas-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Exported ${data.count} personas successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export personas');
      console.error('Failed to export personas:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePersonaCreated = (newPersonas: PersonaResponse[]) => {
    setPersonas([...newPersonas, ...personas]);
    setSuccess(`Successfully created ${newPersonas.length} persona(s)`);
  };

  const handlePersonaDeleted = async (userId: string) => {
    setPersonas(personas.filter(p => p.id !== userId));
    setSuccess('Persona deleted successfully');
  };

  const stats = {
    total: personas.length,
    generated: personas.filter(p => p.embeddingStatus === 'generated').length,
    pending: personas.filter(p => p.embeddingStatus === 'pending').length,
    failed: personas.filter(p => p.embeddingStatus === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Beaker className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Dev Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Generate and manage test personas for development
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPersonas}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || personas.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAll}
            disabled={deleting || personas.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Embeddings Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats.generated}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{stats.failed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <Users className="h-4 w-4 mr-2" />
            Personas ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <PersonaList
            personas={personas}
            loading={loading}
            onRefresh={loadPersonas}
            onDelete={handlePersonaDeleted}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <PersonaGenerator onPersonasCreated={handlePersonaCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
