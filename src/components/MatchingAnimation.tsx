import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchingAnimationProps {
  onComplete: () => void;
}

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  matched: boolean;
  broadCluster?: number;
  finalCluster?: number;
  color: string;
}

// Semantic interest words for matching (expanded)
const INTEREST_WORDS = [
  'hiking', 'photography', 'cooking', 'meditation', 'jazz',
  'startups', 'sustainability', 'travel', 'reading', 'pottery',
  'cycling', 'design', 'volunteering', 'yoga', 'gardening',
  'film', 'writing', 'running', 'coffee', 'art',
  'music', 'tech', 'nature', 'wellness', 'learning',
  'climbing', 'painting', 'baking', 'mindfulness', 'theater',
  'investing', 'climate', 'backpacking', 'poetry', 'ceramics',
  'swimming', 'architecture', 'mentoring', 'pilates', 'farming',
  'documentary', 'blogging', 'marathon', 'tea', 'sculpture'
];

// Broad category clusters (first stage)
const BROAD_CLUSTERS = [
  ['hiking', 'cycling', 'running', 'nature', 'climbing', 'backpacking', 'swimming', 'marathon'], // Outdoor/Active
  ['photography', 'art', 'design', 'film', 'writing', 'painting', 'architecture', 'documentary', 'blogging', 'sculpture'], // Creative
  ['meditation', 'yoga', 'wellness', 'mindfulness', 'pilates'], // Wellness
  ['cooking', 'coffee', 'pottery', 'gardening', 'baking', 'ceramics', 'farming', 'tea'], // Culinary/Craft
  ['music', 'jazz', 'reading', 'learning', 'travel', 'theater', 'poetry'], // Culture/Learning
  ['startups', 'tech', 'volunteering', 'sustainability', 'investing', 'climate', 'mentoring'] // Professional
];

// Specific matched interests (second stage - refined)
const FINAL_CLUSTERS = [
  ['hiking', 'nature', 'cycling', 'climbing'], // Matched outdoor interests
  ['photography', 'art', 'design', 'painting'], // Matched creative interests
  ['meditation', 'yoga', 'wellness', 'mindfulness'], // Matched wellness interests
  ['cooking', 'coffee', 'pottery', 'baking'] // Matched culinary interests
];

// Warm, nature-inspired color palette with vibrant contrast
const WORD_COLORS = [
  '#c2674a', // terracotta red
  '#4a7c59', // forest green
  '#8b5a3c', // rich brown
  '#d4a574', // warm gold
  '#5b7c8d', // slate blue
  '#a15c38', // rust
  '#6b8e7f', // sage green
  '#b8764d', // copper
  '#4d6f7c', // deep teal
  '#c77d4a', // burnt orange
  '#7a5c4e', // coffee
  '#5d8a72', // emerald
  '#9d6b53', // clay
  '#4e7d91', // ocean blue
  '#b15d3f', // brick red
  '#6f9c8a', // seafoam
  '#a87c5a', // caramel
  '#5a6f8e', // denim blue
  '#c68a5c', // amber
  '#6d8373', // moss
  '#8e5d4a', // chestnut
  '#5b8d9a', // teal
  '#b97553', // bronze
  '#5f7a6e', // pine
  '#a66e4f', // sienna
];

export default function MatchingAnimation({ onComplete }: MatchingAnimationProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [phase, setPhase] = useState<'floating' | 'first-cluster' | 'second-cluster' | 'coalesce' | 'complete'>('floating');
  const [showMessage, setShowMessage] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Finding your connections');

  // Initialize words with random positions and colors
  useEffect(() => {
    const initialWords = INTEREST_WORDS.map((text, index) => ({
      id: index,
      text,
      x: Math.random() * 80 + 10, // 10-90% of width
      y: Math.random() * 80 + 10, // 10-90% of height
      matched: false,
      broadCluster: undefined,
      finalCluster: undefined,
      color: WORD_COLORS[index % WORD_COLORS.length]
    }));
    setWords(initialWords);
  }, []);

  // Animation sequence
  useEffect(() => {
    if (words.length === 0) return;

    // Phase 1: Float for 2 seconds
    const floatTimer = setTimeout(() => {
      setPhase('first-cluster');
      setStatusMessage('Identifying common themes');
      
      // Assign broad category clusters
      const updatedWords = words.map(word => {
        const broadIndex = BROAD_CLUSTERS.findIndex(cluster => 
          cluster.includes(word.text)
        );
        
        if (broadIndex !== -1) {
          return { ...word, broadCluster: broadIndex };
        }
        return word;
      });
      
      setWords(updatedWords);
    }, 2000);

    // Phase 2: First clustering complete, start refining (2.5 seconds later)
    const refineTimer = setTimeout(() => {
      setPhase('second-cluster');
      setStatusMessage('Refining your matches');
      
      // Assign final specific clusters, fade out non-matching words
      setWords(prevWords => prevWords.map(word => {
        const finalIndex = FINAL_CLUSTERS.findIndex(cluster => 
          cluster.includes(word.text)
        );
        
        if (finalIndex !== -1) {
          return { ...word, matched: true, finalCluster: finalIndex };
        }
        return { ...word, matched: false };
      }));
    }, 4500);

    // Phase 3: Coalesce matched clusters (2 seconds later)
    const coalesceTimer = setTimeout(() => {
      setPhase('coalesce');
      setStatusMessage('We found your people');
    }, 6500);

    // Phase 4: Show completion message (2 seconds later)
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      setShowMessage(true);
    }, 8500);

    // Phase 5: Auto-advance to dashboard (3 seconds later)
    const advanceTimer = setTimeout(() => {
      onComplete();
    }, 11500);

    return () => {
      clearTimeout(floatTimer);
      clearTimeout(refineTimer);
      clearTimeout(coalesceTimer);
      clearTimeout(completeTimer);
      clearTimeout(advanceTimer);
    };
  }, [words.length, onComplete]);

  // Calculate broad cluster positions (stage 1 - spread around screen)
  const getBroadClusterPosition = (clusterIndex: number) => {
    const positions = [
      { x: 25, y: 25 },  // Top left
      { x: 75, y: 25 },  // Top right
      { x: 50, y: 35 },  // Top center
      { x: 25, y: 65 },  // Bottom left
      { x: 75, y: 65 },  // Bottom right
      { x: 50, y: 75 }   // Bottom center
    ];
    return positions[clusterIndex] || { x: 50, y: 50 };
  };

  // Calculate final cluster positions (stage 2 - tighter, more focused)
  const getFinalClusterPosition = (clusterIndex: number) => {
    const positions = [
      { x: 35, y: 40 },
      { x: 65, y: 40 },
      { x: 35, y: 60 },
      { x: 65, y: 60 }
    ];
    return positions[clusterIndex] || { x: 50, y: 50 };
  };

  // Calculate coalesced positions (stage 3 - very tight, final grouping)
  const getCoalescePosition = (clusterIndex: number) => {
    const positions = [
      { x: 30, y: 45 },
      { x: 70, y: 45 },
      { x: 30, y: 60 },
      { x: 70, y: 60 }
    ];
    return positions[clusterIndex] || { x: 50, y: 50 };
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      {/* Animated gradient background - more vibrant for matching page */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(194, 103, 74, 0.25) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(74, 124, 89, 0.22) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(91, 124, 141, 0.20) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 30%, rgba(212, 165, 116, 0.25) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 70%, rgba(139, 90, 60, 0.22) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(194, 103, 74, 0.25) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* Connecting lines between clustered words */}
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ width: '100vw', height: '100vh', zIndex: 1 }}
      >
        {(phase === 'first-cluster' || phase === 'second-cluster' || phase === 'coalesce' || phase === 'complete') && 
          words.map((word, i) => {
            // Draw lines to other words in the same cluster
            const currentCluster = phase === 'first-cluster' 
              ? word.broadCluster 
              : word.finalCluster;
            
            if (currentCluster === undefined) return null;
            
            return words.slice(i + 1).map((otherWord, j) => {
              const otherCluster = phase === 'first-cluster'
                ? otherWord.broadCluster
                : otherWord.finalCluster;
              
              if (currentCluster !== otherCluster) return null;
              
              // Calculate positions as percentages
              let pos1 = { x: word.x, y: word.y };
              let pos2 = { x: otherWord.x, y: otherWord.y };
              
              if (phase === 'first-cluster' && word.broadCluster !== undefined) {
                pos1 = getBroadClusterPosition(word.broadCluster);
                pos2 = getBroadClusterPosition(otherWord.broadCluster!);
              } else if (phase === 'second-cluster' && word.finalCluster !== undefined) {
                pos1 = getFinalClusterPosition(word.finalCluster);
                pos2 = getFinalClusterPosition(otherWord.finalCluster!);
              } else if ((phase === 'coalesce' || phase === 'complete') && word.finalCluster !== undefined) {
                pos1 = getCoalescePosition(word.finalCluster);
                pos2 = getCoalescePosition(otherWord.finalCluster!);
              }
              
              const isInFinalCluster = (phase === 'second-cluster' || phase === 'coalesce' || phase === 'complete') && word.matched;
              const isCoalescing = (phase === 'coalesce' || phase === 'complete') && word.matched;
              
              return (
                <motion.line
                  key={`${word.id}-${otherWord.id}`}
                  x1={`${pos1.x}%`}
                  y1={`${pos1.y}%`}
                  x2={`${pos2.x}%`}
                  y2={`${pos2.y}%`}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: isCoalescing ? 0.4 : isInFinalCluster ? 0.3 : 0.15,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.2,
                    ease: 'easeOut'
                  }}
                  stroke={word.color}
                  strokeWidth={isCoalescing ? 2.5 : isInFinalCluster ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                />
              );
            });
          })}
      </svg>

      {/* Floating and clustering words with swarm motion */}
      <motion.div 
        className="absolute inset-0 pointer-events-none" 
        style={{ zIndex: 2 }}
        animate={phase === 'floating' ? {
          x: [0, 30, -20, 40, -30, 20, 0],
          y: [0, -25, 35, -30, 40, -20, 0],
        } : {
          x: 0,
          y: 0
        }}
        transition={{
          duration: 25,
          repeat: phase === 'floating' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <AnimatePresence>
          {words.map((word) => {
            // Determine if word should fade based on phase
            const shouldFade = !word.matched && (phase === 'second-cluster' || phase === 'coalesce' || phase === 'complete');
            
            // Calculate position based on current phase
            let targetPosition = { x: word.x, y: word.y };
            
            if (phase === 'first-cluster' && word.broadCluster !== undefined) {
              targetPosition = getBroadClusterPosition(word.broadCluster);
            } else if (phase === 'second-cluster' && word.finalCluster !== undefined) {
              targetPosition = getFinalClusterPosition(word.finalCluster);
            } else if ((phase === 'coalesce' || phase === 'complete') && word.finalCluster !== undefined) {
              targetPosition = getCoalescePosition(word.finalCluster);
            } else if (phase === 'first-cluster' && word.broadCluster === undefined) {
              // Words not in broad clusters drift to edges
              targetPosition = { 
                x: word.x > 50 ? 95 : 5, 
                y: word.y 
              };
            }

            // Visual state based on phase
            const isInBroadCluster = phase === 'first-cluster' && word.broadCluster !== undefined;
            const isInFinalCluster = (phase === 'second-cluster' || phase === 'coalesce' || phase === 'complete') && word.matched;
            const isCoalescing = (phase === 'coalesce' || phase === 'complete') && word.matched;

            return (
              <motion.div
                key={word.id}
                initial={{ 
                  x: `${word.x}vw`, 
                  y: `${word.y}vh`,
                  opacity: 0,
                  scale: 0.8
                }}
                animate={{
                  x: `${targetPosition.x}vw`,
                  y: `${targetPosition.y}vh`,
                  opacity: shouldFade ? 0 : 1,
                  scale: shouldFade ? 0.5 : (isCoalescing ? 1.2 : isInFinalCluster ? 1.15 : isInBroadCluster ? 1.05 : 1),
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{
                  duration: phase === 'floating' ? 0.8 : (phase === 'coalesce' ? 1.5 : 1.2),
                  delay: phase === 'floating' ? word.id * 0.02 : 0,
                  type: 'spring',
                  stiffness: phase === 'coalesce' ? 80 : phase === 'second-cluster' ? 60 : 50,
                  damping: phase === 'coalesce' ? 25 : 20
                }}
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                }}
              >
                <motion.div
                  animate={{
                    y: phase === 'floating' ? [0, -15, 0] : 0,
                  }}
                  transition={{
                    duration: 3 + (word.id % 3),
                    repeat: phase === 'floating' ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full backdrop-blur-md transition-all duration-500"
                  style={{
                    backgroundColor: isCoalescing
                      ? `${word.color}50`
                      : isInFinalCluster
                      ? `${word.color}40` 
                      : isInBroadCluster
                      ? `${word.color}25`
                      : `${word.color}15`,
                    boxShadow: isCoalescing
                      ? `0 15px 40px -5px ${word.color}45, 0 0 30px -3px ${word.color}30, inset 0 2px 4px ${word.color}30`
                      : isInFinalCluster
                      ? `0 10px 30px -5px ${word.color}35, 0 0 20px -5px ${word.color}20, inset 0 1px 2px ${word.color}25` 
                      : isInBroadCluster
                      ? `0 5px 20px -5px ${word.color}20, inset 0 1px 1px ${word.color}15`
                      : `0 2px 8px -2px ${word.color}10`
                  }}
                >
                  <motion.span
                    animate={{
                      color: isCoalescing ? word.color : isInFinalCluster ? word.color : isInBroadCluster ? `${word.color}e6` : `${word.color}d9`,
                      textShadow: isCoalescing ? `0 2px 4px ${word.color}40` : isInFinalCluster ? `0 1px 2px ${word.color}30` : 'none'
                    }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      fontSize: isCoalescing ? 'clamp(0.75rem, 2vw, 1rem)' : isInFinalCluster ? 'clamp(0.7rem, 1.8vw, 0.9375rem)' : 'clamp(0.65rem, 1.6vw, 0.875rem)',
                      fontWeight: isCoalescing ? 600 : isInFinalCluster ? 550 : 500,
                      letterSpacing: '0.01em',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                      fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
                      textRendering: 'optimizeLegibility'
                    }}
                  >
                    {word.text}
                  </motion.span>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Center content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center w-full">
        <AnimatePresence mode="wait">
          {!showMessage ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Glass morphism card */}
              <motion.div 
                className="backdrop-blur-xl bg-card/40 border border-border/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl"
                animate={{
                  boxShadow: [
                    '0 20px 60px -12px rgba(160, 120, 85, 0.15)',
                    '0 20px 60px -12px rgba(212, 165, 116, 0.15)',
                    '0 20px 60px -12px rgba(160, 120, 85, 0.15)',
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <motion.h2 
                  key={statusMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="mb-3 sm:mb-4"
                >
                  {statusMessage}
                </motion.h2>
                
                <p className="text-muted-foreground max-w-md mx-auto mb-6 sm:mb-8 text-sm sm:text-base px-2">
                  {phase === 'floating' && 'We\'re analyzing shared interests, experiences, and goals to create meaningful matches'}
                  {phase === 'first-cluster' && 'Grouping similar interests and values together'}
                  {phase === 'second-cluster' && 'Finding the strongest connections for you'}
                  {phase === 'coalesce' && 'Bringing your perfect matches together'}
                </p>

                {/* Animated dots */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-secondary"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                type: 'spring',
                stiffness: 100,
                damping: 15
              }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
                className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-xl shadow-accent/20"
              >
                <motion.svg
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.div>

              {/* Glass morphism card */}
              <motion.div 
                className="backdrop-blur-xl bg-card/50 border border-border/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="mb-3 sm:mb-4">
                  We found some matches
                </h2>
                
                <p className="text-muted-foreground max-w-md mx-auto mb-6 sm:mb-8 text-sm sm:text-base px-2">
                  People who share your interests and values, ready to connect
                </p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={onComplete}
                  className="
                    group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base
                    bg-gradient-to-br from-secondary to-accent
                    text-primary-foreground
                    shadow-lg shadow-secondary/25
                    transition-all duration-300
                    hover:shadow-xl hover:shadow-secondary/30
                    hover:scale-[1.02]
                    active:scale-[0.98]
                  "
                >
                  <span className="relative z-10">Let's see them</span>
                  
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
