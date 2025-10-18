---
doc_type: research
title: Styles and Animations Implementation Analysis
created: 2025-10-18T17:30:00Z
created_by: Claude (Research Agent)
last_updated: 2025-10-18T17:30:00Z
last_updated_by: Claude (Research Agent)
status: complete
research_question: How are styles and animations currently implemented in the Grove MVP codebase?
tags:
  - styling
  - animations
  - tailwind
  - framer-motion
  - css-architecture
  - component-patterns
git_commit: N/A (not a git repository)
git_branch: N/A
repository: grove-mvp
related_docs: []
---

# Research: Styles and Animations Implementation Analysis

**Date**: October 18, 2025, 5:30 PM PDT
**Researcher**: Claude (Research Agent)
**Repository**: grove-mvp
**Status**: Not a git repository

## Research Question

How are styles and animations currently implemented in the Grove MVP codebase? What patterns exist, what opportunities for consolidation are present, and what is the recommended structure for centrally managing styles and animations?

## Executive Summary

The Grove MVP is a Figma Make export project built with React, Vite, Tailwind CSS v4.1.3, and Framer Motion. The codebase demonstrates a **premium design aesthetic** with extensive use of:

- **Tailwind CSS v4** with custom CSS variables for theming
- **Framer Motion** (`motion/react`) for complex animations
- **shadcn/ui** component library with Radix UI primitives
- **Glass morphism** and **gradient effects** as signature visual patterns
- **Inline Tailwind classes** heavily used throughout components
- **Repetitive styling patterns** that could benefit from consolidation

### Key Findings

1. **No Tailwind config file** - Using Tailwind v4's CSS-first configuration via `@theme` in CSS files
2. **Two CSS files**: `src/index.css` (3,607 lines - auto-generated Tailwind) and `src/styles/globals.css` (215 lines - custom theme)
3. **Framer Motion** is the primary animation library (not Framer Motion classic - using `motion/react`)
4. **Significant style duplication** exists across components with repeated patterns for cards, buttons, and glass effects
5. **No centralized animation configuration** - all animations defined inline

---

## 1. Current Style Organization

### CSS Files

The project has **two main CSS files**:

#### 1.1 `/src/index.css` (3,607 lines)
- **Auto-generated Tailwind CSS v4 output**
- Contains all Tailwind utility classes, CSS custom properties, and base styles
- Defines CSS layers: `@layer properties`, `@layer theme`, `@layer base`
- Includes one custom keyframe animation:
  ```css
  @keyframes pulse {
    50% {
      opacity: .5;
    }
  }
  ```
  (Line 3603-3607)

**Location**: `/Users/seankim/Wooj Dropbox/Utilities/grove/grove-mvp/src/index.css`

#### 1.2 `/src/styles/globals.css` (215 lines)
- **Custom theme configuration** using Tailwind v4's `@theme` directive
- Defines CSS custom properties for colors, spacing, typography
- Contains **light and dark mode theme variables**
- Includes **base typography styles** for semantic HTML elements (h1-h4, p, label, button, input, textarea)
- Contains the **premium texture overlay** effect applied to `body::before`

**Location**: `/Users/seankim/Wooj Dropbox/Utilities/grove/grove-mvp/src/styles/globals.css`

**Key sections:**
- Lines 1-43: Light mode theme variables (`:root`)
- Lines 45-80: Dark mode theme variables (`.dark`)
- Lines 82-121: Tailwind theme mapping (`@theme inline`)
- Lines 123-148: Base styles including texture overlay
- Lines 150-210: Semantic typography (h1-h4, p, label, button, input, textarea)

### Tailwind Configuration

**Critical Finding**: There is **NO `tailwind.config.js` file**. The project uses **Tailwind CSS v4**, which adopts a **CSS-first configuration** approach.

Configuration is done via:
- `@theme inline` directive in `/src/styles/globals.css` (line 82)
- `@custom-variant dark (&:is(.dark *));` for dark mode (line 1)
- CSS custom properties defined in `:root` and `.dark` selectors

### CSS Custom Properties (Design Tokens)

From `/src/styles/globals.css:3-43`:

**Colors:**
```css
--background: #fafaf9;
--foreground: rgb(74 71 65);
--card: #fafaf9;
--card-foreground: rgb(74 71 65);
--primary: #1a1a1a;
--primary-foreground: #fafaf9;
--secondary: #a07855;
--secondary-foreground: #fafaf9;
--muted: #f5f5f4;
--accent: #d4a574;
--destructive: #d4183d;
--border: rgba(74, 71, 65, 0.15);
--input: transparent;
--input-background: #f5f5f4;
--switch-background: #d4a574;
```

**Typography:**
```css
--font-weight-medium: 500;
--font-weight-normal: 400;
--font-weight-light: 300;
```

**Border Radius:**
```css
--radius: 0.375rem;
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

### Styling Patterns

**Pattern Analysis** (from grep analysis):

1. **Border Radius** - Most common classes:
   - `rounded-2xl` (29 occurrences) - Cards, buttons, inputs
   - `rounded-full` (22 occurrences) - Icons, badges, avatars
   - `rounded-3xl` (16 occurrences) - Large cards, modals

2. **Backdrop Blur** (Glass Morphism):
   - `backdrop-blur-xl` (6 occurrences)
   - `backdrop-blur-md` (6 occurrences)
   - `backdrop-blur-sm` (5 occurrences)

3. **Shadows**:
   - `shadow-sm`, `shadow-lg`, `shadow-md` most common
   - `shadow-2xl` used for premium cards
   - `shadow-primary/20`, `shadow-secondary/10` for colored shadows

4. **Transitions**:
   - `transition-all` (27 occurrences) - Most common
   - Custom durations: `duration-300`, `duration-500`, `duration-1000`

5. **Gradients**:
   - 20+ instances of `bg-gradient-to-br`, `bg-gradient-to-r`
   - Used extensively for premium feel

### Component Styling Approach

**All components use inline Tailwind classes**. No separate CSS modules or styled components.

**Example from MatchCard.tsx:42-44:**
```tsx
<div className="relative bg-card/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/[0.05] border border-white/20 overflow-hidden">
  {/* Premium gradient accent */}
  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-secondary/60 via-accent/80 to-secondary/60" />
```

### shadcn/ui Integration

The project uses **shadcn/ui components** located in `/src/components/ui/`:

**52 UI components** identified, including:
- `button.tsx`, `badge.tsx`, `input.tsx`, `textarea.tsx`
- `dialog.tsx`, `drawer.tsx`, `popover.tsx`, `sheet.tsx`
- `card.tsx`, `tabs.tsx`, `accordion.tsx`, `carousel.tsx`
- All Radix UI based components with Tailwind styling

**Pattern**: shadcn components use **class-variance-authority (CVA)** for variant management:

**Example from button.tsx:7-35:**
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90...",
        outline: "border bg-background text-foreground hover:bg-accent...",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground...",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
```

**Utility function** in `/src/components/ui/utils.ts`:
```tsx
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This `cn()` helper is used throughout to merge Tailwind classes intelligently.

---

## 2. Animation Implementation

### Animation Libraries

**Primary Library**: **Framer Motion** (`motion/react`)

**Package.json dependency** (line 39):
```json
"motion": "*"
```

**Import pattern**:
```tsx
import { motion, AnimatePresence } from 'motion/react';
```

**Note**: This is the modern Framer Motion package (using `motion/react` instead of `framer-motion`).

### Where Animations Are Defined

**All animations are defined inline** within component JSX. No separate animation configuration files exist.

### Animation Types & Examples

#### 2.1 Component Entry/Exit Animations

**From Welcome.tsx:30-33:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  className="w-full max-w-lg"
>
```

**Pattern**: Fade + slide on mount, using custom cubic bezier easing `[0.22, 1, 0.36, 1]`

#### 2.2 State-Based Animations

**From MatchCard.tsx:32-39:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{
    opacity: actionTaken ? 0 : 1,
    y: actionTaken ? -20 : 0,
    scale: actionTaken ? 0.96 : 1
  }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
>
```

**Pattern**: Animate based on component state, exit animation when action taken.

#### 2.3 Background Gradient Animations

**From MatchingAnimation.tsx:206-219:**
```tsx
<motion.div
  className="absolute inset-0 -z-10"
  animate={{
    background: [
      'radial-gradient(circle at 20% 50%, rgba(194, 103, 74, 0.25) 0%, transparent 50%)',
      'radial-gradient(circle at 80% 50%, rgba(74, 124, 89, 0.22) 0%, transparent 50%)',
      'radial-gradient(circle at 50% 80%, rgba(91, 124, 141, 0.20) 0%, transparent 50%)',
      // ... more gradients
    ]
  }}
  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
/>
```

**Pattern**: Infinite looping gradient animation for ambient backgrounds.

#### 2.4 Complex Multi-Phase Animations

**From MatchingAnimation.tsx** - The most complex animation in the codebase:

**5 distinct phases** with orchestrated timing:
1. **Floating phase** (0-2s): Words float randomly with gentle bob motion
2. **First clustering** (2-4.5s): Words group into broad categories
3. **Second clustering** (4.5-6.5s): Refined matching, non-matches fade out
4. **Coalesce** (6.5-8.5s): Final tight grouping with emphasis
5. **Complete** (8.5-11.5s): Show success message, auto-advance

**Word animation** (lines 331-358):
```tsx
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
    scale: shouldFade ? 0.5 : (isCoalescing ? 1.2 : isInFinalCluster ? 1.15 : 1),
  }}
  transition={{
    duration: phase === 'floating' ? 0.8 : (phase === 'coalesce' ? 1.5 : 1.2),
    type: 'spring',
    stiffness: phase === 'coalesce' ? 80 : 60,
    damping: phase === 'coalesce' ? 25 : 20
  }}
>
```

**SVG line animations** for connections between words (lines 260-282).

#### 2.5 Shimmer/Hover Effects

**From Welcome.tsx:105-106 and MatchCard.tsx:115:**
```tsx
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
```

**Pattern**: Infinite shimmer effect on hover for premium feel.

#### 2.6 Staggered List Animations

**From Onboarding.tsx:136-148:**
```tsx
{currentPrompt.options?.map((option, idx) => (
  <motion.div
    key={option}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: idx * 0.1 }}
  >
```

**Pattern**: Stagger delay based on index for list items.

#### 2.7 AnimatePresence for Route Changes

**From Onboarding.tsx:101-109:**
```tsx
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStep}
    custom={direction}
    initial={{ opacity: 0, x: direction * 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction * -40 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
```

**Pattern**: Slide animation direction based on navigation (forward/back).

#### 2.8 Pulsing Dot Indicators

**From MatchingAnimation.tsx:456-472:**
```tsx
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
```

**Pattern**: Infinite pulsing with staggered delays.

#### 2.9 SVG Path Animations

**From MatchingAnimation.tsx:500-515:**
```tsx
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
```

**Pattern**: Checkmark draw-in animation using `pathLength`.

#### 2.10 Ambient Particle Effects

**From MatchingAnimation.tsx:573-593:**
```tsx
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
```

**Pattern**: Random floating particles with infinite movement.

#### 2.11 CSS-Only Animations

**From App.tsx:107-109:**
```tsx
<div className="...animate-pulse" style={{ animationDuration: '8s' }} />
<div className="...animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
<div className="...animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
```

**Pattern**: Using Tailwind's built-in `animate-pulse` with custom durations via inline styles.

### Common Animation Patterns

**Easing**: The custom cubic bezier `[0.22, 1, 0.36, 1]` is used **consistently** across all major animations.

**Durations**:
- Quick interactions: 0.4s
- Standard: 0.6-0.8s
- Slow/Premium: 1.2-1.5s
- Ambient: 8-12s

**Spring physics** used for organic movement in MatchingAnimation:
- `stiffness: 50-80`
- `damping: 20-25`

---

## 3. Component Structure

### Component Inventory

**Custom App Components** (7 total):
1. `/src/components/Welcome.tsx` - Landing page with email signup
2. `/src/components/Onboarding.tsx` - Multi-step questionnaire
3. `/src/components/MatchingAnimation.tsx` - Complex matching visualization (597 lines)
4. `/src/components/Dashboard.tsx` - Match review interface
5. `/src/components/MatchCard.tsx` - Individual match card
6. `/src/components/Feedback.tsx` - Post-match feedback form
7. `/src/components/DevMenu.tsx` - Developer navigation menu

**shadcn/ui Components** (52 total in `/src/components/ui/`):
- Form controls: button, input, textarea, checkbox, radio-group, select, slider, switch
- Overlays: dialog, drawer, sheet, popover, tooltip, hover-card
- Navigation: tabs, accordion, breadcrumb, menubar, navigation-menu
- Display: card, badge, avatar, separator, progress, skeleton
- Charts: chart (with recharts integration)
- Layout: sidebar, resizable, scroll-area
- And 20+ more Radix-based components

**Utility Components**:
- `/src/components/figma/ImageWithFallback.tsx`
- `/src/components/ui/utils.ts` - `cn()` helper

### Components with Significant Styling

**Top 3 most styled components**:

1. **MatchingAnimation.tsx** (597 lines)
   - Most complex animations in the codebase
   - Multiple animation phases
   - SVG line animations
   - Ambient particles
   - Gradient backgrounds

2. **MatchCard.tsx** (145 lines)
   - Premium glass morphism card
   - Gradient accents
   - Hover effects with shimmer
   - Acceptance overlay animation

3. **Onboarding.tsx** (188 lines)
   - Multi-step form with transitions
   - Progress bar
   - Staggered list animations
   - Directional slide animations

### Repeated Style Patterns

#### Pattern 1: Premium Glass Card

**Used in**: Welcome, Onboarding, MatchCard, Dashboard, Feedback

**Common structure**:
```tsx
<div className="relative bg-card/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/[0.05] border border-white/20 overflow-hidden">
  {/* Inner glow */}
  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
  {/* Content */}
</div>
```

**Occurrences**: 6+ instances

#### Pattern 2: Premium Button with Shimmer

**Used in**: Welcome, Onboarding, MatchCard, Feedback

```tsx
<Button className="relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-16 shadow-2xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
  <span className="relative z-10">Button Text</span>
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
</Button>
```

**Occurrences**: 5+ instances

#### Pattern 3: Icon Circle Badge

**Used in**: Welcome, Onboarding, Dashboard, Feedback

```tsx
<div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shadow-sm">
  <Icon className="w-7 h-7 text-secondary" strokeWidth={1.5} />
</div>
```

**Occurrences**: 8+ instances

#### Pattern 4: Gradient Accent Strip

**Used in**: MatchCard

```tsx
<div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-secondary/60 via-accent/80 to-secondary/60" />
```

**Occurrences**: 2 instances

#### Pattern 5: Backdrop Blur Input

**Used in**: Welcome, Onboarding, Feedback

```tsx
<Input className="rounded-2xl h-14 bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/70 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all text-base" />
```

**Occurrences**: 5+ instances

#### Pattern 6: Responsive Spacing

**Consistent pattern**: `p-6 sm:p-10 lg:p-14`, `gap-3 sm:gap-5`, `mb-8 sm:mb-16`

Used throughout for mobile-first responsive design.

---

## 4. Opportunities for Consolidation

### 4.1 Extractable Style Patterns

#### A. Glass Morphism Card Component

**Current**: Duplicated across 6+ components

**Recommendation**: Create `<GlassCard>` component

**Proposed Location**: `/src/components/ui/glass-card.tsx`

**Proposed Implementation**:
```tsx
import { cn } from "./utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'premium' | 'subtle';
  withGlow?: boolean;
  withAccent?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', withGlow = true, withAccent = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl sm:rounded-3xl overflow-hidden",
          variant === 'default' && "bg-card/70 backdrop-blur-xl p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/[0.05] border border-white/20",
          variant === 'premium' && "bg-card/60 backdrop-blur-md p-8 sm:p-12 lg:p-16 shadow-lg shadow-black/[0.03] border border-border/50",
          variant === 'subtle' && "bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-md border border-border/40",
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
```

**Usage**:
```tsx
<GlassCard variant="premium" withAccent>
  <h2>Content</h2>
</GlassCard>
```

**Impact**: Eliminates 100+ lines of duplicated code

---

#### B. Premium Button Component Enhancement

**Current**: Shimmer effect duplicated 5+ times

**Recommendation**: Extend existing Button component with shimmer variant

**Proposed Location**: `/src/components/ui/button.tsx`

**Proposed Enhancement**:
```tsx
// Add to buttonVariants
variants: {
  variant: {
    // ... existing variants
    premium: "relative bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 overflow-hidden group",
  }
}

// Add Shimmer subcomponent
const ButtonShimmer = () => (
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

// Usage:
<Button variant="premium" className="rounded-2xl h-16">
  <span className="relative z-10">Button Text</span>
  <ButtonShimmer />
</Button>
```

**Impact**: Standardizes premium button style, eliminates 50+ lines

---

#### C. Icon Badge Component

**Current**: Pattern repeated 8+ times

**Recommendation**: Create `<IconBadge>` component

**Proposed Location**: `/src/components/ui/icon-badge.tsx`

**Proposed Implementation**:
```tsx
import { cn } from "./utils";
import { LucideIcon } from "lucide-react";

interface IconBadgeProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'secondary' | 'muted';
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
```

**Usage**:
```tsx
<IconBadge icon={Sprout} size="lg" variant="accent" />
```

**Impact**: Eliminates 40+ lines, ensures consistency

---

### 4.2 Centralized Animation Configuration

**Current Problem**: All animation timings, easings, and spring configs are hardcoded inline.

**Recommendation**: Create animation constants file

**Proposed Location**: `/src/lib/animations.ts`

**Proposed Implementation**:
```tsx
// Animation easing curves
export const easings = {
  premium: [0.22, 1, 0.36, 1], // Custom cubic bezier used throughout
  smooth: 'easeInOut',
  bouncy: 'easeOut',
  linear: 'linear'
} as const;

// Animation durations
export const durations = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  premium: 1.2,
  ambient: 8
} as const;

// Spring configurations
export const springs = {
  gentle: { stiffness: 50, damping: 20 },
  moderate: { stiffness: 60, damping: 20 },
  snappy: { stiffness: 80, damping: 25 },
  bouncy: { stiffness: 100, damping: 15 }
} as const;

// Common animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 }
};

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 }
};

// Create standard transition configs
export const transitions = {
  premium: { duration: durations.premium, ease: easings.premium },
  normal: { duration: durations.normal, ease: easings.premium },
  fast: { duration: durations.fast, ease: easings.premium },
  spring: { type: 'spring', ...springs.moderate },
  springSnappy: { type: 'spring', ...springs.snappy }
} as const;
```

**Usage**:
```tsx
import { fadeInUp, transitions } from '@/lib/animations';

<motion.div
  {...fadeInUp}
  transition={transitions.premium}
>
```

**Impact**:
- Centralizes all animation timing
- Ensures consistency
- Easy to tweak globally
- Reduces inline code by 30-40%

---

### 4.3 Tailwind Custom Classes

**Recommendation**: Create utility classes for repeated patterns in `globals.css`

**Proposed Addition to `/src/styles/globals.css`**:
```css
@layer components {
  /* Premium Glass Card Base */
  .glass-card {
    @apply relative bg-card/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl;
    @apply p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/[0.05];
    @apply border border-white/20 overflow-hidden;
  }

  .glass-card-glow {
    @apply absolute inset-0 rounded-2xl sm:rounded-3xl;
    @apply bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none;
  }

  /* Premium Input */
  .input-premium {
    @apply rounded-2xl h-14 bg-background/60 backdrop-blur-sm;
    @apply border-border/40 hover:border-border/70;
    @apply focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10;
    @apply transition-all text-base;
  }

  /* Icon Badge */
  .icon-badge {
    @apply rounded-full bg-accent/10 flex items-center justify-center shadow-sm;
  }

  .icon-badge-sm { @apply w-12 h-12; }
  .icon-badge-md { @apply w-14 h-14; }
  .icon-badge-lg { @apply w-16 h-16 sm:w-20 sm:h-20; }

  /* Premium Button Shimmer */
  .btn-shimmer {
    @apply absolute inset-0 -translate-x-full group-hover:translate-x-full;
    @apply transition-transform duration-1000;
    @apply bg-gradient-to-r from-transparent via-white/20 to-transparent;
  }
}
```

**Usage**:
```tsx
<div className="glass-card">
  <div className="glass-card-glow" />
  <div className="relative">Content</div>
</div>

<Input className="input-premium" />
<div className="icon-badge icon-badge-lg">
  <Sprout className="w-8 h-8" />
</div>
```

**Impact**: Reduces inline class strings by 40-60%

---

### 4.4 Responsive Spacing Tokens

**Observation**: Consistent pattern `p-6 sm:p-10 lg:p-14` used throughout

**Recommendation**: Add to Tailwind theme in `globals.css`

```css
@theme inline {
  /* Add responsive spacing presets */
  --spacing-card-sm: 1.5rem;    /* 6 */
  --spacing-card-md: 2.5rem;    /* 10 */
  --spacing-card-lg: 3.5rem;    /* 14 */

  --spacing-section-sm: 2rem;   /* 8 */
  --spacing-section-md: 4rem;   /* 16 */
  --spacing-section-lg: 5rem;   /* 20 */
}
```

Then use with Tailwind v4's arbitrary values:
```tsx
<div className="p-[var(--spacing-card-sm)] sm:p-[var(--spacing-card-md)] lg:p-[var(--spacing-card-lg)]">
```

Or create utility classes:
```css
.p-card { @apply p-6 sm:p-10 lg:p-14; }
.p-section { @apply p-8 sm:p-16 lg:p-20; }
.gap-responsive { @apply gap-3 sm:gap-5; }
```

**Impact**: Standardizes responsive spacing, reduces repetition

---

## 5. Recommended File Structure

### Proposed Organization

```
src/
├── styles/
│   ├── globals.css                 # Existing: Theme variables, base styles
│   ├── components.css              # NEW: Component-level utility classes
│   └── animations.css              # NEW: CSS keyframe animations (if needed)
│
├── lib/
│   ├── animations.ts               # NEW: Framer Motion animation constants
│   ├── design-tokens.ts            # NEW: TypeScript design token exports
│   └── utils.ts                    # Existing: cn() helper
│
├── components/
│   ├── ui/
│   │   ├── glass-card.tsx         # NEW: Glass morphism card component
│   │   ├── icon-badge.tsx         # NEW: Icon badge component
│   │   ├── button.tsx             # ENHANCED: Add premium variant + shimmer
│   │   ├── badge.tsx              # Existing
│   │   ├── input.tsx              # Existing
│   │   └── ... (50+ other UI components)
│   │
│   ├── Welcome.tsx                # Existing
│   ├── Onboarding.tsx             # Existing
│   ├── MatchingAnimation.tsx      # Existing
│   ├── Dashboard.tsx              # Existing
│   ├── MatchCard.tsx              # Existing
│   ├── Feedback.tsx               # Existing
│   └── DevMenu.tsx                # Existing
│
├── App.tsx                        # Existing
├── main.tsx                       # Existing
└── index.css                      # Existing: Generated Tailwind output
```

### New Files Detail

#### `/src/styles/components.css`
```css
@layer components {
  /* All extracted component utility classes */
  .glass-card { ... }
  .input-premium { ... }
  .icon-badge { ... }
  .btn-shimmer { ... }
  .p-card { ... }
  .p-section { ... }
}
```

Import in `main.tsx` after `globals.css`.

#### `/src/lib/animations.ts`
```typescript
// All animation constants, easing curves, spring configs
export const easings = { ... };
export const durations = { ... };
export const springs = { ... };
export const fadeInUp = { ... };
export const transitions = { ... };
```

#### `/src/lib/design-tokens.ts`
```typescript
// TypeScript exports of CSS custom properties for use in JS
export const colors = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  // ...
};

export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
};

// Used in inline styles where CSS vars are needed
```

---

## Code References

### CSS Architecture
- `/src/index.css` - 3,607 lines of Tailwind v4 output with `@keyframes pulse` at line 3603
- `/src/styles/globals.css:1-215` - Custom theme configuration, CSS variables, base typography

### Animation Library
- `package.json:39` - Framer Motion dependency (`"motion": "*"`)
- `/src/components/MatchingAnimation.tsx:2` - Import pattern for Framer Motion

### Component Examples
- `/src/components/MatchingAnimation.tsx:1-597` - Most complex animation implementation
- `/src/components/MatchCard.tsx:32-143` - Glass card with premium effects
- `/src/components/Welcome.tsx:29-133` - Entry animations and shimmer button
- `/src/components/Onboarding.tsx:82-186` - Multi-step transitions with AnimatePresence
- `/src/components/Dashboard.tsx:52-146` - Responsive layout with motion
- `/src/components/Feedback.tsx:53-179` - Conditional animations based on state

### shadcn/ui Components
- `/src/components/ui/button.tsx:7-35` - CVA variant configuration
- `/src/components/ui/badge.tsx:7-26` - Badge variants
- `/src/components/ui/dialog.tsx:40-72` - Radix Dialog with Tailwind animations
- `/src/components/ui/input.tsx:10-14` - Input styling pattern
- `/src/components/ui/utils.ts:1-6` - `cn()` utility for class merging

### Background Gradients
- `/src/App.tsx:103-112` - Global animated gradient orbs

### Repeated Patterns
- Glass cards: Welcome.tsx:60, Onboarding.tsx:110, MatchCard.tsx:42, Feedback.tsx:70
- Premium buttons: Welcome.tsx:100, Onboarding.tsx:165, MatchCard.tsx:106, Feedback.tsx:163
- Icon badges: Welcome.tsx:37, Onboarding.tsx:90, Dashboard.tsx:63, Feedback.tsx:61

---

## Architecture Documentation

### Styling Architecture

**Stack:**
1. **Tailwind CSS v4** - Utility-first CSS framework with CSS-first configuration
2. **CSS Custom Properties** - Design tokens in `:root` and `.dark` selectors
3. **Inline Tailwind Classes** - Primary styling method in all components
4. **class-variance-authority (CVA)** - Variant management in shadcn components
5. **clsx + tailwind-merge** - Class composition via `cn()` utility

**Configuration Pattern:**
- No `tailwind.config.js` - using Tailwind v4's `@theme inline` directive
- Theme defined in `/src/styles/globals.css` with CSS variables
- Dark mode via `.dark` class with `@custom-variant`
- Base typography targeting semantic HTML elements

**Component Pattern:**
- shadcn/ui base components with CVA variants
- Custom app components with inline Tailwind classes
- No CSS modules, no styled-components
- Heavy use of responsive modifiers (`sm:`, `lg:`)

### Animation Architecture

**Stack:**
1. **Framer Motion** (`motion/react`) - Primary animation library
2. **Tailwind animate utilities** - `animate-pulse` for simple loops
3. **CSS transitions** - Via Tailwind `transition-*` utilities

**Pattern:**
- All Framer Motion animations defined inline in components
- No centralized animation configuration (opportunity identified)
- Consistent easing: `[0.22, 1, 0.36, 1]` cubic bezier
- Spring physics for organic movement
- `AnimatePresence` for route transitions

**Key Techniques:**
- State-based animations (animate based on component state)
- Multi-phase orchestrated animations (MatchingAnimation)
- SVG path animations (pathLength for checkmarks)
- Gradient background animations (array of values)
- Staggered list animations (delay based on index)

### Design System Patterns

**Premium Aesthetic:**
- Glass morphism: `backdrop-blur-xl`, semi-transparent backgrounds
- Soft shadows: `shadow-2xl shadow-black/[0.05]`
- Gradient accents: `bg-gradient-to-br from-secondary/60`
- Inner glows: Absolute positioned divs with gradients
- Rounded corners: Primarily `rounded-2xl` and `rounded-3xl`
- Texture overlay: SVG noise on `body::before` at 1.5% opacity

**Color Palette:**
- Warm, earthy tones: terracotta (#c2674a), forest green (#4a7c59), warm gold (#d4a574)
- Nature-inspired: 25 distinct colors for word clouds in MatchingAnimation
- Opacity modifiers heavily used: `/70`, `/40`, `/20`, `/10`, `/[0.05]`

**Typography:**
- Headings: Georgia serif, light weight (300), fluid sizing with `clamp()`
- Body: -apple-system, BlinkMacSystemFont fallback stack
- Font smoothing: `antialiased`, `-webkit-font-smoothing`, `-moz-osx-font-smoothing`

**Responsive Strategy:**
- Mobile-first with `sm:` and `lg:` breakpoints
- Consistent spacing patterns: `p-6 sm:p-10 lg:p-14`
- Responsive text: `text-sm sm:text-base`, `text-xs sm:text-sm`
- Responsive sizing: `w-12 h-12 sm:w-14 sm:h-14`

---

## Related Research

No existing related research documents found in `/thoughts/research/`.

---

## Open Questions

1. **Performance**: Are there performance concerns with the number of animated elements in MatchingAnimation.tsx (45+ words, SVG lines, particles)? Should we implement animation optimization?

2. **Dark Mode**: Dark mode theme variables exist but are they actively used? Is there a theme switcher component?

3. **Accessibility**: Are Framer Motion animations respecting `prefers-reduced-motion`? Should we add a wrapper?

4. **Bundle Size**: Framer Motion is a large dependency. Are we using it efficiently? Could some animations be CSS-only?

5. **Browser Support**: Tailwind v4 uses newer CSS features (`@layer`, `@theme`). What's the minimum browser version supported?

6. **Design System Documentation**: Should we create a Storybook or similar for documenting the design system?

7. **Component Library**: Are there plans to package the custom components (`GlassCard`, etc.) as a reusable library?

8. **Figma Sync**: How does the codebase stay in sync with Figma designs? Is there an automated export process?
