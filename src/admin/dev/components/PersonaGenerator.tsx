import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Loader2, Sparkles, Plus, Upload } from 'lucide-react';
import type { PersonaResponse } from '../../../lib/devApiService';
import * as devApi from '../../../lib/devApiService';

interface PersonaGeneratorProps {
  onPersonasCreated: (personas: PersonaResponse[]) => void;
}

export function PersonaGenerator({ onPersonasCreated }: PersonaGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preset generation state
  const [presetTemplate, setPresetTemplate] = useState<string>('mixed_10');

  const handlePresetGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      const result = await devApi.generatePreset(presetTemplate as any);
      setJobId(result.jobId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate personas');
      console.error('Failed to generate personas:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let isActive = true;

    const clearPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const pollStatus = async () => {
      try {
        const status = await devApi.getPersonaGenerationJobStatus(jobId);
        if (!isActive) {
          return;
        }

        setProgress(Math.max(0, Math.min(100, status.progress ?? 0)));

        if (status.status === 'completed' && status.result) {
          clearPolling();
          onPersonasCreated(status.result.personas);
          setLoading(false);
          setJobId(null);
          setProgress(0);
        } else if (status.status === 'failed') {
          clearPolling();
          setError(status.error || 'Persona generation failed');
          setLoading(false);
          setJobId(null);
          setProgress(0);
        } else if (status.status === 'not_found') {
          clearPolling();
          setError('Generation job not found. Please try again.');
          setLoading(false);
          setJobId(null);
          setProgress(0);
        }
      } catch (pollError: any) {
        if (!isActive) {
          return;
        }
        console.error('Failed to poll persona generation status:', pollError);
        setError('Failed to check generation status. Please try again.');
        clearPolling();
        setLoading(false);
        setJobId(null);
        setProgress(0);
      }
    };

    pollStatus();
    pollingRef.current = setInterval(pollStatus, 2000);

    return () => {
      isActive = false;
      clearPolling();
    };
  }, [jobId, onPersonasCreated]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preset Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Templates</CardTitle>
          <CardDescription>
            Quickly generate test personas with predefined configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            <Select value={presetTemplate} onValueChange={setPresetTemplate}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual_10">10 Casual Hobbyists</SelectItem>
                <SelectItem value="engaged_10">10 Engaged Enthusiasts</SelectItem>
                <SelectItem value="deep_10">10 Deep Niche Experts</SelectItem>
                <SelectItem value="mixed_10">10 Mixed (Realistic)</SelectItem>
                <SelectItem value="diverse_50">50 Diverse Company</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {presetTemplate === 'casual_10' && 'Common hobbies without deep expertise (e.g., "I enjoy hiking")'}
              {presetTemplate === 'engaged_10' && 'Active pursuit with moderate depth (e.g., "Training for a half marathon")'}
              {presetTemplate === 'deep_10' && 'Specialized knowledge with technical depth (current seed.ts style)'}
              {presetTemplate === 'mixed_10' && '40% casual, 40% engaged, 20% deep niche'}
              {presetTemplate === 'diverse_50' && 'Large realistic batch across all categories and intensity levels'}
            </p>
          </div>

          <Button
            onClick={handlePresetGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating... {progress}%
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate from Template
              </>
            )}
          </Button>

          {loading && (
            <p className="text-sm text-muted-foreground">
              Keep this tab open while we generate personas. Progress updates every few seconds.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Custom Generation
            </CardTitle>
            <CardDescription>
              Configure count, intensity, and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </CardTitle>
            <CardDescription>
              Upload JSON/CSV file with personas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
