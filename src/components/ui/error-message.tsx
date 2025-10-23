/**
 * Error Message Component
 *
 * Display error messages with optional retry functionality
 */

import { motion } from 'motion/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { GlassCard } from './glass-card';
import { IconBadge } from './icon-badge';
import { fadeInUp, scaleIn, transitions } from '@/lib/animations';
import type { ApiError } from '@/types/api';

interface ErrorMessageProps {
  error: ApiError | Error | string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function ErrorMessage({ error, onRetry, title, className }: ErrorMessageProps) {
  const errorMessage = typeof error === 'string'
    ? error
    : 'message' in error
    ? error.message
    : 'An unexpected error occurred';

  const errorDetails = typeof error !== 'string' && 'details' in error
    ? error.details
    : undefined;

  return (
    <motion.div
      {...fadeInUp}
      transition={transitions.normal}
      className={className}
    >
      <GlassCard variant="subtle" className="p-8 sm:p-12 text-center">
        <IconBadge
          icon={AlertCircle}
          size="lg"
          className="inline-flex mb-6 bg-destructive/10 text-destructive"
        />

        <h3 className="mb-3 text-lg tracking-tight">
          {title || 'Something went wrong'}
        </h3>

        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-md mx-auto mb-6">
          {errorMessage}
        </p>

        {errorDetails && errorDetails.length > 0 && (
          <div className="mb-6 text-left max-w-md mx-auto">
            <ul className="text-xs text-muted-foreground/70 space-y-1">
              {errorDetails.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-destructive/70">•</span>
                  <span>{detail.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="rounded-xl h-11 px-6"
          >
            <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Try again
          </Button>
        )}
      </GlassCard>
    </motion.div>
  );
}

export function ErrorBanner({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3"
    >
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <p className="text-sm text-destructive/90 flex-1">{error}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-destructive/70 hover:text-destructive transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
