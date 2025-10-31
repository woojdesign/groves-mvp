---
doc_type: implementation_plan
date: 2025-10-25
title: "Email-Only Welcome Page Implementation (Option A)"
plan_for: "UX improvement to remove unnecessary name field from login flow"
status: ready_for_implementation

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-25
last_updated_by: Sean Kim

tags:
  - ux-improvement
  - authentication
  - frontend
  - onboarding
---

# Implementation Plan: Email-Only Welcome Page

## Problem Statement

The current Welcome page collects both name and email, but the name field is never used:
- Backend only accepts email for magic link requests
- New users are created with `name: ''` (empty string)
- Returning users must re-enter their name unnecessarily
- Creates confusion about login vs. signup

## Solution: Option A - Email-Only Welcome Page

Remove the name field from the Welcome page entirely and collect name during onboarding for new users.

---

## Implementation Phases

### Phase 1: Update Welcome Page (Remove Name Field)

**Goal**: Simplify Welcome page to email-only authentication

**Files to Modify**:
- `src/components/Welcome.tsx`

**Changes**:

1. **Remove name state and field** (lines 18, 25-91):
   - Remove `const [name, setName] = useState('')`
   - Remove name Input component
   - Remove name from validation check

2. **Update validation** (line 27):
   ```typescript
   // Before:
   if (!email || !name) return;

   // After:
   if (!email) return;
   ```

3. **Update button text** (line 148):
   ```typescript
   // Before:
   {loading ? 'Sending magic link...' : 'Join commonplace'}

   // After:
   {loading ? 'Sending magic link...' : 'Continue with email'}
   ```

4. **Update form layout**:
   - Remove name Label and Input components
   - Keep email Label and Input components
   - Maintain privacy notice
   - Maintain button styling

5. **Remove unused localStorage reference** (line 42):
   - Remove `localStorage.setItem('tempUserName', name)` (no longer needed)

**Success Criteria**:
- Welcome page shows only email field
- Form validates with email only
- Button text is clearer ("Continue with email")
- Magic link request still works
- No TypeScript errors

---

### Phase 2: Update Onboarding to Collect Name

**Goal**: Add name collection as first step in onboarding

**Files to Modify**:
- `src/components/Onboarding.tsx`

**Changes**:

1. **Add name to questions array** (line 22):
   ```typescript
   const questions = [
     {
       id: 'name',
       type: 'text' as const,
       question: "What's your name?",
       placeholder: 'Alex Chen',
       required: true,
     },
     {
       id: 'niche_interest',
       type: 'textarea' as const,
       question: "What's a niche interest you could talk about for an hour?",
       placeholder: 'vintage synthesizers, urban foraging, letterpress printing...',
       required: true,
     },
     // ... rest of questions
   ];
   ```

2. **Update total steps** (line 64):
   ```typescript
   // Before:
   const totalSteps = 5;

   // After:
   const totalSteps = 6;  // Now includes name
   ```

3. **Update greeting** (line 145):
   ```typescript
   // Before:
   <p className="text-sm sm:text-base text-muted-foreground/90">
     Welcome, {userName}
   </p>

   // After:
   <p className="text-sm sm:text-base text-muted-foreground/90">
     Welcome to commonplace! Let's set up your profile.
   </p>
   ```

4. **Remove userName prop dependency** (line 18):
   ```typescript
   // Before:
   interface OnboardingProps {
     userName?: string;
     onComplete?: (responses: Record<string, string>) => void;
   }

   // After:
   interface OnboardingProps {
     onComplete?: (responses: Record<string, string>) => void;
   }
   ```

5. **Update API submission** (line 95):
   ```typescript
   const onboardingData: OnboardingResponses = {
     name: responses.name || '',  // NEW: Send name to backend
     niche_interest: responses.niche_interest || '',
     project: responses.project || '',
     connection_type: responses.connection_type as any,
     rabbit_hole: responses.rabbit_hole || undefined,
     preferences: responses.preferences || undefined,
   };
   ```

**Success Criteria**:
- Onboarding shows 6 steps (was 5)
- First question asks for name
- Name field is text input (not textarea)
- Greeting no longer references userName prop
- Name is sent to backend with other onboarding data
- TypeScript types are updated

---

### Phase 3: Update Backend to Accept Name in Onboarding

**Goal**: Update onboarding endpoint to accept and store user name

**Files to Modify**:
- `grove-backend/src/profiles/dto/create-profile.dto.ts` (or similar)
- `grove-backend/src/profiles/profiles.service.ts`

**Changes**:

1. **Update DTO to accept name**:
   ```typescript
   export class CreateProfileDto {
     @IsString()
     @IsNotEmpty()
     @MinLength(1)
     @MaxLength(100)
     name: string;

     @IsString()
     @IsNotEmpty()
     niche_interest: string;

     // ... rest of fields
   }
   ```

2. **Update service to save name to user record**:
   ```typescript
   async createProfile(userId: string, dto: CreateProfileDto): Promise<Profile> {
     // Update user name
     await this.prisma.user.update({
       where: { id: userId },
       data: { name: dto.name },
     });

     // Create profile
     return this.prisma.profile.create({
       data: {
         userId,
         nicheInterest: dto.niche_interest,
         project: dto.project,
         connectionType: dto.connection_type,
         rabbitHole: dto.rabbit_hole,
         preferences: dto.preferences,
       },
     });
   }
   ```

**Success Criteria**:
- Backend accepts name in onboarding request
- User.name is updated in database
- Profile is created as before
- Validation passes for name field
- No breaking changes to existing flow

---

### Phase 4: Update TypeScript Types

**Goal**: Update frontend types to match new flow

**Files to Modify**:
- `src/types/api.ts`

**Changes**:

1. **Update OnboardingResponses interface** (line 54):
   ```typescript
   export interface OnboardingResponses {
     name: string;  // NEW: Add name field
     niche_interest: string;
     project: string;
     connection_type: 'friendship' | 'collaboration' | 'mentorship' | 'knowledge_exchange';
     rabbit_hole?: string;
     preferences?: string;
   }
   ```

**Success Criteria**:
- TypeScript compilation passes
- No type errors in frontend
- Autocomplete works for new name field

---

### Phase 5: Update AuthCallback Message

**Goal**: Fix "Welcome back" message to distinguish new vs. returning users

**Files to Modify**:
- `src/components/AuthCallback.tsx`

**Changes**:

1. **Update success message** (line 94):
   ```typescript
   // Before:
   <p className="mb-3 text-lg">
     Welcome back{userName ? `, ${userName}` : ''}!
   </p>

   // After:
   <p className="mb-3 text-lg">
     {userName ? `Welcome back, ${userName}!` : 'Welcome!'}
   </p>
   ```

**Rationale**:
- New users (with empty name) see "Welcome!"
- Returning users (with name) see "Welcome back, [Name]!"

**Success Criteria**:
- New users see "Welcome!" (not "Welcome back!")
- Returning users see "Welcome back, [Name]!"
- No empty name display

---

## Testing Strategy

### Manual Testing

**Test Case 1: New User Flow**
1. Navigate to `/`
2. Enter email only (no name field visible)
3. Click "Continue with email"
4. Check email for magic link
5. Click magic link
6. Verify AuthCallback shows "Welcome!" (not "Welcome back!")
7. Should route to `/onboarding`
8. Verify onboarding greeting is "Welcome to commonplace! Let's set up your profile."
9. First question should ask for name
10. Complete all 6 questions
11. Submit onboarding
12. Verify user.name is saved in database
13. Navigate to dashboard

**Test Case 2: Returning User Flow**
1. Navigate to `/`
2. Enter email only
3. Click "Continue with email"
4. Click magic link
5. Verify AuthCallback shows "Welcome back, [Name]!"
6. Should route to `/dashboard` (skips onboarding)
7. Verify dashboard loads correctly

**Test Case 3: Error Handling**
1. Enter invalid email on Welcome page
2. Verify validation works
3. Test expired magic link
4. Verify error messages display correctly

### Integration Testing

**Backend Integration**:
- Test POST /api/onboarding with name field
- Verify user.name is updated
- Verify profile is created
- Verify hasCompletedOnboarding returns true after submission

**Frontend Integration**:
- Test routing from Welcome → AuthCallback → Onboarding → Dashboard
- Verify state persistence across routes
- Test browser back button behavior

---

## Rollback Plan

If issues are discovered:

1. **Revert Phase 1**: Restore name field to Welcome.tsx
2. **Revert Phase 2**: Remove name from onboarding questions
3. **Revert Phase 3**: Remove name from backend DTO
4. **Revert Phase 4**: Restore original TypeScript types
5. **Revert Phase 5**: Restore original AuthCallback message

**Git Strategy**:
- Create feature branch: `feature/email-only-welcome`
- Commit each phase separately
- Test after each commit
- Merge to main only after all tests pass

---

## Success Metrics

**Before (Current State)**:
- Welcome page: 2 fields (name + email)
- Name field: collected but unused
- New users: created with empty name
- Returning users: re-enter name unnecessarily

**After (Desired State)**:
- Welcome page: 1 field (email only)
- Name field: collected during onboarding
- New users: name saved after onboarding
- Returning users: enter email only

**Measurements**:
- Zero TypeScript errors
- All manual test cases pass
- No console errors in browser
- Backend validation passes
- Database correctly stores name

---

## Dependencies

- None (all changes are within existing codebase)

## Estimated Effort

- Phase 1: 15 minutes (simple removal)
- Phase 2: 30 minutes (add question, update logic)
- Phase 3: 30 minutes (backend DTO and service)
- Phase 4: 10 minutes (type updates)
- Phase 5: 10 minutes (message fix)
- Testing: 30 minutes (manual testing both flows)

**Total: ~2 hours**

---

## Notes

- This change improves UX without changing authentication security
- Backend magic link flow remains unchanged
- httpOnly cookie security is maintained
- No breaking changes to API contracts (onboarding endpoint is extended)
- Aligns frontend with backend reality (backend doesn't use name during magic link)

---

## Related Documentation

- Research: `thoughts/research/2025-10-25-login-screen-and-authentication-flow-in-grove-frontend.md`
- Original auth implementation: `thoughts/reviews/2025-10-22-GROVE-AUTH-phase-2-review-authentication.md`
