import { useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, Mail } from 'lucide-react';
import { Button, ButtonShimmer } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GlassCard } from './ui/glass-card';
import { IconBadge } from './ui/icon-badge';
import { fadeInUp, scaleIn, transitions } from '@/lib/animations';

interface WelcomeProps {
  onJoin: (email: string, name: string) => void;
}

export default function Welcome({ onJoin }: WelcomeProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setSent(true);
      // Simulate magic link sent, then auto-proceed after animation
      setTimeout(() => {
        onJoin(email, name);
      }, 2000);
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
              >
                <span className="relative z-10">Join commonplace</span>
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
