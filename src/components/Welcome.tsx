import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, Mail } from 'lucide-react';
import { Button, ButtonShimmer } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GlassCard } from './ui/glass-card';
import { IconBadge } from './ui/icon-badge';
import { ErrorBanner } from './ui/error-message';
import { fadeInUp, scaleIn, transitions } from '@/lib/animations';
import { requestMagicLink } from '@/lib/apiService';
import type { ApiError } from '@/types/api';

interface WelcomeProps {
  onJoin?: (email: string, name: string) => void;
}

export default function Welcome({ onJoin }: WelcomeProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    try {
      setLoading(true);
      setError(null);

      // Request magic link from backend
      await requestMagicLink(email);

      // Show success state
      setSent(true);

      // For backward compatibility with old App.tsx flow (dev mode)
      if (onJoin) {
        setTimeout(() => {
          onJoin(email, name);
        }, 2000);
      }
    } catch (err) {
      console.error('Magic link request failed:', err);
      const apiError = err as ApiError;

      // Handle specific error cases
      if (apiError.statusCode === 403) {
        setError('Your email domain is not authorized. Please use your work email.');
      } else if (apiError.statusCode === 429) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else if (apiError.details && apiError.details.length > 0) {
        setError(apiError.details[0].message);
      } else {
        setError(apiError.message || 'Failed to send magic link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        {...fadeInUp}
        transition={transitions.slower}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-20">
          <motion.div
            {...scaleIn}
            transition={{ delay: 0.2, ...transitions.slow }}
            className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-accent/15 to-secondary/10 mb-10 shadow-lg shadow-secondary/10"
          >
            {/* Inner glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
            <Sprout className="relative w-11 h-11 text-secondary" strokeWidth={1.5} />
          </motion.div>
          <h1 className="mb-8">commonplace</h1>
          <p className="max-w-md mx-auto text-muted-foreground text-lg leading-relaxed">
            Spark meaningful connections with people in your organization who share your interests and curiosities.
          </p>
        </div>

        {!sent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {error && (
              <AnimatePresence>
                <div className="mb-6">
                  <ErrorBanner error={error} onDismiss={() => setError(null)} />
                </div>
              </AnimatePresence>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <GlassCard className="p-12">
                <div className="space-y-8">
                  <div>
                    <Label htmlFor="name" className="mb-4 block text-foreground/80 text-sm tracking-wide uppercase text-[11px] font-medium">
                      Your name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Alex Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-2xl h-14 bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/70 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all text-base"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-4 block text-foreground/80 text-sm tracking-wide uppercase text-[11px] font-medium">
                      Work email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-2xl h-14 bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/70 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all text-base"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/70 mt-8 leading-relaxed tracking-wide">
                  Your answers are private — only used to find better matches.
                </p>
              </GlassCard>

              <Button
                type="submit"
                variant="premium"
                className="w-full rounded-2xl h-16 text-base"
                disabled={loading}
              >
                <span className="relative z-10">
                  {loading ? 'Sending magic link...' : 'Join commonplace'}
                </span>
                <ButtonShimmer />
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            {...scaleIn}
            transition={transitions.normal}
          >
            <GlassCard variant="premium" withGlow={false} className="p-12 text-center">
            <IconBadge icon={Mail} size="lg" className="inline-flex mb-6" />
            <p className="mb-3 text-lg">Check your email</p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              We sent a magic link to <span className="text-foreground">{email}</span>
            </p>
            </GlassCard>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground/60 mt-12 tracking-wide">
          Warm, trustworthy connections for your organization
        </p>
      </motion.div>
    </div>
  );
}
