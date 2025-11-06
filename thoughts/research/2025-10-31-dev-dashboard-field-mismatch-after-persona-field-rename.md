---
doc_type: research
date: 2025-10-31T15:48:13+00:00
title: "Dev Dashboard Field Mismatch After Persona Field Rename"
research_question: "Why is the dev dashboard not showing profile fields and why are matches not working after the Phase 1-5 meta-persona field rename (blurb→interests, goals→project, values→deepDive)?"
researcher: Sean Kim

git_commit: ce3dc9cfebae3f4788b1136a64b4b521417989ab
branch: feature/persona-diversity-improvements
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-31
last_updated_by: Sean Kim

tags:
  - dev-dashboard
  - field-rename
  - bug-investigation
  - matching-system
  - frontend-backend-sync
status: completed

related_docs:
  - thoughts/research/2025-10-31-profile-model-multiple-interests-rearchitecture.md
---

# Research: Dev Dashboard Field Mismatch After Persona Field Rename

**Date**: 2025-10-31 15:48:13 UTC
**Researcher**: Sean Kim
**Git Commit**: ce3dc9cfebae3f4788b1136a64b4b521417989ab
**Branch**: feature/persona-diversity-improvements
**Repository**: grove-backend

## Research Question

Why is the dev dashboard not showing profile fields and why are matches not working after the Phase 1-5 meta-persona field rename (blurb→interests, goals→project, values→deepDive)?

## Executive Summary

The dev dashboard is broken due to **incomplete field rename migration**. While the database schema and backend DTOs were correctly updated from `niche_interest`/`rabbit_hole` to `interests`/`deep_dive`, the **frontend TypeScript interfaces** were not updated, causing a mismatch between what the backend returns and what the frontend expects.

### Root Causes Identified

1. **Frontend-Backend Mismatch**: Frontend expects `nicheInterest` and `rabbitHole`, but backend returns `interests` and `deepDive`
2. **SQL Query Bug**: Raw SQL query in `previewMatches()` references non-existent `p.niche_interest` column
3. **Type Definition Disconnect**: Frontend type definitions in `devApiService.ts` not updated after field rename

### Impact

- **Dev Dashboard**: Persona list shows empty/undefined values for interest fields
- **Match Preview**: SQL query fails with "column does not exist" error
- **Main App**: Working correctly (uses proper field names)

### Files Requiring Updates

**Frontend (3 files)**:
1. `/workspace/src/lib/devApiService.ts` - Type definitions (lines 17-20)
2. `/workspace/src/admin/dev/components/PersonaList.tsx` - Display logic (lines 151-152, 228)

**Backend (1 file)**:
3. `/workspace/grove-backend/src/dev/dev.service.ts` - Raw SQL query (line ~455 in `previewMatches()`)

---

## Detailed Findings

### 1. Database Schema Changes (COMPLETED CORRECTLY)

#### Migration Applied: `20251031025811_rename_fields_interests_and_deep_dive`

**Location**: `/workspace/grove-backend/prisma/migrations/20251031025811_rename_fields_interests_and_deep_dive/migration.sql`

```sql
-- Renamed fields:
ALTER TABLE "profiles" DROP COLUMN "niche_interest",
DROP COLUMN "rabbit_hole",
ADD COLUMN "deep_dive" TEXT,
ADD COLUMN "interests" TEXT NOT NULL;
```

**Current Schema** (`/workspace/grove-backend/prisma/schema.prisma:84-103`):
```prisma
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  interests      String   @map("interests") @db.Text      // ✅ RENAMED FROM niche_interest
  project        String   @db.Text
  connectionType String   @map("connection_type")
  deepDive       String?  @map("deep_dive") @db.Text      // ✅ RENAMED FROM rabbit_hole
  preferences    String?  @db.Text
  isTestData     Boolean  @default(false) @map("is_test_data")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
}
```

**Verdict**: ✅ Database schema is correct.

---

### 2. Backend DTOs (COMPLETED CORRECTLY)

#### PersonaResponse DTO

**Location**: `/workspace/grove-backend/src/dev/dto/persona-response.dto.ts:1-12`

```typescript
export interface PersonaResponse {
  id: string;
  name: string;
  email: string;
  interests: string;        // ✅ CORRECT
  project: string;
  connectionType: string;
  deepDive?: string;        // ✅ CORRECT
  preferences?: string;
  embeddingStatus: 'generated' | 'pending' | 'failed';
  createdAt: Date;
}
```

#### CreateManualPersonaDto

**Location**: `/workspace/grove-backend/src/dev/dto/create-manual-persona.dto.ts:22-42`

```typescript
export class CreateManualPersonaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(500)
  interests: string;        // ✅ CORRECT

  @IsString()
  @IsOptional()
  @MaxLength(500)
  deepDive?: string;        // ✅ CORRECT
}
```

#### DevService.listPersonas()

**Location**: `/workspace/grove-backend/src/dev/dev.service.ts` (lines ~420-448)

```typescript
async listPersonas(orgId: string): Promise<PersonaResponse[]> {
  const users = await this.prisma.user.findMany({
    where: { orgId, isTestData: true },
    include: { profile: true, embedding: true },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    interests: user.profile?.interests || '',      // ✅ CORRECT
    project: user.profile?.project || '',
    connectionType: user.profile?.connectionType || '',
    deepDive: user.profile?.deepDive || undefined, // ✅ CORRECT
    preferences: user.profile?.preferences || undefined,
    embeddingStatus: user.embedding ? 'generated' : 'pending',
    createdAt: user.createdAt,
  }));
}
```

**Verdict**: ✅ Backend DTOs and services are correct.

---

### 3. Frontend Type Definitions (OUTDATED - NEEDS FIX)

#### Problem: devApiService.ts still uses old field names

**Location**: `/workspace/src/lib/devApiService.ts:13-24`

```typescript
export interface PersonaResponse {
  id: string;
  name: string;
  email: string;
  nicheInterest: string;    // ❌ WRONG - Should be "interests"
  project: string;
  connectionType: string;
  rabbitHole?: string;      // ❌ WRONG - Should be "deepDive"
  preferences?: string;
  embeddingStatus: 'generated' | 'pending' | 'failed';
  createdAt: string;
}
```

**Impact**:
- When backend returns `{ interests: "Sourdough baking", deepDive: "..." }`, frontend expects `nicheInterest` and `rabbitHole`
- TypeScript doesn't error because it's a JSON response at runtime
- But accessing `persona.nicheInterest` returns `undefined`

#### Also Affected: MatchPreview Interface

**Location**: `/workspace/src/lib/devApiService.ts:58-64`

```typescript
export interface MatchPreview {
  userId: string;
  name: string;
  email: string;
  nicheInterest: string;    // ❌ WRONG - Should be "interests"
  similarityScore: number;
}
```

#### Also Affected: CreateManualPersonaRequest

**Location**: `/workspace/src/lib/devApiService.ts:44-52`

```typescript
export interface CreateManualPersonaRequest {
  name: string;
  email: string;
  nicheInterest: string;    // ❌ WRONG
  project: string;
  connectionType: string;
  rabbitHole?: string;      // ❌ WRONG
  preferences?: string;
}
```

**Verdict**: ❌ Frontend types are outdated and must be updated.

---

### 4. Frontend Display Components (USING WRONG FIELDS)

#### PersonaList.tsx

**Location**: `/workspace/src/admin/dev/components/PersonaList.tsx`

**Line 136**: Table header says "Interest" (correct conceptually)

**Lines 150-154**: Displays persona interest
```tsx
<TableCell className="max-w-xs">
  <p className="text-sm truncate" title={persona.nicheInterest}>
    {persona.nicheInterest}   {/* ❌ ACCESSING WRONG FIELD */}
  </p>
</TableCell>
```

**Lines 226-228**: Match preview displays interest
```tsx
<p className="text-sm text-muted-foreground">{match.email}</p>
<p className="text-sm mt-2">{match.nicheInterest}</p>  {/* ❌ WRONG FIELD */}
```

**Actual Runtime Behavior**:
- Backend sends: `{ interests: "Mechanical keyboards", deepDive: "QMK firmware" }`
- Frontend accesses: `persona.nicheInterest` → `undefined`
- Display shows: Empty/blank field

**Verdict**: ❌ Frontend components must access correct field names.

---

### 5. Backend SQL Query Bug (CRITICAL BUG)

#### DevService.previewMatches()

**Location**: `/workspace/grove-backend/src/dev/dev.service.ts` (lines ~483-515)

```typescript
async previewMatches(userId: string, limit: number = 10) {
  const userEmbedding = await this.prisma.embedding.findUnique({
    where: { userId },
  });

  if (!userEmbedding) {
    return {
      userId,
      matches: [],
      message: 'No embedding found. Embedding must be generated first.',
    };
  }

  // ❌ BUG: Raw SQL query references non-existent column
  const matches = await this.prisma.$queryRaw<
    Array<{
      user_id: string;
      name: string;
      email: string;
      niche_interest: string;   // ❌ Column doesn't exist anymore
      similarity_score: number;
    }>
  >`
    SELECT
      u.id as user_id,
      u.name,
      u.email,
      p.niche_interest,           -- ❌ ERROR: column "niche_interest" does not exist
      1 - (e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id = ${userId})) as similarity_score
    FROM users u
    INNER JOIN profiles p ON p.user_id = u.id
    INNER JOIN embeddings e ON e.user_id = u.id
    WHERE u.id != ${userId}
      AND u.is_test_data = true
      AND u.status = 'active'
    ORDER BY e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id = ${userId})
    LIMIT ${limit}
  `;

  return {
    userId,
    matches: matches.map((match) => ({
      userId: match.user_id,
      name: match.name,
      email: match.email,
      interests: match.niche_interest,  // ❌ Mapping from wrong field
      similarityScore: Number(match.similarity_score.toFixed(4)),
    })),
  };
}
```

**SQL Error**:
```
ERROR:  column "niche_interest" does not exist
LINE 6:       p.niche_interest,
              ^
```

**Fix Required**:
```typescript
const matches = await this.prisma.$queryRaw<
  Array<{
    user_id: string;
    name: string;
    email: string;
    interests: string;        // ✅ FIX: Correct column name
    similarity_score: number;
  }>
>`
  SELECT
    u.id as user_id,
    u.name,
    u.email,
    p.interests,              -- ✅ FIX: Use correct column name
    1 - (e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id = ${userId})) as similarity_score
  FROM users u
  INNER JOIN profiles p ON p.user_id = u.id
  INNER JOIN embeddings e ON e.user_id = u.id
  WHERE u.id != ${userId}
    AND u.is_test_data = true
    AND u.status = 'active'
  ORDER BY e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id = ${userId})
  LIMIT ${limit}
`;

return {
  userId,
  matches: matches.map((match) => ({
    userId: match.user_id,
    name: match.name,
    email: match.email,
    interests: match.interests,  // ✅ FIX: Map from correct field
    similarityScore: Number(match.similarity_score.toFixed(4)),
  })),
};
```

**Verdict**: ❌ Critical SQL bug prevents match preview from working.

---

### 6. Main App vs Dev Dashboard Comparison

#### Main App (Working Correctly)

**Frontend Types** (`/workspace/src/types/api.ts:54-73`):
```typescript
export interface OnboardingResponses {
  name: string;
  interests: string;        // ✅ CORRECT
  project: string;
  connectionType: ConnectionType;
  deepDive?: string;        // ✅ CORRECT
  preferences?: string;
}

export interface Profile {
  id: string;
  userId: string;
  interests: string;        // ✅ CORRECT
  project: string;
  connectionType: ConnectionType;
  deepDive?: string;        // ✅ CORRECT
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}
```

**MatchCard Component** (`/workspace/src/components/MatchCard.tsx:115`):
```tsx
{match.interests.map((interest, index) => (  // ✅ CORRECT - Uses interests array
  <Badge key={index}>
    {interest}
  </Badge>
))}
```

**Verdict**: ✅ Main app uses correct field names everywhere.

---

## Why The Main App Works But Dev Dashboard Doesn't

### Architectural Insight

The codebase has **two separate API service layers**:

1. **Main App API** (`/workspace/src/lib/apiService.ts` + `/workspace/src/types/api.ts`)
   - Used by: Dashboard, Onboarding, MatchCard
   - Status: ✅ Updated during field rename
   - Calls: `/api/profiles`, `/api/matches`, `/api/intros`

2. **Dev Dashboard API** (`/workspace/src/lib/devApiService.ts`)
   - Used by: DevDashboardPage, PersonaList, PersonaGenerator
   - Status: ❌ NOT updated during field rename
   - Calls: `/admin/dev/personas`, `/admin/dev/personas/:id/matches`

**Result**:
- Regular users experience no issues
- Super admins using dev dashboard see broken UI

---

## Code References Summary

### Files That Need Updates

| File | Location | Issue | Lines |
|------|----------|-------|-------|
| `devApiService.ts` | `/workspace/src/lib/devApiService.ts` | Type definitions use old field names | 17-20, 62, 48-50 |
| `PersonaList.tsx` | `/workspace/src/admin/dev/components/PersonaList.tsx` | Accesses wrong fields | 151-152, 228 |
| `dev.service.ts` | `/workspace/grove-backend/src/dev/dev.service.ts` | Raw SQL query references non-existent column | ~505 (in `previewMatches()`) |

### Files That Are Correct (No Changes Needed)

| File | Status | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | ✅ Correct | Field rename migration applied |
| `persona-response.dto.ts` | ✅ Correct | Backend DTO updated |
| `create-manual-persona.dto.ts` | ✅ Correct | Backend DTO updated |
| `dev.service.ts` (listPersonas) | ✅ Correct | Returns correct field names |
| `api.ts` (main app types) | ✅ Correct | Main app types updated |
| `Onboarding.tsx` | ✅ Correct | Uses correct field names |
| `MatchCard.tsx` | ✅ Correct | Uses correct field names |

---

## Specific Code Fixes Required

### Fix 1: Update Frontend Type Definitions

**File**: `/workspace/src/lib/devApiService.ts`

**Lines 13-24** - Update PersonaResponse interface:
```typescript
// BEFORE (WRONG):
export interface PersonaResponse {
  id: string;
  name: string;
  email: string;
  nicheInterest: string;    // ❌
  project: string;
  connectionType: string;
  rabbitHole?: string;      // ❌
  preferences?: string;
  embeddingStatus: 'generated' | 'pending' | 'failed';
  createdAt: string;
}

// AFTER (CORRECT):
export interface PersonaResponse {
  id: string;
  name: string;
  email: string;
  interests: string;        // ✅
  project: string;
  connectionType: string;
  deepDive?: string;        // ✅
  preferences?: string;
  embeddingStatus: 'generated' | 'pending' | 'failed';
  createdAt: string;
}
```

**Lines 44-52** - Update CreateManualPersonaRequest interface:
```typescript
// BEFORE (WRONG):
export interface CreateManualPersonaRequest {
  name: string;
  email: string;
  nicheInterest: string;    // ❌
  project: string;
  connectionType: string;
  rabbitHole?: string;      // ❌
  preferences?: string;
}

// AFTER (CORRECT):
export interface CreateManualPersonaRequest {
  name: string;
  email: string;
  interests: string;        // ✅
  project: string;
  connectionType: string;
  deepDive?: string;        // ✅
  preferences?: string;
}
```

**Lines 58-64** - Update MatchPreview interface:
```typescript
// BEFORE (WRONG):
export interface MatchPreview {
  userId: string;
  name: string;
  email: string;
  nicheInterest: string;    // ❌
  similarityScore: number;
}

// AFTER (CORRECT):
export interface MatchPreview {
  userId: string;
  name: string;
  email: string;
  interests: string;        // ✅
  similarityScore: number;
}
```

---

### Fix 2: Update PersonaList Component

**File**: `/workspace/src/admin/dev/components/PersonaList.tsx`

**Lines 150-154** - Update field access in table:
```tsx
{/* BEFORE (WRONG): */}
<TableCell className="max-w-xs">
  <p className="text-sm truncate" title={persona.nicheInterest}>
    {persona.nicheInterest}
  </p>
</TableCell>

{/* AFTER (CORRECT): */}
<TableCell className="max-w-xs">
  <p className="text-sm truncate" title={persona.interests}>
    {persona.interests}
  </p>
</TableCell>
```

**Line 228** - Update field access in match preview dialog:
```tsx
{/* BEFORE (WRONG): */}
<p className="text-sm mt-2">{match.nicheInterest}</p>

{/* AFTER (CORRECT): */}
<p className="text-sm mt-2">{match.interests}</p>
```

---

### Fix 3: Update SQL Query in previewMatches()

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Lines ~483-515** - Fix raw SQL query:

**Change the TypeScript type annotation**:
```typescript
// BEFORE (WRONG):
const matches = await this.prisma.$queryRaw<
  Array<{
    user_id: string;
    name: string;
    email: string;
    niche_interest: string;   // ❌
    similarity_score: number;
  }>
>

// AFTER (CORRECT):
const matches = await this.prisma.$queryRaw<
  Array<{
    user_id: string;
    name: string;
    email: string;
    interests: string;        // ✅
    similarity_score: number;
  }>
>
```

**Change the SQL query column reference**:
```sql
-- BEFORE (WRONG):
SELECT
  u.id as user_id,
  u.name,
  u.email,
  p.niche_interest,           -- ❌ Column doesn't exist

-- AFTER (CORRECT):
SELECT
  u.id as user_id,
  u.name,
  u.email,
  p.interests,                -- ✅ Correct column name
```

**Change the return mapping**:
```typescript
// BEFORE (WRONG):
return {
  userId,
  matches: matches.map((match) => ({
    userId: match.user_id,
    name: match.name,
    email: match.email,
    interests: match.niche_interest,  // ❌ Mapping from wrong field
    similarityScore: Number(match.similarity_score.toFixed(4)),
  })),
};

// AFTER (CORRECT):
return {
  userId,
  matches: matches.map((match) => ({
    userId: match.user_id,
    name: match.name,
    email: match.email,
    interests: match.interests,       // ✅ Mapping from correct field
    similarityScore: Number(match.similarity_score.toFixed(4)),
  })),
};
```

---

## Testing Strategy

### Manual Testing Checklist

After applying fixes:

1. **Dev Dashboard - List Personas**
   - [ ] Navigate to `/admin/dev`
   - [ ] Generate test personas
   - [ ] Verify "Interest" column shows persona interests (not blank)
   - [ ] Check that interests display correctly in table

2. **Dev Dashboard - Match Preview**
   - [ ] Click "Matches" button on a persona with embedding status = "generated"
   - [ ] Verify dialog opens without SQL errors
   - [ ] Verify match list shows candidate interests
   - [ ] Check similarity scores display correctly

3. **Dev Dashboard - Create Manual Persona**
   - [ ] Switch to "Generate" tab
   - [ ] Create manual persona with interests field
   - [ ] Verify persona appears in list with correct interest

4. **Dev Dashboard - Export/Import**
   - [ ] Export personas as JSON
   - [ ] Verify JSON contains `interests` field (not `nicheInterest`)
   - [ ] Import personas back
   - [ ] Verify imported personas display correctly

5. **Main App - Regression Test**
   - [ ] Verify main app Dashboard still works
   - [ ] Verify Onboarding flow still works
   - [ ] Verify MatchCard displays interests correctly

### Automated Testing

**Backend Tests to Update**:
- `/workspace/grove-backend/src/dev/dev.service.spec.ts` (if exists)
- Mock data should use `interests` and `deepDive` fields

**Frontend Tests to Update**:
- Any tests that mock `PersonaResponse` objects
- Update mocks to use correct field names

---

## Historical Context

### When Field Rename Occurred

**Commit**: `ce3dc9cfebae3f4788b1136a64b4b521417989ab`
**Date**: 2025-10-31 12:04:48 UTC
**Branch**: `feature/persona-diversity-improvements`
**Message**: "feat: Add diversity testing infrastructure for persona generation (Phase 1)"

**Rename Summary**:
- `niche_interest` → `interests`
- `rabbit_hole` → `deep_dive`
- `goals` → `project` (note: `project` was already the correct name, no actual rename needed)

**Migration File**: `prisma/migrations/20251031025811_rename_fields_interests_and_deep_dive/migration.sql`

### Related Research

**Document**: `thoughts/research/2025-10-31-profile-model-multiple-interests-rearchitecture.md`

This document explored the possibility of supporting multiple interests (array field) instead of a single interest string. It documented:
- Current single-interest model
- Proposed multi-interest architecture
- Migration complexity analysis
- Embedding generation changes needed

The field rename was a precursor step to this larger rearchitecture effort.

---

## Open Questions

1. **Why wasn't the frontend updated in the same commit?**
   - Likely oversight during migration
   - Backend and frontend types should have been updated together
   - Suggests need for better cross-stack migration checklist

2. **Are there other places still using old field names?**
   - Test files: `openai.service.spec.ts`, `embedding-generation.processor.spec.ts`
   - These are just test mocks and don't affect production
   - Should be updated for consistency

3. **Should we add migration validation?**
   - Consider adding a post-migration script that validates all field references
   - Could catch mismatches between schema and code automatically

---

## Recommendations

### Immediate (Fix Bug)

1. Apply all three fixes listed above
2. Test in development environment
3. Deploy to production once verified

### Short-term (Prevent Recurrence)

1. Create migration checklist that includes:
   - [ ] Database schema change
   - [ ] Backend DTOs updated
   - [ ] Backend services updated
   - [ ] Frontend types updated
   - [ ] Frontend components updated
   - [ ] Test mocks updated
   - [ ] Raw SQL queries updated

2. Add TypeScript strict mode to catch type mismatches earlier

3. Consider using code generation to keep frontend/backend types in sync:
   - Use Prisma Client types directly in backend
   - Generate TypeScript types from backend DTOs for frontend
   - Tools: `openapi-typescript`, `prisma-to-typescript`, etc.

### Long-term (Architecture)

1. **Eliminate Raw SQL Queries Where Possible**
   - The `previewMatches()` raw SQL query is fragile
   - Consider using Prisma's raw query builders with type safety
   - Or extract raw queries into a repository pattern with better encapsulation

2. **Shared Type Definitions**
   - Move API type definitions to a shared package
   - Both frontend and backend import from same source
   - Ensures types stay in sync

3. **Integration Tests**
   - Add E2E tests that call backend and validate frontend displays correctly
   - Would catch frontend-backend mismatches before deployment

---

## Summary

### What Broke

- Dev dashboard persona list shows blank interest fields
- Match preview fails with SQL error "column niche_interest does not exist"

### Root Cause

Database field rename was applied to:
- ✅ Database schema (Prisma migration)
- ✅ Backend DTOs and services
- ✅ Main app frontend types
- ❌ Dev dashboard frontend types (MISSED)
- ❌ Raw SQL query in dev service (MISSED)

### Fix

Update 3 files:
1. `/workspace/src/lib/devApiService.ts` - Update type interfaces
2. `/workspace/src/admin/dev/components/PersonaList.tsx` - Update field access
3. `/workspace/grove-backend/src/dev/dev.service.ts` - Update SQL query

### Prevention

- Use migration checklist
- Consider type code generation
- Eliminate raw SQL where possible
- Add integration tests

---

**End of Research Document**

Last Updated: 2025-10-31 15:48:13 UTC
