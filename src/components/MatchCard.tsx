import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Sparkles } from 'lucide-react';
import { Button, ButtonShimmer } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { GlassCard } from './ui/glass-card';
import { ErrorBanner } from './ui/error-message';
import { fadeInUp, scaleIn, transitions, easings } from '../lib/animations';
import { acceptMatch, passMatch } from '../lib/apiService';
import type { Match, ApiError } from '../types/api';

interface MatchCardProps {
  match: Match;
  onAction: (action: 'accept' | 'pass', mutualMatch?: boolean) => void;
}

export default function MatchCard({ match, onAction }: MatchCardProps) {
  const [actionTaken, setActionTaken] = useState<'accept' | 'pass' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutualMatch, setMutualMatch] = useState(false);

  const handleAction = async (action: 'accept' | 'pass') => {
    try {
      setLoading(true);
      setError(null);
      setActionTaken(action);

      let result;
      if (action === 'accept') {
        result = await acceptMatch(match.id);

        // Check if it's a mutual match
        if (result.mutualMatch) {
          setMutualMatch(true);

          // Show mutual match message for longer
          setTimeout(() => {
            onAction(action, true);
          }, 3000);
          return;
        }
      } else {
        result = await passMatch(match.id);
      }

      // Proceed to next match after animation
      setTimeout(() => {
        onAction(action, false);
      }, 600);
    } catch (err) {
      console.error(`Failed to ${action} match:`, err);
      const apiError = err as ApiError;
      setError(apiError.message || `Failed to ${action} match. Please try again.`);
      setActionTaken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: actionTaken ? 0 : 1,
        y: actionTaken ? -20 : 0,
        scale: actionTaken ? 0.96 : 1
      }}
      transition={{ duration: 0.4, ease: easings.premium }}
      className="relative"
    >
      {error && (
        <div className="mb-6">
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <GlassCard withAccent className="p-6 sm:p-10 lg:p-14">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0 relative mx-auto md:mx-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-accent/25 to-secondary/20 overflow-hidden shadow-xl shadow-secondary/10 ring-1 ring-white/10">
              <ImageWithFallback
                src=""
                alt={match.candidate.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
              <div>
                <h3 className="mb-2 sm:mb-3">{match.candidate.name}</h3>
                <p className="text-sm sm:text-base text-muted-foreground/80">{match.candidate.role || 'Team member'}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 text-secondary bg-gradient-to-br from-accent/20 to-accent/10 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 shadow-md shadow-accent/10 ring-1 ring-accent/20 flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
                <span className="text-xs tracking-wider uppercase font-medium">Suggested</span>
              </div>
            </div>

            {/* Context */}
            <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-accent/20 shadow-sm">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              <p className="relative text-sm sm:text-base italic text-secondary leading-relaxed">
                "{match.context}"
              </p>
            </div>

            {/* Interests */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10">
              {match.interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-foreground/8 text-foreground/90 border border-foreground/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-foreground/12 transition-all duration-200"
                >
                  {interest}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => handleAction('pass')}
                variant="outline"
                className="flex-1 rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-base transition-all duration-300 border-border/50 hover:border-border hover:bg-accent/8 hover:shadow-lg"
                disabled={loading || !!actionTaken}
              >
                <X className="w-4 h-4 mr-2" strokeWidth={1.5} />
                <span className="hidden sm:inline">Maybe later</span>
                <span className="sm:hidden">Pass</span>
              </Button>
              <Button
                onClick={() => handleAction('accept')}
                variant="premium"
                className="flex-1 rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-base"
                disabled={loading || !!actionTaken}
              >
                <span className="relative z-10 flex items-center">
                  <Heart className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{loading ? 'Connecting...' : "I'd love to connect"}</span>
                  <span className="sm:hidden">{loading ? 'Connecting...' : 'Connect'}</span>
                </span>
                <ButtonShimmer />
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Acceptance confirmation overlay */}
      {actionTaken === 'accept' && !mutualMatch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-accent/10 backdrop-blur-md rounded-2xl sm:rounded-3xl flex items-center justify-center p-4"
        >
          <motion.div
            {...scaleIn}
            transition={{ delay: 0.1, ...transitions.normal }}
            className="max-w-md"
          >
            <GlassCard variant="subtle" withGlow={false} className="p-8 sm:p-10 text-center">
              <div className="w-20 h-20 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Heart className="w-8 h-8 text-secondary" strokeWidth={1.5} />
              </div>
              <p className="text-foreground/90 leading-relaxed text-lg">Your interest has been noted. We'll let you know if they accept too!</p>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Mutual match celebration overlay */}
      {mutualMatch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-accent/15 to-secondary/10 backdrop-blur-md rounded-2xl sm:rounded-3xl flex items-center justify-center p-4"
        >
          <motion.div
            {...scaleIn}
            transition={{ delay: 0.1, ...transitions.normal }}
            className="max-w-md"
          >
            <GlassCard variant="subtle" withGlow={false} className="p-8 sm:p-10 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Heart className="w-8 h-8 text-secondary fill-secondary" strokeWidth={1.5} />
              </motion.div>
              <h3 className="mb-3 text-xl">It's a match!</h3>
              <p className="text-foreground/90 leading-relaxed">Check your email for an introduction to {match.candidate.name.split(' ')[0]} 🌿</p>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
