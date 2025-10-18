import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  cluster: number;
  color: string;
}

// 15 interest words as specified
const INTEREST_WORDS = [
  'hiking', 'photography', 'cooking', 'meditation', 'jazz',
  'startups', 'sustainability', 'travel', 'reading', 'pottery',
  'cycling', 'design', 'volunteering', 'yoga', 'gardening'
];

// Cluster definitions - words that should group together
const CLUSTERS = [
  ['hiking', 'cycling', 'travel'], // Outdoor/Active
  ['photography', 'design', 'pottery'], // Creative
  ['meditation', 'yoga', 'reading'], // Wellness/Mindful
  ['cooking', 'gardening', 'sustainability'], // Home/Nature
  ['startups', 'volunteering', 'jazz'] // Community/Social
];

// Color palette for words
const WORD_COLORS = [
  '#c2674a', // terracotta red
  '#4a7c59', // forest green
  '#8b5a3c', // rich brown
  '#d4a574', // warm gold
  '#5b7c8d', // slate blue
];

export default function ShowcaseLearn() {
  const [words, setWords] = useState<Word[]>([]);
  const [isFloating, setIsFloating] = useState(true);

  // Initialize words with random positions
  useEffect(() => {
    const initialWords = INTEREST_WORDS.map((text, index) => {
      // Find which cluster this word belongs to
      const clusterIndex = CLUSTERS.findIndex(cluster => cluster.includes(text));

      return {
        id: index,
        text,
        x: Math.random() * 80 + 10, // 10-90% of width
        y: Math.random() * 70 + 20, // 20-90% of height (respecting 60px safe area from top)
        cluster: clusterIndex,
        color: WORD_COLORS[clusterIndex % WORD_COLORS.length]
      };
    });
    setWords(initialWords);
  }, []);

  // 8-second continuous loop: float -> cluster -> float
  useEffect(() => {
    if (words.length === 0) return;

    const timer = setTimeout(() => {
      setIsFloating(prev => !prev);
    }, 4000); // Toggle every 4 seconds (4s floating + 4s clustered = 8s total)

    return () => clearTimeout(timer);
  }, [isFloating, words.length]);

  // Calculate cluster positions (arranged in a circle pattern)
  const getClusterPosition = (clusterIndex: number) => {
    const positions = [
      { x: 30, y: 40 },  // Top left
      { x: 70, y: 40 },  // Top right
      { x: 50, y: 50 },  // Center
      { x: 30, y: 70 },  // Bottom left
      { x: 70, y: 70 }   // Bottom right
    ];
    return positions[clusterIndex] || { x: 50, y: 50 };
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      {/* Animated gradient background - vibrant and flowing */}
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
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating and clustering words */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ paddingTop: '60px' }} // Safe area from top
      >
        {words.map((word) => {
          // Calculate target position based on current state
          const targetPosition = isFloating
            ? { x: word.x, y: word.y }
            : getClusterPosition(word.cluster);

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
                opacity: 1,
                scale: isFloating ? 1 : 1.15,
              }}
              transition={{
                duration: 2,
                type: 'spring',
                stiffness: isFloating ? 40 : 60,
                damping: 20
              }}
              className="absolute"
              style={{
                left: 0,
                top: 0,
              }}
            >
              <motion.div
                animate={{
                  y: isFloating ? [0, -15, 0] : 0,
                }}
                transition={{
                  duration: 3 + (word.id % 3),
                  repeat: isFloating ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full backdrop-blur-md transition-all duration-500"
                style={{
                  backgroundColor: isFloating
                    ? `${word.color}15`
                    : `${word.color}40`,
                  boxShadow: isFloating
                    ? `0 2px 8px -2px ${word.color}10`
                    : `0 10px 30px -5px ${word.color}35, 0 0 20px -5px ${word.color}20, inset 0 1px 2px ${word.color}25`
                }}
              >
                <motion.span
                  animate={{
                    color: isFloating ? `${word.color}d9` : word.color,
                    textShadow: isFloating ? 'none' : `0 1px 2px ${word.color}30`
                  }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    fontSize: isFloating ? 'clamp(0.65rem, 1.6vw, 0.875rem)' : 'clamp(0.7rem, 1.8vw, 0.9375rem)',
                    fontWeight: isFloating ? 500 : 550,
                    letterSpacing: '0.01em',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                  }}
                >
                  {word.text}
                </motion.span>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Center content - status message */}
      <div className="relative z-10 max-w-2xl mx-auto text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
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
              key={isFloating ? 'floating' : 'clustered'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-3 sm:mb-4"
            >
              {isFloating ? 'Discovering your interests' : 'Finding common ground'}
            </motion.h2>

            <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-2">
              {isFloating
                ? 'We analyze your unique interests and passions'
                : 'Connecting you with people who share your values'}
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent/30"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
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
