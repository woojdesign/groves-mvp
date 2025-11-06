---
title: Complete Field Rename Migration - interests and deepDive
date: 2025-10-31
type: implementation-plan
status: ready
priority: high
tags: [database, migration, typescript, cleanup, tech-debt]
related:
  - thoughts/research/2025-10-31-profile-model-multiple-interests-rearchitecture.md
---

# Complete Field Rename Migration: interests and deepDive

## Overview

### Problem Statement
A database field rename migration was partially completed, leaving TypeScript compilation errors in test files and utility scripts. The migration renamed:
- Database: `niche_interest` → `interests`
- Database: `rabbit_hole` → `deep_dive`
- TypeScript: `nicheInterest` → `interests`
- TypeScript: `rabbitHole` → `deepDive`

While the core application code, DTOs, and database schema have been updated, **4 files** still reference the old field names in test mocks and one utility script.

### Current State Analysis

**Completed:**
- ✅ Prisma schema updated (`Profile` model uses `interests` and `deepDive`)
- ✅ Database migration executed (column rename from `niche_interest` to `interests`, `rabbit_hole` to `deep_dive`)
- ✅ DTOs updated (`CreateProfileDto`, `UpdateProfileDto`, `PersonaResponse`)
- ✅ Core services updated (`ProfilesService`, `DevService`, `GdprService`)
- ✅ Processors updated (`EmbeddingGenerationProcessor`)
- ✅ Matching engines updated (`VectorMatchingEngine`)
- ✅ Seed data updated (`prisma/seed.ts`)
- ✅ Prisma Client regenerated

**Remaining Issues:**
The actual errors are limited to **test files and one utility script** that still use old field names in their mock data:

1. **`src/jobs/embedding-generation.processor.spec.ts`** - 6 references
   - Lines 66, 68, 104, 106, 139, 141
   - Mock profile objects use `nicheInterest` and `rabbitHole`

2. **`src/openai/openai.service.spec.ts`** - 4 references
   - Lines 34, 45, 57
   - Test description and comments reference old names

3. **`test-matching.ts`** - 1 reference
   - Line 72: SQL query uses `p.niche_interest`

4. **Documentation files** (read-only, informational)
   - `prisma/migrations/20251031025811_rename_fields_interests_and_deep_dive/migration.sql`
   - `prisma/migrations/20251022_init/migration.sql`
   - `thoughts/research/2025-10-31-profile-model-multiple-interests-rearchitecture.md`

### Success Criteria
1. All TypeScript files compile without errors related to field names
2. All test files use correct field names (`interests`, `deepDive`)
3. All utility scripts use correct database column names (`interests`, `deep_dive`)
4. No references to old field names in active code (excluding migration history)
5. All tests pass after changes

## Requirements Analysis

### Functional Requirements
- FR1: Test files must use updated field names that match Prisma schema
- FR2: Utility scripts must use SQL column names that match current schema
- FR3: Tests must continue to pass with identical behavior
- FR4: No breaking changes to application logic

### Technical Requirements
- TR1: Update test mock objects to use `interests` and `deepDive`
- TR2: Update SQL queries to use `interests` and `deep_dive` columns
- TR3: Update test descriptions and comments for clarity
- TR4: Verify all tests pass after changes

### Out of Scope
- Migration files (historical record, should not be modified)
- Documentation files (will naturally reference old names for context)
- Any new functionality or refactoring

## Implementation Plan

### Phase 1: Update Test Files (EmbeddingGenerationProcessor)
**File:** `/workspace/grove-backend/src/jobs/embedding-generation.processor.spec.ts`

**Changes Required:**
1. Line 66: Change `nicheInterest:` to `interests:`
2. Line 68: Change `rabbitHole:` to `deepDive:`
3. Line 104: Change `mockProfile.nicheInterest` to `mockProfile.interests`
4. Line 106: Change `mockProfile.rabbitHole` to `mockProfile.deepDive`
5. Line 139: Change `nicheInterest:` to `interests:`
6. Line 141: Change `rabbitHole:` to `deepDive:`

**Exact Transformations:**

```typescript
// Line 66
- nicheInterest: 'AI and machine learning',
+ interests: 'AI and machine learning',

// Line 68
- rabbitHole: 'Graph neural networks',
+ deepDive: 'Graph neural networks',

// Line 104
- mockProfile.nicheInterest,
+ mockProfile.interests,

// Line 106
- mockProfile.rabbitHole,
+ mockProfile.deepDive,

// Line 139
- nicheInterest: 'AI and machine learning',
+ interests: 'AI and machine learning',

// Line 141
- rabbitHole: null,
+ deepDive: null,
```

**Success Criteria:**
- Test file compiles without errors
- Test mocks match actual Prisma schema types
- All tests pass

**Time Estimate:** 5 minutes

---

### Phase 2: Update Test Files (OpenAI Service)
**File:** `/workspace/grove-backend/src/openai/openai.service.spec.ts`

**Changes Required:**
1. Line 34: Update test description
2. Line 45: Update test description
3. Line 57: Update test description

**Exact Transformations:**

```typescript
// Line 34
- it('should concatenate nicheInterest and project', () => {
+ it('should concatenate interests and project', () => {

// Line 45
- it('should include rabbitHole if provided', () => {
+ it('should include deepDive if provided', () => {

// Line 57
- it('should handle empty rabbitHole', () => {
+ it('should handle empty deepDive', () => {
```

**Success Criteria:**
- Test descriptions accurately reflect current field names
- No functional changes to test logic
- All tests pass

**Time Estimate:** 3 minutes

---

### Phase 3: Update Utility Script (test-matching.ts)
**File:** `/workspace/grove-backend/test-matching.ts`

**Changes Required:**
1. Line 72: Update SQL column name in query

**Exact Transformation:**

```typescript
// Line 72
- p.niche_interest,
+ p.interests,
```

**Full Context (lines 68-82):**
```typescript
    const similarUsers: any = await prisma.$queryRaw`
      SELECT
        u.email,
        u.name,
        p.interests,
        1 - (e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id::text = ${user.id})) AS similarity_score
      FROM embeddings e
      JOIN users u ON e.user_id::text = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE e.user_id::text != ${user.id}
        AND e.embedding IS NOT NULL
      ORDER BY similarity_score DESC
      LIMIT 5
    `;
```

**Success Criteria:**
- SQL query uses correct column name matching database schema
- Script executes without database errors
- Query results are identical to before

**Time Estimate:** 3 minutes

---

### Phase 4: Verification and Testing
**Goal:** Ensure all changes are correct and complete

**Steps:**

1. **TypeScript Compilation Check**
   ```bash
   npm run build
   ```
   - Expected: Clean build with no errors
   - No references to old field names in error output

2. **Run All Tests**
   ```bash
   npm test
   ```
   - Expected: All tests pass
   - Focus on updated test files:
     - `src/jobs/embedding-generation.processor.spec.ts`
     - `src/openai/openai.service.spec.ts`

3. **Search for Remaining References**
   ```bash
   # Search TypeScript/JavaScript files only (exclude migrations)
   grep -r "nicheInterest" src/ test-*.ts check-*.ts queue-*.ts --include="*.ts" --include="*.js"
   grep -r "rabbitHole" src/ test-*.ts check-*.ts queue-*.ts --include="*.ts" --include="*.js"

   # Search SQL in active code (exclude migration files)
   grep -r "niche_interest" src/ test-*.ts --include="*.ts"
   grep -r "rabbit_hole" src/ test-*.ts --include="*.ts"
   ```
   - Expected: No results (all references updated)

4. **Manual Utility Script Test**
   ```bash
   # Test the updated script
   npx ts-node test-matching.ts
   ```
   - Expected: Script runs successfully
   - No SQL errors about missing columns

**Success Criteria:**
- Zero TypeScript compilation errors
- All tests pass
- No grep matches for old field names in active code
- Utility scripts execute without errors

**Time Estimate:** 10 minutes

---

## Testing Strategy

### Unit Tests
**Modified Tests:**
- `src/jobs/embedding-generation.processor.spec.ts`
  - All existing tests should pass unchanged
  - Mock data now matches Prisma types exactly

- `src/openai/openai.service.spec.ts`
  - All existing tests should pass unchanged
  - Test descriptions now use current terminology

**Verification:**
```bash
npm test -- embedding-generation.processor.spec.ts
npm test -- openai.service.spec.ts
```

### Integration Tests
**Manual Testing:**
1. Run embedding generation queue with test data
2. Execute matching algorithm
3. Verify no runtime errors

### Manual Verification
1. **Database Query Test:**
   ```bash
   npx ts-node test-matching.ts
   ```
   - Should complete without SQL errors
   - Should return similarity results

2. **Seed Data Test:**
   ```bash
   npx ts-node prisma/seed.ts
   ```
   - Should create profiles successfully
   - Should queue embeddings

## Risk Assessment

### Low Risk
- **Test-only changes:** Changes are limited to test mocks and descriptions
- **No business logic impact:** Application code already updated
- **Simple find/replace:** Straightforward property renames
- **Type-safe:** TypeScript will catch any errors

### Mitigation Strategies
1. **Incremental changes:** Update one file at a time
2. **Run tests after each file:** Immediate feedback on issues
3. **Git tracking:** Easy rollback if needed
4. **Type checking:** Compile before running tests

### Rollback Plan
If issues arise:
1. Git revert the specific file: `git checkout HEAD -- <file>`
2. Re-run compilation and tests
3. All changes are isolated and independent

## File-by-File Implementation Guide

### File 1: src/jobs/embedding-generation.processor.spec.ts

**Current Issues:** 6 references to old field names

**Line-by-line changes:**

```typescript
// CHANGE 1 - Line 66
OLD:         nicheInterest: 'AI and machine learning',
NEW:         interests: 'AI and machine learning',

// CHANGE 2 - Line 68
OLD:         rabbitHole: 'Graph neural networks',
NEW:         deepDive: 'Graph neural networks',

// CHANGE 3 - Line 104
OLD:         mockProfile.nicheInterest,
NEW:         mockProfile.interests,

// CHANGE 4 - Line 106
OLD:         mockProfile.rabbitHole,
NEW:         mockProfile.deepDive,

// CHANGE 5 - Line 139
OLD:         nicheInterest: 'AI and machine learning',
NEW:         interests: 'AI and machine learning',

// CHANGE 6 - Line 141
OLD:         rabbitHole: null,
NEW:         deepDive: null,
```

**Verification:**
```bash
npm test -- embedding-generation.processor.spec.ts
```

---

### File 2: src/openai/openai.service.spec.ts

**Current Issues:** 3 references in test descriptions

**Line-by-line changes:**

```typescript
// CHANGE 1 - Line 34
OLD:     it('should concatenate nicheInterest and project', () => {
NEW:     it('should concatenate interests and project', () => {

// CHANGE 2 - Line 45
OLD:     it('should include rabbitHole if provided', () => {
NEW:     it('should include deepDive if provided', () => {

// CHANGE 3 - Line 57
OLD:     it('should handle empty rabbitHole', () => {
NEW:     it('should handle empty deepDive', () => {
```

**Verification:**
```bash
npm test -- openai.service.spec.ts
```

---

### File 3: test-matching.ts

**Current Issues:** 1 SQL column reference

**Line-by-line changes:**

```typescript
// CHANGE 1 - Line 72
OLD:         p.niche_interest,
NEW:         p.interests,
```

**Context (lines 68-82):**
```sql
SELECT
  u.email,
  u.name,
  p.interests,  -- UPDATED LINE
  1 - (e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id::text = ${user.id})) AS similarity_score
FROM embeddings e
JOIN users u ON e.user_id::text = u.id
JOIN profiles p ON u.id = p.user_id
WHERE e.user_id::text != ${user.id}
  AND e.embedding IS NOT NULL
ORDER BY similarity_score DESC
LIMIT 5
```

**Verification:**
```bash
npx ts-node test-matching.ts
```

---

## Summary

### Total Scope
- **Files to modify:** 3
- **Total changes:** 10 simple find/replace operations
- **Lines affected:** 10 lines across 3 files
- **Estimated time:** 20 minutes total

### Change Distribution
1. `src/jobs/embedding-generation.processor.spec.ts`: 6 changes (property names in mocks)
2. `src/openai/openai.service.spec.ts`: 3 changes (test descriptions)
3. `test-matching.ts`: 1 change (SQL column name)

### Post-Implementation Checklist
- [ ] All TypeScript files compile cleanly
- [ ] All unit tests pass
- [ ] No grep matches for `nicheInterest` in active code
- [ ] No grep matches for `rabbitHole` in active code
- [ ] No grep matches for `niche_interest` in active SQL (excluding migrations)
- [ ] Utility script `test-matching.ts` executes successfully
- [ ] Seed script `prisma/seed.ts` executes successfully

### Next Steps After Completion
1. Commit changes with descriptive message
2. Create PR if using branching workflow
3. Deploy to staging/development environment
4. Verify in deployed environment
5. Close related tickets/issues

---

## Appendix: Complete Change Reference

### TypeScript Property Renames
- `nicheInterest` → `interests` (6 occurrences in test mocks)
- `rabbitHole` → `deepDive` (3 occurrences in test mocks)

### SQL Column Renames
- `niche_interest` → `interests` (1 occurrence in utility script)

### Files Excluded (No Changes Needed)
- Migration files (historical record)
- Documentation files (contextual references)
- All core application code (already updated)
