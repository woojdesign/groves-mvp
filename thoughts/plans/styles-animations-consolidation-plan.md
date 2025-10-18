# Styles and Animations Consolidation Plan

## Overview
Consolidate repeated styles and animations into centrally managed components and utilities based on research findings in `thoughts/research/2025-10-18-styles-and-animations-implementation.md`.

## Implementation Phases

### Phase 1: Create Animation Library
**Goal**: Centralize animation constants and variants

**Files to Create**:
- `/src/lib/animations.ts` - Animation constants, easing curves, spring configs, reusable variants

**Success Criteria**:
- File exports easings, durations, springs, common variants (fadeInUp, scaleIn, etc.)
- No breaking changes - existing components still work
- Dev server hot-reloads successfully

**Estimated Impact**: Foundation for all future phases

---

### Phase 2: Create GlassCard Component
**Goal**: Eliminate 100+ lines of duplicated glass card code

**Files to Create**:
- `/src/components/ui/glass-card.tsx`

**Files to Modify**:
- Update imports in Welcome.tsx, Onboarding.tsx, MatchCard.tsx, Dashboard.tsx, Feedback.tsx

**Success Criteria**:
- GlassCard component with variants (default, premium, subtle)
- Support withGlow and withAccent props
- All existing glass cards replaced with new component
- Visual output identical to before

**Estimated Impact**: -100 lines, improved consistency

---

### Phase 3: Create IconBadge Component
**Goal**: Standardize icon badge pattern (8+ instances)

**Files to Create**:
- `/src/components/ui/icon-badge.tsx`

**Files to Modify**:
- Replace icon badge patterns in Welcome.tsx, Onboarding.tsx, Dashboard.tsx, Feedback.tsx

**Success Criteria**:
- IconBadge component with size/variant props
- All existing icon badges replaced
- Visual consistency maintained

**Estimated Impact**: -40 lines

---

### Phase 4: Enhance Button Component
**Goal**: Add premium variant with shimmer to existing Button

**Files to Modify**:
- `/src/components/ui/button.tsx` - Add premium variant and ButtonShimmer sub-component

**Files to Update**:
- Replace premium buttons in Welcome.tsx, Onboarding.tsx, MatchCard.tsx, Feedback.tsx

**Success Criteria**:
- Button supports variant="premium"
- Optional ButtonShimmer component exported
- All existing premium buttons use new variant
- Visual shimmer effect maintained

**Estimated Impact**: -50 lines

---

### Phase 5: Add Utility Classes
**Goal**: Create reusable Tailwind classes for common patterns

**Files to Create**:
- `/src/styles/components.css`

**Files to Modify**:
- `/src/main.tsx` - Import new components.css after globals.css

**Success Criteria**:
- Utility classes: .glass-card, .input-premium, .icon-badge, .btn-shimmer, .p-card
- Classes available throughout app
- Optional - can be used alongside components

**Estimated Impact**: Alternative to component approach, -60% inline classes where used

---

### Phase 6: Update Components to Use New System
**Goal**: Refactor all main components to use centralized animations and components

**Files to Modify**:
- Welcome.tsx
- Onboarding.tsx
- MatchingAnimation.tsx
- Dashboard.tsx
- MatchCard.tsx
- Feedback.tsx

**Success Criteria**:
- All components import from `/src/lib/animations.ts`
- Use GlassCard, IconBadge, Button variants
- Reduced inline code
- No visual regressions
- All animations still smooth

**Estimated Impact**: -200+ lines total, much easier maintenance

---

## Testing Strategy

After each phase:
1. Verify dev server still running
2. Check hot-reload works
3. Manually test affected screens
4. Verify animations still smooth
5. Check responsive behavior (mobile, tablet, desktop)

## Rollback Plan

- Each phase is incremental
- If issues arise, revert specific phase commits
- Components are additive - can coexist with old code during migration

## Priority Order

1. Phase 1 (Foundation - no risk)
2. Phase 2 (High impact - glass cards everywhere)
3. Phase 3 (Medium impact - icon badges)
4. Phase 4 (Medium impact - buttons)
5. Phase 5 (Optional - can skip if components preferred)
6. Phase 6 (Integration - do incrementally)

## Notes

- Keep dev server running throughout
- Test each component individually before moving to next
- Visual consistency is critical - no regressions allowed
- Premium aesthetic must be maintained
