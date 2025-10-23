/**
 * Loading Spinner Component
 *
 * A beautiful, animated loading spinner that matches Grove's design system
 */

import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'md', className, message }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 className={cn(sizeClasses[size], 'text-secondary')} strokeWidth={1.5} />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-3xl p-12 shadow-xl">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
}

export function LoadingCard({ message }: { message?: string }) {
  return (
    <div className="w-full flex items-center justify-center py-20">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}
