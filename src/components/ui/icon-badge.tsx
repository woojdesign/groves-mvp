import { cn } from "./utils";
import { LucideIcon } from "lucide-react";

interface IconBadgeProps {
  /**
   * The Lucide icon component to render
   */
  icon: LucideIcon;

  /**
   * Size variant of the icon badge
   * - sm: 48x48 (w-12 h-12)
   * - md: 56x56 (w-14 h-14)
   * - lg: 64x64 desktop, 80x80 tablet (w-16 h-16 sm:w-20 sm:h-20)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Color variant of the icon badge
   * - accent: Uses accent/10 background with secondary text
   * - secondary: Uses secondary/10 background with secondary text
   * - muted: Uses muted/20 background with muted-foreground text
   */
  variant?: 'accent' | 'secondary' | 'muted';

  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-12 h-12', icon: 'w-6 h-6' },
  md: { container: 'w-14 h-14', icon: 'w-7 h-7' },
  lg: { container: 'w-16 h-16 sm:w-20 sm:h-20', icon: 'w-8 h-8 sm:w-10 sm:h-10' }
};

const variantMap = {
  accent: 'bg-accent/10 text-secondary',
  secondary: 'bg-secondary/10 text-secondary',
  muted: 'bg-muted/20 text-muted-foreground'
};

export function IconBadge({
  icon: Icon,
  size = 'md',
  variant = 'accent',
  className
}: IconBadgeProps) {
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center shadow-sm",
      sizeMap[size].container,
      variantMap[variant],
      className
    )}>
      <Icon className={cn(sizeMap[size].icon)} strokeWidth={1.5} />
    </div>
  );
}
