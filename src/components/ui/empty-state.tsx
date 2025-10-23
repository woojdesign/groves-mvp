/**
 * Empty State Component
 *
 * Display empty states with optional action button
 */

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { GlassCard } from './glass-card';
import { IconBadge } from './icon-badge';
import { scaleIn, transitions } from '@/lib/animations';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      {...scaleIn}
      transition={transitions.normal}
      className={className}
    >
      <GlassCard variant="premium" withGlow={false} className="p-12 sm:p-16 text-center">
        <IconBadge icon={Icon} size="lg" className="inline-flex mb-8" />

        <h2 className="mb-4 tracking-tight">{title}</h2>

        <p className="max-w-md mx-auto text-muted-foreground/80 leading-relaxed mb-8">
          {description}
        </p>

        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            variant="premium"
            className="rounded-2xl h-12 px-8"
          >
            {actionLabel}
          </Button>
        )}
      </GlassCard>
    </motion.div>
  );
}
