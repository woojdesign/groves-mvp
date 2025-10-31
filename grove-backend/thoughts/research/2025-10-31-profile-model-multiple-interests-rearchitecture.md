---
doc_type: research
title: "Profile Model Rearchitecture to Support Multiple Interests"
created: 2025-10-31T02:32:21Z
created_by: Claude Code
last_updated: 2025-10-31T02:32:21Z
last_updated_by: Claude Code
status: completed
research_question: "How much work would it be to rearchitecture the Profile model to support multiple interests instead of the current nicheInterest + rabbitHole design?"
tags:
  - profile-model
  - database-schema
  - embeddings
  - matching-engine
  - migration-planning
  - architecture-analysis
related_docs: []
git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
git_branch: main
---

# Research: Profile Model Rearchitecture to Support Multiple Interests

**Date**: 2025-10-31 02:32:21 UTC
**Researcher**: Claude Code
**Git Commit**: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
**Branch**: main
**Repository**: grove-backend

## Research Question

How much work would it be to rearchitecture the Profile model to support multiple interests instead of the current `nicheInterest` + `rabbitHole` design?

## Executive Summary

**Complexity Level**: **MEDIUM-HIGH**

Rearchitecting the Profile model to support multiple interests would require changes across **18 backend files**, **1 frontend file**, database schema modifications, and careful data migration planning. The current system is tightly coupled to the single-interest model through:

1. **Database Schema**: `nicheInterest`, `rabbitHole`, and `project` as TEXT fields
2. **Embedding Generation**: Concatenation logic in `preprocessProfileText()`
3. **Matching Engine**: Shared topic extraction from single fields
4. **DTOs & Validation**: Field-level constraints (20-500 chars)
5. **AI Persona Generation**: Hardcoded prompts expecting single interest structure
6. **Frontend**: Onboarding flow with specific question structure

**Recommended Approach**: **Option B+** (Enhanced hybrid model)
- Keep `nicheInterest` as primary (detailed, 100-500 chars)
- Add `interests` array field (3-5 brief interests, 20-100 chars each)
- Maintain `rabbitHole` for deep exploration context
- Allows gradual migration and backward compatibility

**Estimated Timeline**: 3-5 days for implementation + testing + data migration

---

## Detailed Findings

### 1. Database Schema Impact

#### Current Structure (`prisma/schema.prisma`:84-103)

```prisma
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  nicheInterest  String   @map("niche_interest") @db.Text
  project        String   @db.Text
  connectionType String   @map("connection_type")
  rabbitHole     String?  @map("rabbit_hole") @db.Text
  preferences    String?  @db.Text
  isTestData     Boolean  @default(false) @map("is_test_data")
  // ...
}
```

#### Migration Requirements

**Option A: Multiple Separate Interests**
```sql
-- Add interests array
ALTER TABLE profiles ADD COLUMN interests TEXT[];

-- Drop old columns (breaking change)
ALTER TABLE profiles DROP COLUMN niche_interest;
ALTER TABLE profiles DROP COLUMN rabbit_hole;

-- Add constraints
ALTER TABLE profiles ADD CONSTRAINT interests_min_length
  CHECK (array_length(interests, 1) >= 1 AND array_length(interests, 1) <= 5);
```

**Option B: Hybrid Model (RECOMMENDED)**
```sql
-- Add interests array (non-breaking)
ALTER TABLE profiles ADD COLUMN interests TEXT[];

-- Keep existing columns for backward compatibility
-- Gradually deprecate in future version

-- Add constraint
ALTER TABLE profiles ADD CONSTRAINT interests_max_length
  CHECK (interests IS NULL OR array_length(interests, 1) <= 5);
```

**Migration Complexity**:
- Need to create new Prisma migration file
- Existing data in `nicheInterest` + `rabbitHole` needs conversion strategy
- Vector embeddings must be regenerated for all users after migration
- Estimated downtime: 5-15 minutes depending on user count

#### Backward Compatibility Concerns

**Option A** (Breaking):
- All existing profiles become invalid
- Must migrate all data before deployment
- Old mobile apps break if they exist
- Embedding regeneration required for all users

**Option B** (Non-breaking):
- Existing profiles continue to work
- New profiles can use either format
- Gradual migration possible
- Can support both old and new clients during transition period

---

### 2. Code Locations Requiring Changes

#### Backend Files (18 files)

**Core Services**:
1. `/workspace/grove-backend/src/profiles/profiles.service.ts` - Profile CRUD operations
2. `/workspace/grove-backend/src/embeddings/embeddings.service.ts` - Embedding storage (minimal changes)
3. `/workspace/grove-backend/src/openai/openai.service.ts` - Text preprocessing logic
4. `/workspace/grove-backend/src/matching/engines/vector-matching.engine.ts` - Shared topic extraction
5. `/workspace/grove-backend/src/gdpr/gdpr.service.ts` - Data export structure
6. `/workspace/grove-backend/src/dev/dev.service.ts` - Persona generation logic
7. `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts` - Embedding job processing

**DTOs** (5 files):
8. `/workspace/grove-backend/src/profiles/dto/create-profile.dto.ts` - Input validation
9. `/workspace/grove-backend/src/profiles/dto/update-profile.dto.ts` - Update validation
10. `/workspace/grove-backend/src/profiles/dto/profile-response.dto.ts` - Response structure
11. `/workspace/grove-backend/src/dev/dto/create-manual-persona.dto.ts` - Dev persona creation
12. `/workspace/grove-backend/src/dev/dto/persona-response.dto.ts` - Dev persona response

**Tests** (4 files):
13. `/workspace/grove-backend/src/profiles/profiles.service.spec.ts`
14. `/workspace/grove-backend/src/jobs/embedding-generation.processor.spec.ts`
15. `/workspace/grove-backend/src/openai/openai.service.spec.ts`
16. `/workspace/grove-backend/src/profiles/profiles.controller.spec.ts`

**Seed & Scripts** (2 files):
17. `/workspace/grove-backend/prisma/seed.ts` - Database seeding
18. `/workspace/grove-backend/queue-embeddings.ts` - Embedding queue script

#### Frontend Files (1 file)

19. `/workspace/src/components/Onboarding.tsx` - User onboarding flow

**Critical Frontend Changes Needed**:
- Lines 30-40: Change single textarea to multiple interest inputs
- Lines 53-58: Update/remove `rabbit_hole` question or repurpose
- Lines 94-102: Update API payload mapping to support array

Current onboarding structure:
```tsx
{
  id: 'niche_interest',
  question: 'What\'s a niche interest you could talk about for an hour?',
  type: 'textarea'  // Single input
}
```

Would become:
```tsx
{
  id: 'interests',
  question: 'What are 3-5 interests you\'d love to connect over?',
  type: 'multi-input'  // New component needed
}
```

---

### 3. Embedding Generation Flow Analysis

#### Current Flow (`src/openai/openai.service.ts`:125-140)

```typescript
preprocessProfileText(
  nicheInterest: string,
  project: string,
  rabbitHole?: string,
): string {
  const parts = [
    `Interest: ${nicheInterest.trim()}`,
    `Project: ${project.trim()}`,
  ];

  if (rabbitHole && rabbitHole.trim()) {
    parts.push(`Exploring: ${rabbitHole.trim()}`);
  }

  return parts.join('. ');
}
```

**Example Output**:
```
"Interest: Building mechanical keyboards with custom switches.
Project: Designing my first split keyboard with hot-swappable switches.
Exploring: Learning about switch characteristics and optimal thumb cluster layouts."
```

#### Proposed New Flow (Multiple Interests)

**Option A**: Flatten all interests
```typescript
preprocessProfileText(
  interests: string[],
  project: string,
  context?: string,
): string {
  const parts = [
    `Interests: ${interests.join(', ')}`,
    `Project: ${project.trim()}`,
  ];

  if (context && context.trim()) {
    parts.push(`Context: ${context.trim()}`);
  }

  return parts.join('. ');
}
```

**Option B**: Weight primary interest
```typescript
preprocessProfileText(
  primaryInterest: string,
  secondaryInterests: string[],
  project: string,
  deepDive?: string,
): string {
  const parts = [
    `Primary Interest: ${primaryInterest.trim()}`,
  ];

  if (secondaryInterests.length > 0) {
    parts.push(`Also interested in: ${secondaryInterests.join(', ')}`);
  }

  parts.push(`Project: ${project.trim()}`);

  if (deepDive && deepDive.trim()) {
    parts.push(`Deep Dive: ${deepDive.trim()}`);
  }

  return parts.join('. ');
}
```

**Embedding Model Compatibility**:
- OpenAI's `text-embedding-3-small` (1536 dimensions) handles lists well
- Semantic similarity remains effective with multiple topics
- May actually **improve** matching by capturing broader context
- No model retraining needed

**Impact on Matching Quality**:
- **Potential Improvement**: More diverse matching opportunities
- **Risk**: Could dilute matching if interests are too varied
- **Mitigation**: Implement interest weighting or primary/secondary distinction

---

### 4. Matching Engine Changes

#### Current Shared Topic Extraction (`src/matching/engines/vector-matching.engine.ts`:90-110)

```typescript
// Extract shared topics from interests and projects
const sharedTopics = this.extractSharedTopics(
  sourceProfile.nicheInterest + ' ' + sourceProfile.project,
  candidateProfile.nicheInterest + ' ' + candidateProfile.project,
);

// Check for rabbit hole alignment
if (sourceProfile.rabbitHole && candidateProfile.rabbitHole) {
  const rabbitHoleTopics = this.extractSharedTopics(
    sourceProfile.rabbitHole,
    candidateProfile.rabbitHole,
  );
}
```

#### Required Changes for Multiple Interests

**New Extraction Logic**:
```typescript
// Build combined text from interest array
const sourceText = [
  profile.primaryInterest,
  ...(profile.secondaryInterests || []),
  profile.project
].join(' ');

const candidateText = [
  candidateProfile.primaryInterest,
  ...(candidateProfile.secondaryInterests || []),
  candidateProfile.project
].join(' ');

const sharedTopics = this.extractSharedTopics(sourceText, candidateText);

// Find exact interest overlaps
const exactMatches = this.findExactInterestMatches(
  [...profile.secondaryInterests || [], profile.primaryInterest],
  [...candidateProfile.secondaryInterests || [], candidateProfile.primaryInterest]
);
```

**New Method Needed**:
```typescript
private findExactInterestMatches(
  interests1: string[],
  interests2: string[],
): string[] {
  // Find interests that appear in both arrays
  // Use fuzzy matching for slight variations
}
```

---

### 5. DTO & Validation Changes

#### Current Validation (`src/profiles/dto/create-profile.dto.ts`:19-47)

```typescript
@IsString()
@IsNotEmpty()
@MinLength(20, {
  message: 'Please share a bit more about your niche interest (at least 20 characters)',
})
@MaxLength(500)
nicheInterest: string;

@IsString()
@IsOptional()
@MaxLength(500)
rabbitHole?: string;
```

#### Proposed New Validation (Option B: Hybrid)

```typescript
// Keep existing for backward compatibility
@IsString()
@IsOptional()
@MinLength(20)
@MaxLength(500)
nicheInterest?: string;

// New array-based interests
@IsArray()
@IsOptional()
@ArrayMinSize(1, {
  message: 'Please provide at least 1 interest'
})
@ArrayMaxSize(5, {
  message: 'Maximum 5 interests allowed'
})
@IsString({ each: true })
@MinLength(10, {
  each: true,
  message: 'Each interest should be at least 10 characters'
})
@MaxLength(100, {
  each: true,
  message: 'Each interest should be at most 100 characters'
})
interests?: string[];

// Validation: Must have either nicheInterest OR interests
@ValidateIf(o => !o.nicheInterest && !o.interests)
@IsNotEmpty({
  message: 'Please provide either nicheInterest or interests array'
})
_validateInterests?: any;
```

**Key Validation Rules**:
- 1-5 interests required
- Each interest: 10-100 characters (shorter than current nicheInterest)
- OR maintain old single nicheInterest field (100-500 chars)
- Cannot submit empty profile

---

### 6. AI Prompt Configurability

#### Current Hardcoded Prompts

**Location**: `src/dev/dev.service.ts`:346-459 (114 lines of hardcoded prompt text)

**Current State**:
- Prompt is hardcoded in `buildSeedConstrainedPrompt()` method
- No configuration options
- Difficult to iterate on prompt without code changes
- Tight coupling between prompt structure and code logic

**Prompt Sections**:
1. Intensity level guide (casual/engaged/deep/mixed)
2. Assigned names & interests
3. Critical rules (first person, realistic, varied)
4. Length variance instructions
5. Tone variety examples
6. JSON output format

#### Configurability Options Analysis

**Option 1: Environment Variables** (Simplest)
```env
# .env
PERSONA_PROMPT_TEMPLATE="Generate realistic profiles for {count} people..."
PERSONA_INTENSITY_GUIDE_CASUAL="Casual interest level - common hobbies..."
PERSONA_LENGTH_VARIANCE="true"
```

**Pros**:
- Quick to implement
- No database changes needed
- Easy for ops team to modify

**Cons**:
- Limited flexibility (can't store complex multi-line templates easily)
- Requires app restart to change
- No version control or audit trail
- Hard to manage multiple prompt variants

---

**Option 2: Configuration File** (Moderate)
```yaml
# config/prompts.yaml
persona_generation:
  system_message: "You are a helpful assistant that generates realistic employee profiles..."
  base_template: |
    Generate realistic employee profiles for these {count} people with these pre-assigned interests.

    ASSIGNED NAMES & INTERESTS:
    {persona_list}

    INTENSITY LEVEL: {intensity_guide}

    CRITICAL RULES:
    - Use the EXACT names provided above
    - Base each persona on their assigned interest
    - Write in FIRST PERSON

  intensity_guides:
    casual: "Casual, not obsessed. Simple language. E.g., 'I enjoy X on weekends'"
    engaged: "Actively pursuing, moderate depth. E.g., 'Training for X', 'Learning Y'"
    deep: "Deep expertise with technical details..."
    mixed: "Mix of casual (40%), engaged (40%), and deep (20%)"

  output_format:
    fields: [name, email, nicheInterest, project, connectionType, rabbitHole, preferences]
    response_format: json_object
```

**Implementation**:
```typescript
// src/config/prompts.config.ts
import { readFileSync } from 'fs';
import * as yaml from 'yaml';

export class PromptsConfig {
  private config: any;

  constructor() {
    const file = readFileSync('config/prompts.yaml', 'utf8');
    this.config = yaml.parse(file);
  }

  getPersonaPrompt(options: {
    count: number;
    names: string[];
    interests: string[];
    intensity: string;
  }): string {
    const template = this.config.persona_generation.base_template;
    const guide = this.config.persona_generation.intensity_guides[options.intensity];

    return template
      .replace('{count}', options.count)
      .replace('{intensity_guide}', guide)
      .replace('{persona_list}', this.formatPersonaList(options.names, options.interests));
  }
}
```

**Pros**:
- Version controlled with code
- Easy to read/edit complex prompts
- Supports multiple prompt variants
- Can have different configs per environment

**Cons**:
- Still requires deployment to change
- No runtime editing
- Limited audit trail

---

**Option 3: Database-Stored Prompts** (Most Flexible)

**Schema**:
```prisma
model PromptTemplate {
  id          String   @id @default(uuid())
  name        String   @unique
  category    String   // "persona_generation", "matching_explanation", etc.
  version     Int      @default(1)
  template    String   @db.Text
  variables   Json?    // Expected variables
  isActive    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Implementation**:
```typescript
// src/prompts/prompts.service.ts
@Injectable()
export class PromptsService {
  async getActivePrompt(category: string): Promise<string> {
    const prompt = await this.prisma.promptTemplate.findFirst({
      where: { category, isActive: true },
      orderBy: { version: 'desc' }
    });

    return prompt?.template || this.getFallbackPrompt(category);
  }

  async updatePrompt(category: string, template: string, userId: string) {
    // Create new version
    const current = await this.getActivePrompt(category);
    const newVersion = current ? current.version + 1 : 1;

    // Deactivate old
    await this.prisma.promptTemplate.updateMany({
      where: { category },
      data: { isActive: false }
    });

    // Create new active prompt
    return this.prisma.promptTemplate.create({
      data: {
        category,
        template,
        version: newVersion,
        isActive: true,
        createdBy: userId
      }
    });
  }
}
```

**Admin UI Required**:
- Prompt editor interface
- Version history viewer
- A/B testing support
- Rollback capability

**Pros**:
- Runtime changes without deployment
- Full version history and audit trail
- A/B testing different prompts
- Role-based editing controls
- Can analyze prompt performance

**Cons**:
- Most complex to implement
- Requires admin UI
- Need security controls (who can edit prompts)
- Database dependency

---

**Option 4: Hybrid Approach** (RECOMMENDED)

Combine config files (for structure) + database (for content):

```yaml
# config/prompts.yaml - Structure only
persona_generation:
  template_ref: "persona_base_v1"  # References DB
  required_sections:
    - intensity_guide
    - rules
    - output_format
  fallback: |
    # Hardcoded fallback if DB unavailable
```

```typescript
// Service implementation
async buildPersonaPrompt(options) {
  try {
    // Try to get from database (hot-swappable)
    const dbTemplate = await this.promptsService.getTemplate('persona_base_v1');
    if (dbTemplate) {
      return this.renderTemplate(dbTemplate, options);
    }
  } catch (error) {
    this.logger.warn('Failed to load DB template, using fallback');
  }

  // Fallback to config file
  return this.renderTemplate(this.configService.get('prompts.persona_generation.fallback'), options);
}
```

**Benefits**:
- Fast iteration in production via DB
- Fallback safety via config
- Version control for prompt structure
- Runtime flexibility for prompt content

---

### 7. Data Migration Strategy

#### Current Production Data

Assumptions (need to verify):
- ~100-1000 existing user profiles
- Each has `nicheInterest`, `project`, optional `rabbitHole`
- All have corresponding embeddings in vector database

#### Migration Scenarios

**Scenario A: One-time Migration (Breaking)**

```sql
-- Step 1: Backup
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Step 2: Add new column
ALTER TABLE profiles ADD COLUMN interests TEXT[];

-- Step 3: Migrate data (convert single interest to array)
UPDATE profiles
SET interests = ARRAY[niche_interest]
WHERE niche_interest IS NOT NULL;

-- Step 4: Add rabbitHole as second interest if exists
UPDATE profiles
SET interests = interests || ARRAY[rabbit_hole]
WHERE rabbit_hole IS NOT NULL AND rabbit_hole != '';

-- Step 5: Drop old columns
ALTER TABLE profiles DROP COLUMN niche_interest;
ALTER TABLE profiles DROP COLUMN rabbit_hole;

-- Step 6: Make interests required
ALTER TABLE profiles ALTER COLUMN interests SET NOT NULL;

-- Step 7: Delete all embeddings (force regeneration)
DELETE FROM embeddings;
```

**Timeline**:
- Preparation: 2 hours (test migration script)
- Execution: 15 minutes downtime
- Embedding regeneration: 30-60 minutes background (async)
- Total: ~3 hours

**Risks**:
- Breaking change for any mobile clients
- Temporary matching unavailable during embedding regeneration
- Rollback requires database restore

---

**Scenario B: Gradual Migration (Non-breaking) - RECOMMENDED**

```sql
-- Phase 1: Add new column (no downtime)
ALTER TABLE profiles ADD COLUMN interests TEXT[];

-- Phase 2: Backfill data (background job)
-- Convert existing profiles over time
UPDATE profiles
SET interests = ARRAY[niche_interest]
WHERE interests IS NULL
AND niche_interest IS NOT NULL
LIMIT 100;  -- Batch processing

-- Phase 3: Dual-write period (both old and new format supported)
-- Application code supports reading/writing both formats
-- New profiles use interests array
-- Old profiles still work with nicheInterest

-- Phase 4: After 30 days, deprecate old fields
-- Mark columns as deprecated in schema
-- Schedule deletion for next major version
```

**Timeline**:
- Phase 1: 1 hour (deploy new schema)
- Phase 2: 1-2 days background processing
- Phase 3: 14-30 days dual support
- Phase 4: Next major release

**Benefits**:
- Zero downtime
- Gradual rollout
- Easy rollback
- Time to monitor for issues

---

### 8. Testing Strategy

#### Required Test Updates

**Unit Tests** (4 files to update):
1. `profiles.service.spec.ts` - Test array validation
2. `embedding-generation.processor.spec.ts` - Test new preprocessing
3. `openai.service.spec.ts` - Test multi-interest embedding
4. `vector-matching.engine.spec.ts` - Test shared interest extraction

**Integration Tests** (new):
```typescript
// tests/integration/profile-migration.spec.ts
describe('Profile Migration', () => {
  it('should support legacy single-interest profiles', async () => {
    const profile = await createLegacyProfile({
      nicheInterest: 'Mechanical keyboards',
      rabbitHole: 'QMK firmware'
    });

    expect(profile).toHaveProperty('nicheInterest');
    expect(await getEmbedding(profile.userId)).toBeDefined();
  });

  it('should support new multi-interest profiles', async () => {
    const profile = await createProfile({
      interests: ['Mechanical keyboards', 'Home automation', 'Coffee']
    });

    expect(profile.interests).toHaveLength(3);
    expect(await getEmbedding(profile.userId)).toBeDefined();
  });

  it('should generate compatible embeddings for both formats', async () => {
    const legacy = await createLegacyProfile({ nicheInterest: 'Photography' });
    const modern = await createProfile({ interests: ['Photography'] });

    const similarity = await computeSimilarity(legacy.userId, modern.userId);
    expect(similarity).toBeGreaterThan(0.9); // Should be very similar
  });
});
```

**E2E Tests** (new):
```typescript
// tests/e2e/onboarding-flow.spec.ts
it('should complete onboarding with multiple interests', async () => {
  const response = await request(app)
    .post('/api/profiles')
    .send({
      name: 'Test User',
      interests: ['Cooking', 'Hiking', 'Reading'],
      project: 'Learning to bake sourdough',
      connectionType: 'friendship'
    });

  expect(response.status).toBe(201);
  expect(response.body.profile.interests).toHaveLength(3);
});
```

---

### 9. Rollout Plan

#### Phase 1: Backend Schema Update (Day 1)
- [ ] Create Prisma migration adding `interests` column
- [ ] Deploy migration to staging
- [ ] Run data backfill script
- [ ] Verify existing functionality works
- [ ] Deploy to production (off-hours)

#### Phase 2: Backend Logic Update (Day 2)
- [ ] Update `preprocessProfileText()` to handle both formats
- [ ] Update DTOs to accept both `nicheInterest` and `interests`
- [ ] Update matching engine to extract from both formats
- [ ] Update GDPR export to include both formats
- [ ] Deploy to staging and test
- [ ] Deploy to production

#### Phase 3: Frontend Update (Day 3)
- [ ] Design new multi-interest input component
- [ ] Update Onboarding.tsx to collect array of interests
- [ ] Add client-side validation (1-5 interests)
- [ ] Test with new backend
- [ ] Deploy frontend

#### Phase 4: Data Migration (Days 4-5)
- [ ] Run background job to convert legacy profiles
- [ ] Regenerate embeddings for migrated profiles
- [ ] Monitor matching quality metrics
- [ ] Fix any issues

#### Phase 5: Cleanup (Future)
- [ ] After 30 days, mark `nicheInterest` as deprecated
- [ ] Plan removal for next major version
- [ ] Update documentation

---

## Recommended Architecture

### Option B+: Enhanced Hybrid Model

**Database Schema**:
```prisma
model Profile {
  // Primary detailed interest (backward compatible)
  nicheInterest  String?  @map("niche_interest") @db.Text

  // New: Array of interests (3-5 items)
  interests      String[]

  // Keep project (stays single)
  project        String   @db.Text

  // Rename rabbitHole to deepDive for clarity
  deepDive       String?  @map("deep_dive") @db.Text

  // Rest unchanged
  connectionType String   @map("connection_type")
  preferences    String?  @db.Text
}
```

**Validation Rules**:
1. **New profiles**: Must provide `interests` array (1-5 items, 20-100 chars each)
2. **Legacy profiles**: Can still use `nicheInterest` (100-500 chars)
3. **Transition period**: Accept both formats
4. **Future**: Deprecate `nicheInterest` after migration complete

**Embedding Generation**:
```typescript
preprocessProfileText(profile: Profile): string {
  // Determine which format to use
  const interestsText = profile.interests && profile.interests.length > 0
    ? `Interests: ${profile.interests.join(', ')}`
    : profile.nicheInterest
      ? `Interest: ${profile.nicheInterest}`
      : 'No interests specified';

  const parts = [interestsText, `Project: ${profile.project}`];

  if (profile.deepDive) {
    parts.push(`Deep Dive: ${profile.deepDive}`);
  }

  return parts.join('. ');
}
```

**Frontend UX**:
```tsx
// Multi-interest input with dynamic add/remove
<div>
  <Label>What interests would you love to connect over? (3-5)</Label>
  {interests.map((interest, idx) => (
    <div key={idx} className="flex gap-2">
      <Input
        value={interest}
        onChange={(e) => updateInterest(idx, e.target.value)}
        placeholder="e.g., Sourdough baking, Trail running, Jazz guitar"
      />
      {interests.length > 1 && (
        <Button onClick={() => removeInterest(idx)}>Remove</Button>
      )}
    </div>
  ))}
  {interests.length < 5 && (
    <Button onClick={addInterest}>Add Another Interest</Button>
  )}
</div>
```

---

## Migration Complexity Assessment

### Low Complexity (1-2 days)
- [ ] ❌ None - all aspects require moderate to high effort

### Medium Complexity (3-5 days)
- [x] ✅ Database schema changes (additive only)
- [x] ✅ DTO validation updates
- [x] ✅ Embedding generation logic refactor
- [x] ✅ Frontend input component changes

### High Complexity (5+ days)
- [x] ✅ Data migration with zero downtime
- [x] ✅ Backward compatibility support
- [x] ✅ Matching algorithm updates
- [x] ✅ Comprehensive testing across formats
- [ ] ⚠️ AI prompt configurability (if tackled simultaneously)

---

## Risks and Considerations

### Technical Risks

1. **Embedding Quality Degradation**
   - **Risk**: Multiple diverse interests might create less focused embeddings
   - **Mitigation**: Weight primary interest higher, limit to 5 interests max
   - **Testing**: A/B test matching quality before/after migration

2. **Data Migration Failures**
   - **Risk**: Batch migration script could fail mid-process
   - **Mitigation**: Use transaction-based batching, comprehensive backups
   - **Recovery**: Keep backup table, rollback script ready

3. **Matching Algorithm Confusion**
   - **Risk**: Users with 5 varied interests might match poorly
   - **Mitigation**: Implement interest weighting or clustering
   - **Monitoring**: Track match acceptance rates pre/post migration

4. **Frontend Performance**
   - **Risk**: Dynamic multi-input could be clunky UX
   - **Mitigation**: Prototype UX with user testing first
   - **Alternative**: Use tags/chips interface instead of text inputs

### Product Risks

1. **User Confusion**
   - Current users understand single-interest model
   - Change might require re-onboarding or education
   - Consider gradual rollout to new users first

2. **Match Quality**
   - Unknown if multiple interests improve or dilute matching
   - Need metrics to measure success

3. **Feature Scope Creep**
   - Multiple interests enable many new features (interest-based search, filtering, etc.)
   - Stay focused on core migration, defer enhancements

---

## Prompt Configurability Trade-offs

| Approach | Implementation Time | Flexibility | Audit Trail | Requires Deployment |
|----------|-------------------|-------------|-------------|---------------------|
| Environment Variables | 2 hours | Low | None | Yes |
| Config Files (YAML) | 1 day | Medium | Git history | Yes |
| Database Storage | 3-5 days | High | Full | No |
| Hybrid (Config + DB) | 2-3 days | High | Full | No (for content) |

**Recommendation**:
- **Now**: Keep prompts hardcoded (if only doing profile migration)
- **Next Sprint**: Implement config file approach (quick win)
- **Future**: Add database storage when building admin tools

**Rationale**:
- Prompt configurability is orthogonal to profile model changes
- Don't couple these two initiatives
- Config files provide 80% of value with 20% of effort

---

## Step-by-Step Implementation Plan

### Prerequisites
- [ ] Review with product team (confirm requirements)
- [ ] Create feature branch: `feature/multi-interests-profile`
- [ ] Set up staging environment with production data snapshot

### Day 1: Database Migration
1. [ ] Create Prisma migration file
   ```bash
   npx prisma migrate dev --name add_interests_array
   ```
2. [ ] Write migration SQL:
   ```sql
   ALTER TABLE profiles ADD COLUMN interests TEXT[];
   ALTER TABLE profiles ADD CONSTRAINT interests_array_length
     CHECK (interests IS NULL OR array_length(interests, 1) BETWEEN 1 AND 5);
   ```
3. [ ] Write backfill script: `scripts/migrate-interests.ts`
4. [ ] Test migration on staging database
5. [ ] Deploy migration to production (off-hours)
6. [ ] Run backfill in background

**Files Modified**:
- `prisma/schema.prisma`
- `prisma/migrations/YYYYMMDD_add_interests_array/migration.sql`
- `scripts/migrate-interests.ts` (new)

---

### Day 2: Backend Logic Updates

**Morning**: Core Services
1. [ ] Update `preprocessProfileText()` - `/src/openai/openai.service.ts`
2. [ ] Update `createProfile()` - `/src/profiles/profiles.service.ts`
3. [ ] Update `updateProfile()` - `/src/profiles/profiles.service.ts`
4. [ ] Update embedding processor - `/src/jobs/embedding-generation.processor.ts`

**Afternoon**: DTOs & Validation
5. [ ] Update CreateProfileDto - `/src/profiles/dto/create-profile.dto.ts`
6. [ ] Update UpdateProfileDto - `/src/profiles/dto/update-profile.dto.ts`
7. [ ] Update ProfileResponseDto - `/src/profiles/dto/profile-response.dto.ts`
8. [ ] Add validation for interests array (1-5 items, 20-100 chars each)

**Evening**: Matching & Export
9. [ ] Update shared topic extraction - `/src/matching/engines/vector-matching.engine.ts`
10. [ ] Update GDPR export - `/src/gdpr/gdpr.service.ts`
11. [ ] Update dev persona generation - `/src/dev/dev.service.ts` (2 DTOs)

**Files Modified** (11 files):
- `src/openai/openai.service.ts`
- `src/profiles/profiles.service.ts`
- `src/jobs/embedding-generation.processor.ts`
- `src/profiles/dto/create-profile.dto.ts`
- `src/profiles/dto/update-profile.dto.ts`
- `src/profiles/dto/profile-response.dto.ts`
- `src/matching/engines/vector-matching.engine.ts`
- `src/gdpr/gdpr.service.ts`
- `src/dev/dev.service.ts`
- `src/dev/dto/create-manual-persona.dto.ts`
- `src/dev/dto/persona-response.dto.ts`

---

### Day 3: Testing & Frontend

**Morning**: Unit Tests
1. [ ] Update profiles service tests
2. [ ] Update embedding processor tests
3. [ ] Update OpenAI service tests
4. [ ] Add integration tests for dual-format support

**Afternoon**: Frontend Component
5. [ ] Create MultiInterestInput component
6. [ ] Update Onboarding.tsx (lines 30-40, 94-102)
7. [ ] Add client-side validation
8. [ ] Test onboarding flow end-to-end

**Files Modified** (5 files):
- `src/profiles/profiles.service.spec.ts`
- `src/jobs/embedding-generation.processor.spec.ts`
- `src/openai/openai.service.spec.ts`
- `src/components/Onboarding.tsx`
- `src/components/ui/multi-interest-input.tsx` (new)

---

### Day 4: QA & Staging Validation

**Morning**: Manual Testing
1. [ ] Test legacy profile flow (single nicheInterest)
2. [ ] Test new profile flow (interests array)
3. [ ] Test profile updates (both formats)
4. [ ] Test GDPR export includes both formats
5. [ ] Test matching between legacy & new profiles

**Afternoon**: Data Validation
6. [ ] Verify backfill script completed successfully
7. [ ] Check embedding regeneration status
8. [ ] Run sample matches, verify quality
9. [ ] Performance test (no regressions)

**Evening**: Stakeholder Review
10. [ ] Demo to product team
11. [ ] Get approval for production rollout

---

### Day 5: Production Rollout & Monitoring

**Morning**: Deployment
1. [ ] Deploy backend to production (rolling deployment)
2. [ ] Monitor logs for errors
3. [ ] Verify API endpoints respond correctly
4. [ ] Deploy frontend to production
5. [ ] Monitor onboarding completion rate

**Afternoon**: Data Migration
6. [ ] Trigger embedding regeneration for remaining profiles
7. [ ] Monitor queue health
8. [ ] Watch for matching quality metrics

**Evening**: Validation
9. [ ] Review first batch of new multi-interest profiles
10. [ ] Check matching quality (acceptance rate)
11. [ ] Document any issues or follow-ups

---

## Success Metrics

Track these metrics before and after migration:

1. **Onboarding Completion Rate**
   - Before: X% complete onboarding
   - Target: Maintain or improve completion rate
   - Monitor: First 7 days after frontend deploy

2. **Match Acceptance Rate**
   - Before: X% of matches accepted
   - Target: Maintain or improve acceptance rate
   - Monitor: 14 days after migration complete

3. **Embedding Generation Success Rate**
   - Before: X% embeddings generated successfully
   - Target: 100% success rate
   - Monitor: Continuously during migration

4. **Average Time to First Match**
   - Before: X hours
   - Target: Reduce or maintain
   - Monitor: 30 days after migration

5. **User Engagement**
   - Measure: Profile updates, match interactions
   - Track: Changes in behavior patterns

---

## Open Questions

1. **Product**: Should we force existing users to re-onboard with new format?
   - **Recommendation**: No, support both formats indefinitely
   - **Alternative**: Gentle prompt to "refresh your profile" with new format

2. **Technical**: How to handle interest prioritization in matching?
   - **Options**:
     - A) Equal weight to all interests
     - B) Weight first interest 50%, others 12.5% each
     - C) Let users drag-to-reorder importance
   - **Recommendation**: Start with (A), iterate based on data

3. **UX**: What's the ideal number of interests?
   - Current plan: 1-5 interests
   - Consider: User testing to find sweet spot (maybe 3-4 optimal?)

4. **Performance**: Will larger embedding text impact OpenAI costs?
   - Current: ~100-500 chars per profile → ~100 tokens
   - New: ~100-500 chars (5 interests × 20-100 chars) → similar tokens
   - **Impact**: Minimal cost change

5. **Data**: Should we preserve `rabbitHole` or merge into `interests`?
   - **Recommendation**: Keep as `deepDive` field (optional context)
   - **Rationale**: Rabbit holes are different from interests (depth vs breadth)

---

## Related Documentation

- Database Schema: `/workspace/grove-backend/prisma/schema.prisma`
- Embedding Logic: `/workspace/grove-backend/src/openai/openai.service.ts`
- Matching Engine: `/workspace/grove-backend/src/matching/engines/vector-matching.engine.ts`
- Onboarding Flow: `/workspace/src/components/Onboarding.tsx`
- Migration History: `/workspace/grove-backend/prisma/migrations/`

---

## Appendix: Code Snippets

### Example Migration Script

```typescript
// scripts/migrate-interests.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateInterests() {
  console.log('Starting interest migration...');

  // Find all profiles without interests array
  const profiles = await prisma.profile.findMany({
    where: {
      interests: { equals: null }
    },
    select: {
      id: true,
      userId: true,
      nicheInterest: true,
      rabbitHole: true
    }
  });

  console.log(`Found ${profiles.length} profiles to migrate`);

  let migrated = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      const interests: string[] = [];

      // Add niche interest as first item
      if (profile.nicheInterest) {
        interests.push(profile.nicheInterest);
      }

      // Add rabbit hole as second item if exists
      if (profile.rabbitHole && profile.rabbitHole.trim()) {
        interests.push(profile.rabbitHole);
      }

      // Update profile
      await prisma.profile.update({
        where: { id: profile.id },
        data: { interests }
      });

      // Queue embedding regeneration
      await prisma.embeddingQueue.create({
        data: {
          userId: profile.userId,
          status: 'pending'
        }
      });

      migrated++;

      if (migrated % 100 === 0) {
        console.log(`Migrated ${migrated}/${profiles.length} profiles...`);
      }
    } catch (error) {
      console.error(`Failed to migrate profile ${profile.id}:`, error);
      failed++;
    }
  }

  console.log(`Migration complete: ${migrated} succeeded, ${failed} failed`);
}

migrateInterests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Example Validation Decorator

```typescript
// src/common/validators/interests.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ name: 'interestsOrNicheInterest', async: false })
export class InterestsOrNicheInterestConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: any) {
    const object = args.object;

    // Must have either interests array OR nicheInterest
    const hasInterests = object.interests && object.interests.length > 0;
    const hasNicheInterest = object.nicheInterest && object.nicheInterest.trim().length > 0;

    return hasInterests || hasNicheInterest;
  }

  defaultMessage(args: any) {
    return 'Profile must have either interests array or nicheInterest field';
  }
}

export function InterestsOrNicheInterest(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: InterestsOrNicheInterestConstraint,
    });
  };
}
```

---

**End of Research Document**

Last Updated: 2025-10-31 02:32:21 UTC
