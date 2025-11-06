import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { CheckCircle2, Clock, AlertCircle, Trash2, Eye, Loader2 } from 'lucide-react';
import type { PersonaResponse, MatchPreview } from '../../../lib/devApiService';
import * as devApi from '../../../lib/devApiService';

interface PersonaListProps {
  personas: PersonaResponse[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (userId: string) => void;
}

export function PersonaList({ personas, loading, onRefresh, onDelete }: PersonaListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [matchPreview, setMatchPreview] = useState<{
    userId: string;
    loading: boolean;
    matches: MatchPreview[];
  } | null>(null);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete persona ${email}?`)) {
      return;
    }

    try {
      setDeleting(userId);
      await devApi.deletePersona(userId);
      onDelete(userId);
    } catch (err: any) {
      console.error('Failed to delete persona:', err);
      alert(err.response?.data?.message || 'Failed to delete persona');
    } finally {
      setDeleting(null);
    }
  };

  const handlePreviewMatches = async (userId: string) => {
    setMatchPreview({ userId, loading: true, matches: [] });

    try {
      const result = await devApi.previewMatches(userId, 10);
      setMatchPreview({
        userId,
        loading: false,
        matches: result.matches,
      });
    } catch (err: any) {
      console.error('Failed to preview matches:', err);
      alert(err.response?.data?.message || 'Failed to preview matches');
      setMatchPreview(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Generated
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (personas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">No test personas yet</p>
          <p className="text-sm text-muted-foreground">
            Generate personas using the templates above to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Test Personas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Connection Type</TableHead>
                <TableHead>Embedding</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell className="font-medium">{persona.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {persona.email}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm truncate" title={persona.interests}>
                      {persona.interests}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{persona.connectionType}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(persona.embeddingStatus)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(persona.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewMatches(persona.id)}
                        disabled={persona.embeddingStatus !== 'generated'}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Matches
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(persona.id, persona.email)}
                        disabled={deleting === persona.id}
                      >
                        {deleting === persona.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Match Preview Dialog */}
      <Dialog open={matchPreview !== null} onOpenChange={() => setMatchPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Preview</DialogTitle>
            <DialogDescription>
              Potential matches based on semantic similarity (dev personas only)
            </DialogDescription>
          </DialogHeader>

          {matchPreview?.loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {matchPreview?.matches.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No matches found. Generate more personas to see matches.
                </p>
              ) : (
                matchPreview?.matches.map((match, index) => (
                  <Card key={match.userId}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{index + 1}</span>
                            <span className="font-semibold">{match.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(match.similarityScore * 100).toFixed(1)}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{match.email}</p>
                          <p className="text-sm mt-2">{match.interests}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
