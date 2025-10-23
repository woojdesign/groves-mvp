import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sprout, Settings, Pause } from 'lucide-react';
import { Button } from './ui/button';
import MatchCard from './MatchCard';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { GlassCard } from './ui/glass-card';
import { IconBadge } from './ui/icon-badge';
import { LoadingCard } from './ui/loading-spinner';
import { ErrorMessage } from './ui/error-message';
import { EmptyState } from './ui/empty-state';
import { fadeInUp, fadeIn, scaleIn, transitions, easings } from '@/lib/animations';
import { getMatches } from '@/lib/apiService';
import type { Match, ApiError } from '@/types/api';

interface DashboardProps {
  userName?: string;
  onMatchAction?: (match: any, action: 'accept' | 'pass') => void;
}

export default function Dashboard({ userName, onMatchAction }: DashboardProps) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const currentMatch = matches[currentMatchIndex];
  const hasMoreMatches = currentMatchIndex < matches.length - 1;

  // Fetch matches on mount
  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMatches(10, 'pending');
      setMatches(response.matches);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: 'accept' | 'pass', mutualMatch: boolean = false) => {
    // Call parent handler if provided (for backward compatibility)
    if (onMatchAction) {
      onMatchAction(currentMatch, action);
    }

    // If passed or accepted (but not mutual), show next match
    if (!mutualMatch && hasMoreMatches) {
      setTimeout(() => {
        setCurrentMatchIndex(currentMatchIndex + 1);
      }, 600);
    } else if (!mutualMatch && !hasMoreMatches) {
      // Remove the last match from list to show empty state
      setMatches([]);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.normal}
          className="mb-8 sm:mb-16"
        >
          {/* Top row - Logo and greeting */}
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-accent/15 to-secondary/10 flex items-center justify-center shadow-lg shadow-secondary/10 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                <Sprout className="relative w-6 h-6 sm:w-8 sm:h-8 text-secondary" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate">Hey{userName ? `, ${userName}` : ''}</h1>
                <p className="text-sm sm:text-base text-muted-foreground/80 mt-1 sm:mt-2">We found some lovely people for you to meet</p>
              </div>
            </div>

            {/* Settings icon - mobile only */}
            <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 sm:w-14 sm:h-14 hover:bg-accent/10 flex-shrink-0 sm:hidden ml-2">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>

          {/* Bottom row - Controls */}
          <div className="flex items-center justify-between gap-3 sm:gap-5">
            <div className="flex items-center gap-2 sm:gap-4 bg-card/60 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-border/50 shadow-sm">
              <Pause className="w-4 h-4 text-muted-foreground/70 flex-shrink-0" strokeWidth={1.5} />
              <Switch
                checked={paused}
                onCheckedChange={setPaused}
                id="pause-matches"
              />
              <Label htmlFor="pause-matches" className="text-sm cursor-pointer text-foreground/80 tracking-wide whitespace-nowrap">
                {paused ? 'Paused' : 'Active'}
              </Label>
            </div>
            
            {/* Settings icon - desktop only */}
            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14 hover:bg-accent/10 hidden sm:flex flex-shrink-0">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
        </motion.div>

        {/* Match Card */}
        {loading ? (
          <LoadingCard message="Finding your matches..." />
        ) : error ? (
          <ErrorMessage error={error} onRetry={fetchMatches} title="Couldn't load matches" />
        ) : currentMatch && !paused ? (
          <MatchCard match={currentMatch} onAction={handleAction} />
        ) : paused ? (
          <motion.div
            {...scaleIn}
            transition={transitions.normal}
          >
            <GlassCard variant="premium" withGlow={false} className="p-8 sm:p-12 lg:p-16 text-center">
            <IconBadge icon={Pause} size="lg" className="inline-flex mb-6 sm:mb-8" />
            <h2 className="mb-3 sm:mb-4 tracking-tight">Taking a break</h2>
            <p className="max-w-md mx-auto text-muted-foreground/80 leading-relaxed">
              Matches are paused. Toggle "Active" above when you\'re ready to meet new people.
            </p>
            </GlassCard>
          </motion.div>
        ) : (
          <EmptyState
            icon={Sprout}
            title="You're all caught up"
            description="We'll find more wonderful matches for you soon. Check back in a few days."
          />
        )}

        {/* Privacy reminder */}
        <motion.p
          {...fadeIn}
          transition={{ delay: 0.4, ...transitions.normal }}
          className="text-center text-xs text-muted-foreground/60 mt-12 tracking-wide leading-relaxed"
        >
          All introductions are double opt-in — no one knows unless you both say yes
        </motion.p>
      </div>
    </div>
  );
}
