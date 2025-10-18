import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { GlassCard } from '@/components/ui/glass-card';
import { easings } from '@/lib/animations';

const mockMatches = [
  {
    id: 1,
    name: 'Sam Rivera',
    role: 'Product Designer',
    sharedInterest: 'ceramics',
    context: 'You both mentioned ceramics — how lovely.',
    interests: ['Pottery', 'Sustainable design', 'Trail running'],
    image: 'avatar person'
  },
  {
    id: 2,
    name: 'Jordan Lee',
    role: 'Engineering Manager',
    sharedInterest: 'vintage synthesizers',
    context: 'Both of you are into vintage synthesizers and sound design.',
    interests: ['Music production', 'Modular synths', 'Coffee roasting'],
    image: 'avatar person'
  },
  {
    id: 3,
    name: 'Alex Chen',
    role: 'Community Organizer',
    sharedInterest: 'urban gardening',
    context: 'You both share a passion for urban gardening and sustainability.',
    interests: ['Community gardens', 'Composting', 'Local food'],
    image: 'avatar person'
  }
];

export default function ShowcaseConnect() {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showAcceptAnimation, setShowAcceptAnimation] = useState(false);

  const currentMatch = mockMatches[currentMatchIndex];

  // Auto-cycle through matches every 7 seconds
  useEffect(() => {
    // Show accept animation after 4 seconds
    const acceptTimer = setTimeout(() => {
      setShowAcceptAnimation(true);
    }, 4000);

    // Move to next match after 7 seconds total
    const cycleTimer = setTimeout(() => {
      setShowAcceptAnimation(false);
      setCurrentMatchIndex((prev) => (prev + 1) % mockMatches.length);
    }, 7000);

    return () => {
      clearTimeout(acceptTimer);
      clearTimeout(cycleTimer);
    };
  }, [currentMatchIndex]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-16 flex items-center justify-center">
      {/* Premium gradient background with depth */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />

        {/* Floating gradient orbs with animation */}
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-gradient-to-br from-accent/[0.08] to-secondary/[0.06] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-secondary/[0.1] to-accent/[0.05] rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        {/* Radial gradient overlay for vignette effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20" />
      </div>

      <div className="max-w-3xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: showAcceptAnimation ? 0.3 : 1,
              y: 0,
              scale: showAcceptAnimation ? 0.96 : 1
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: easings.premium }}
            className="relative"
          >
            <GlassCard withAccent className="p-6 sm:p-10 lg:p-14">
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-12 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0 relative mx-auto md:mx-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-accent/25 to-secondary/20 overflow-hidden shadow-xl shadow-secondary/10 ring-1 ring-white/10">
                    <ImageWithFallback
                      src=""
                      alt={currentMatch.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
                    <div>
                      <h3 className="mb-2 sm:mb-3">{currentMatch.name}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground/80">{currentMatch.role}</p>
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
                      "{currentMatch.context}"
                    </p>
                  </div>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10">
                    {currentMatch.interests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-foreground/8 text-foreground/90 border border-foreground/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>

                  {/* Auto-accept button animation */}
                  <motion.div
                    animate={{
                      scale: showAcceptAnimation ? [1, 1.05, 1] : 1,
                      backgroundColor: showAcceptAnimation
                        ? 'rgba(var(--secondary), 0.2)'
                        : 'transparent'
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-xl sm:rounded-2xl p-1"
                  >
                    <div className="flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-base bg-gradient-to-br from-secondary to-accent text-primary-foreground shadow-lg shadow-secondary/25">
                      <Heart className="w-4 h-4" strokeWidth={1.5} />
                      <span className="hidden sm:inline">I'd love to connect</span>
                      <span className="sm:hidden">Connect</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </GlassCard>

            {/* Acceptance confirmation overlay */}
            <AnimatePresence>
              {showAcceptAnimation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-accent/10 backdrop-blur-md rounded-2xl sm:rounded-3xl flex items-center justify-center p-4 z-10"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: easings.premium }}
                    className="max-w-md"
                  >
                    <GlassCard variant="subtle" withGlow={false} className="p-8 sm:p-10 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-20 h-20 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
                      >
                        <Heart className="w-8 h-8 text-secondary" strokeWidth={1.5} />
                      </motion.div>
                      <p className="text-foreground/90 leading-relaxed text-lg">
                        We'll make the intro — can't wait for you to meet {currentMatch.name.split(' ')[0]}
                      </p>
                    </GlassCard>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground/60 mt-12 tracking-wide leading-relaxed">
          All introductions are double opt-in — no one knows unless you both say yes
        </p>
      </div>
    </div>
  );
}
