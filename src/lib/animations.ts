/**
 * Animation constants and reusable Framer Motion variants
 * Centralizes all animation timing, easing curves, and spring configurations
 */

// Animation easing curves
export const easings = {
  premium: [0.22, 1, 0.36, 1] as const, // Custom cubic bezier used throughout
  smooth: 'easeInOut' as const,
  bouncy: 'easeOut' as const,
  linear: 'linear' as const,
} as const;

// Animation durations (in seconds)
export const durations = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  premium: 1.2,
  ambient: 8,
} as const;

// Spring configurations for physics-based animations
export const springs = {
  gentle: { stiffness: 50, damping: 20 },
  moderate: { stiffness: 60, damping: 20 },
  snappy: { stiffness: 80, damping: 25 },
  bouncy: { stiffness: 100, damping: 15 },
} as const;

// Common animation variants for Framer Motion
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
};

// Standard transition configurations
export const transitions = {
  premium: { duration: durations.premium, ease: easings.premium },
  normal: { duration: durations.normal, ease: easings.premium },
  slow: { duration: durations.slow, ease: easings.premium },
  slower: { duration: durations.slower, ease: easings.premium },
  fast: { duration: durations.fast, ease: easings.premium },
  spring: { type: 'spring' as const, ...springs.moderate },
  springSnappy: { type: 'spring' as const, ...springs.snappy },
  springGentle: { type: 'spring' as const, ...springs.gentle },
} as const;

// Shimmer animation configuration for premium buttons
export const shimmerAnimation = {
  animate: {
    x: ['-100%', '100%'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    repeatDelay: 0.5,
  },
};

// Pulse animation for loading indicators
export const pulseAnimation = {
  animate: {
    scale: [1, 1.5, 1],
    opacity: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
  },
};
