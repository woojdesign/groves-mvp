import { cn } from "./utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the glass card
   * - default: Standard premium glass card with strong backdrop blur
   * - premium: Extra spacing and subtle styling
   * - subtle: Lighter backdrop blur and border
   */
  variant?: 'default' | 'premium' | 'subtle';

  /**
   * Whether to show the inner glow gradient overlay
   * @default true
   */
  withGlow?: boolean;

  /**
   * Whether to show the gradient accent strip at the top
   * @default false
   */
  withAccent?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', withGlow = true, withAccent = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          variant === 'default' && "bg-card/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/[0.05] border border-white/20",
          variant === 'premium' && "bg-card/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 lg:p-16 shadow-lg shadow-black/[0.03] border border-border/50",
          variant === 'subtle' && "bg-card/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-md border border-border/40",
          className
        )}
        {...props}
      >
        {withAccent && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-secondary/60 via-accent/80 to-secondary/60" />
        )}
        {withGlow && (
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
