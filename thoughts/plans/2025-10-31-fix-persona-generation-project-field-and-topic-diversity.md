---
doc_type: plan
date: 2025-10-31T14:34:29+00:00
title: "Fix Persona Generation Issues - Project Field Templates and Topic Diversity"
feature: "persona-generation"
plan_reference: thoughts/metrics/2025-10-31-meta-persona-vs-baseline-comparison.md

# Update phase status as implementation progresses
phases:
  - name: "Phase 1: Fix Project Field Template Pollution"
    status: pending
  - name: "Phase 2: Expand Topic Diversity"
    status: pending
  - name: "Phase 3: Add Deduplication Check"
    status: pending
  - name: "Phase 4: Enhanced Conditional Prompting"
    status: pending
  - name: "Phase 5: Testing and Validation"
    status: pending

git_commit: ce3dc9cfebae3f4788b1136a64b4b521417989ab
branch: feature/persona-diversity-improvements
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-31
last_updated_by: Sean Kim

ticket_id: FEATURE-persona-diversity-fix
tags:
  - implementation
  - personas
  - ai
  - diversity
  - openai
status: draft

related_docs:
  - thoughts/metrics/2025-10-31-meta-persona-vs-baseline-comparison.md
  - thoughts/metrics/2025-10-31-baseline-diversity-metrics.md
  - thoughts/implementation-details/2025-10-31-persona-diversity-phase-3-meta-persona-architecture.md
---

# Implementation Plan: Fix Persona Generation Diversity Issues

## Overview

### Problem Statement

Phase 4 testing of the meta-persona architecture revealed a critical issue: while length diversity improved dramatically (4.5x better), **semantic similarity regressed 8.9%** (0.397 → 0.433). Root cause analysis identified:

1. **Critical**: "working on personal projects" phrase appeared **40 times** (vs max 6 in baseline)
2. **Critical**: The `project` field is using a shared template across all meta-personas
3. **Major**: Only 15 interest categories limits topic diversity
4. **Major**: One exact duplicate pair found (similarity = 1.0)
5. **Minor**: Insufficient conditioning attributes beyond style

### Solution Summary

Implement a 5-phase fix addressing the root causes while preserving the 4.5x length diversity improvement:

1. **Phase 1 (CRITICAL)**: Add distinct project field templates for each of the 8 meta-personas
2. **Phase 2**: Expand interest categories from 15 → 35 with topic distribution tracking
3. **Phase 3**: Add deduplication check to prevent identical persona combinations
4. **Phase 4**: Enhance conditional prompting with life stage, expertise level, and geographic hints
5. **Phase 5**: Regenerate test data, run diversity analysis, and validate improvements

### Success Criteria

After all phases complete:

| Metric | Current (Phase 4) | Target | Expected After Fix |
|--------|-------------------|--------|-------------------|
| **Avg Embedding Similarity** | 0.433 ❌ | < 0.40 | 0.38-0.40 ✅ |
| **Length Std Dev** | 220.6 ✅ | > 50 | 220+ ✅ (preserve) |
| **Trigram Diversity** | 0.942 | > 0.95 | 0.96+ ✅ |
| **"working on personal" Count** | 40x ❌ | 0 | 0 ✅ |
| **Duplicate Pairs** | 1 ❌ | 0 | 0 ✅ |
| **Overall Pass** | FAIL | PASS | PASS ✅ |

### Time Estimates

- Phase 1 (Critical Fix): **2-3 hours**
- Phase 2 (Topic Diversity): **3-4 hours**
- Phase 3 (Deduplication): **1-2 hours**
- Phase 4 (Enhanced Prompting): **2-3 hours**
- Phase 5 (Testing): **1-2 hours** (mostly automated)

**Total**: 9-14 hours

---

## Current State Analysis

### Architecture Overview

The current meta-persona system (as of Phase 4):

```
DevService.generatePersonaBatchWithMetaPersonas(100)
  ↓
MetaPersonaService.getBalancedDistribution(100)
  → Returns [12-13 of each of 8 meta-personas]
  ↓
For each persona (1-100):
  - Assign meta-persona (Minimalist, Enthusiast, etc.)
  - Get interest from SeedDataService (15 categories)
  - Build prompt: buildSeedConstrainedPrompt(names, interests, metaPersona)
  - Call OpenAI with meta-persona.systemPrompt
  - Generate persona with unique voice
  ↓
Create profiles in database
```

### Files Involved

**Core Generation Logic**:
- `/workspace/grove-backend/src/dev/dev.service.ts` - Persona generation orchestration
  - Line 268-343: `generatePersonaBatchWithMetaPersonas()`
  - Line 440-477: `buildSeedConstrainedPrompt()` - **CRITICAL FIX LOCATION**
  - Line 322: Fallback `project: 'Working on personal projects'` - **ROOT CAUSE**

**Meta-Persona Definitions**:
- `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts` - 8 meta-persona definitions
  - Lines 16-280: System prompts for each meta-persona
  - Lines 282-340: Distribution and utility methods

**Interest Categories**:
- `/workspace/grove-backend/src/dev/seed-data/interests.json` - 15 interest categories (347 total interests)
- `/workspace/grove-backend/src/dev/seed-data.service.ts` - Interest selection logic

**OpenAI Integration**:
- `/workspace/grove-backend/src/openai/openai.service.ts` - GPT-4o API calls
  - Line 148: `generatePersonaContent(prompt, systemPrompt?)` - Accepts optional system prompt

### Root Cause Analysis

#### Issue 1: Project Field Template Pollution

**Current State** (line 473 in dev.service.ts):
```typescript
- project: What they're currently working on (50-150 chars)
```

This generic instruction is identical across all meta-personas. When AI fallback occurs (line 322):
```typescript
project: persona.project || 'Working on personal projects'
```

**Result**: 40 personas defaulted to "Working on personal projects" → massive phrase repetition → 8.9% semantic similarity regression.

#### Issue 2: Limited Topic Diversity

**Current State**: 15 interest categories, 347 total interests
```json
{
  "creative_artistic": [25 interests],
  "music_performing": [20 interests],
  "intellectual_academic": [20 interests],
  ... (12 more categories)
}
```

**Problem**: Research shows "More unique topics = better diversity" (ArXiv). With 100 personas and 15 categories, we're averaging 6-7 personas per category. This creates topic clustering.

#### Issue 3: No Deduplication Check

**Current State**: No validation prevents identical `interests + project` combinations.

**Evidence**: Max similarity score = 1.0 (exact duplicate found in Phase 4 test).

#### Issue 4: Single-Dimension Conditioning

**Current State**: Only meta-persona style is conditioned. No other attributes vary.

**Problem**: All "Tech" personas sound different (Minimalist vs Deep Diver) but still cover the same topics at similar expertise levels.

---

## Requirements Analysis

### Functional Requirements

**FR-1: Distinct Project Field Templates** (CRITICAL)
- Each of the 8 meta-personas MUST have unique project field generation instructions
- Templates MUST eliminate shared phrases like "working on personal projects"
- Templates MUST match the meta-persona's voice and length target
- Example templates provided in design section below

**FR-2: Expanded Interest Categories**
- MUST expand from 15 → 35 interest categories (minimum 30, target 35)
- MUST add at least 200 new interests (current: 347 → target: 550+)
- MUST include emerging/niche categories (e.g., Web3, Urban Planning, Mental Health, etc.)
- MUST maintain JSON structure compatibility

**FR-3: Topic Distribution Tracking**
- MUST track how many personas use each interest category
- MUST log distribution statistics (similar to meta-persona distribution)
- SHOULD warn if any category is overused (> 15% of personas)

**FR-4: Deduplication Check**
- MUST detect identical `interests + project` combinations before database insertion
- MUST log duplicate attempts
- MUST skip duplicate personas (don't insert to database)
- SHOULD track deduplication rate for monitoring

**FR-5: Enhanced Conditional Prompting**
- MUST add `lifeStageSuggestion`: 'starting-out' | 'established' | 'transitioning'
- MUST add `expertiseLevel`: 'beginner' | 'intermediate' | 'advanced'
- MUST add `geographicHint`: 'urban' | 'suburban' | 'rural' | 'mixed'
- MUST randomize these attributes per persona
- MUST include in prompt to GPT-4o

**FR-6: Preserve Length Diversity**
- MUST maintain Length Std Dev > 200 (current: 220.6)
- MUST NOT regress length distribution improvements

### Technical Requirements

**TR-1: Backward Compatibility**
- Original `generatePersonaBatch()` method MUST remain unchanged
- New functionality MUST be opt-in via `generatePersonaBatchWithMetaPersonas()`
- Existing test data generation scripts MUST continue working

**TR-2: Performance**
- Total generation time for 100 personas MUST NOT exceed 10 minutes
- Deduplication check MUST be O(n) complexity using Set/Map
- Topic distribution tracking MUST NOT add > 100ms overhead

**TR-3: Logging and Observability**
- MUST log topic distribution statistics
- MUST log deduplication events
- MUST log enhanced conditioning attribute distribution
- SHOULD use structured logging for metrics

**TR-4: Testing**
- MUST validate with 100-persona test batch
- MUST run full diversity analysis
- MUST compare with Phase 4 baseline
- MUST document metric improvements

### Out of Scope

**Not Included in This Plan**:
- Performance optimization (batching API calls from 100 → 8) - Deferred to future optimization sprint
- Unit tests for new functionality - Deferred to test coverage sprint
- Production deployment - Requires approval after validation
- UI/API changes - Backend-only changes
- Database schema changes - Using existing profile schema

---

## Architecture & Design

### Phase 1: Project Field Template Design

#### Approach

Each meta-persona will have a distinct `projectFieldTemplate` that matches its voice, length target, and tone. This template will be embedded in the system prompt or user prompt to ensure GPT-4o generates projects in the correct style.

#### Project Field Templates by Meta-Persona

**1. The Minimalist** (Target: 10-30 chars)
```
PROJECT FIELD RULES FOR MINIMALIST:
- Use 1-3 words maximum
- Format: "[Verb] [noun]." or "[Noun]."
- Examples: "Building app.", "Training.", "Writing poetry."
- NO explanations or context
```

**2. The Enthusiast** (Target: 80-150 chars)
```
PROJECT FIELD RULES FOR ENTHUSIAST:
- Use exclamation points naturally
- Show excitement about the project
- Format: "I'm [action]! [Why it's exciting]!"
- Examples: "I'm building a recipe app from scratch! Learning so much about UI design and it's incredibly fun!"
```

**3. The Academic** (Target: 100-200 chars)
```
PROJECT FIELD RULES FOR ACADEMIC:
- Use formal, precise language
- Format: "Developing [X] to [research goal/theoretical framework]."
- Examples: "Developing a computational model to analyze sentiment patterns in social media discourse, with particular emphasis on cross-cultural linguistic variations."
```

**4. The Storyteller** (Target: 120-250 chars)
```
PROJECT FIELD RULES FOR STORYTELLER:
- Create a narrative arc (past → present)
- Format: "Started [X] when [backstory]. Now I'm [progress]..."
- Examples: "Started documenting local food vendors when I moved to the city last year. Now I'm building a photo series and interviewing vendors about their family recipes and journey to entrepreneurship."
```

**5. The Pragmatist** (Target: 50-120 chars)
```
PROJECT FIELD RULES FOR PRAGMATIST:
- Use structured, goal-oriented format
- Format: "Current project: [X]. Goal: [measurable outcome]."
- Examples: "Current project: Home automation system. Goal: reduce energy consumption by 30%."
```

**6. The Casual** (Target: 30-80 chars)
```
PROJECT FIELD RULES FOR CASUAL:
- Conversational, understated tone
- Format: "Working on [X]. [Casual observation]."
- Examples: "Working on a veggie garden. Pretty straightforward so far."
```

**7. The Deep Diver** (Target: 150-300 chars)
```
PROJECT FIELD RULES FOR DEEP DIVER:
- Include technical details and depth
- Format: "Currently [action] with focus on [technical specifics]. [Methodology/tools/challenges]."
- Examples: "Currently building a distributed task queue system with focus on exactly-once delivery semantics. Exploring consensus algorithms (Raft vs Paxos), implementing idempotency patterns, and benchmarking under various failure scenarios including network partitions."
```

**8. The Explorer** (Target: 60-140 chars)
```
PROJECT FIELD RULES FOR EXPLORER:
- Use questions or curiosity-driven language
- Format: "Exploring [X]. What [question]? How [question]?"
- Examples: "Exploring urban foraging. What grows in cities that we can eat? How do we balance harvesting with ecosystem health?"
```

#### Implementation Location

**Option A**: Embed in meta-persona system prompts (Recommended)
- **File**: `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts`
- **Lines**: 21-280 (within each system prompt)
- **Pros**: Single source of truth, AI sees project rules in same context as bio rules
- **Cons**: System prompts become longer

**Option B**: Add to user prompt in `buildSeedConstrainedPrompt()`
- **File**: `/workspace/grove-backend/src/dev/dev.service.ts`
- **Lines**: 456-477 (user prompt construction)
- **Pros**: More flexible, easier to test variations
- **Cons**: Two places to maintain meta-persona rules

**Decision**: **Option A** - Embed in system prompts for consistency and single source of truth.

#### Code Changes Required

**File**: `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts`

For each meta-persona (8 locations), add project field rules to the system prompt. Example for Minimalist:

```typescript
systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in an extremely MINIMALIST style.

CRITICAL RULES FOR BIO (interests field):
- Use VERY short sentences or sentence fragments
- Target length: 20-60 characters total
...existing rules...

CRITICAL RULES FOR PROJECT FIELD:
- Use 1-3 words maximum
- Format: "[Verb] [noun]." or "[Noun]."
- Examples: "Building app.", "Training.", "Writing poetry."
- NO explanations, NO context, NO filler words
- Target length: 10-30 characters

...rest of system prompt...`
```

**Repeat for all 8 meta-personas** with their respective project field templates (shown above).

#### Fallback Update

Update fallback logic to use meta-persona-appropriate defaults:

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`
**Line**: 322

```typescript
// OLD (causes template pollution):
project: persona.project || 'Working on personal projects'

// NEW (meta-persona aware fallback):
project: persona.project || this.getMetaPersonaFallbackProject(metaPersona, interest)

// Add helper method:
private getMetaPersonaFallbackProject(metaPersona: MetaPersona, interest: string): string {
  const fallbacks = {
    'minimalist': 'Exploring.',
    'enthusiast': `Diving into ${interest}! It's amazing!`,
    'academic': `Researching applications of ${interest} in contemporary contexts.`,
    'storyteller': `Started exploring ${interest} recently. Still learning, but the journey has been meaningful.`,
    'pragmatist': `Current focus: ${interest}. Goal: consistent practice.`,
    'casual': `Working on ${interest}. Pretty straightforward.`,
    'deep-diver': `Currently researching ${interest} with focus on advanced techniques and underlying principles.`,
    'explorer': `Exploring ${interest}. What makes it meaningful? How does it connect to other interests?`,
  };

  return fallbacks[metaPersona.id] || `Exploring ${interest}`;
}
```

---

### Phase 2: Topic Diversity Expansion

#### Approach

Expand from 15 → 35 interest categories, adding ~200 new interests focused on emerging/niche areas. Track topic distribution to ensure balanced coverage.

#### New Interest Categories (20 additional)

**Existing (15)**: creative_artistic, music_performing, intellectual_academic, tech_digital, gaming_entertainment, reading_writing, physical_outdoor, food_lifestyle, nature_environment, travel_culture, wellness_mindfulness, social_community, professional_entrepreneurial, craft_diy, pop_culture_media

**New (20)**:
1. **web3_blockchain**: NFTs, DAOs, DeFi, Smart contracts, Metaverse, Crypto art, Token economics, Blockchain gaming, Decentralized identity, Web3 governance (15 interests)
2. **mental_health_therapy**: Therapy modalities, EMDR, CBT, Trauma-informed care, Inner child work, Shadow work, Parts work, Somatic experiencing, Attachment theory, Therapeutic journaling (15 interests)
3. **urban_planning**: Transit-oriented development, Zoning reform, 15-minute cities, Public space design, Pedestrian infrastructure, Bike lanes, Mixed-use development, Urban forestry, Smart cities, Tactical urbanism (15 interests)
4. **educational_technology**: Learning management systems, Adaptive learning, Microlearning, Gamification, Educational assessment, Instructional design, E-learning, MOOCs, EdTech startups, Digital literacy (12 interests)
5. **climate_sustainability**: Carbon footprint tracking, Renewable energy, Zero waste, Circular economy, Regenerative agriculture, Climate adaptation, Green building, Sustainable fashion, Carbon capture, Climate policy (15 interests)
6. **neuroscience_braintech**: Brain-computer interfaces, Neuroplasticity, Cognitive enhancement, Sleep science, Neurofeedback, fMRI research, Consciousness studies, Memory formation, Neurodiversity, Brain health (15 interests)
7. **data_science_analytics**: Data visualization, Machine learning operations, A/B testing, Statistical modeling, Predictive analytics, Data engineering, Data governance, Big data, Data storytelling, Business intelligence (15 interests)
8. **space_exploration**: Rocket science, SpaceX/commercial space, Mars colonization, Satellite technology, Astrophotography, Space policy, Asteroid mining, Space tourism, Exoplanets, Space sustainability (15 interests)
9. **regenerative_living**: Permaculture design, Food forests, Homesteading, Rainwater harvesting, Composting systems, Natural building, Off-grid living, Seed saving, Soil regeneration, Self-sufficiency (15 interests)
10. **creative_coding**: Generative art, Creative AI, Shader programming, Procedural generation, Live coding, Visual music, Interactive installations, Creative tools, Algorithmic composition, Code art (12 interests)
11. **longevity_biohacking**: Intermittent fasting, Cold exposure, Longevity supplements, Biological age testing, Senolytic therapy, NAD+ optimization, Continuous glucose monitoring, Sleep optimization, Hormone optimization, Autophagy (15 interests)
12. **community_building**: Cohousing, Intentional communities, Community organizing, Participatory budgeting, Town halls, Neighborhood associations, Community gardens, Local currencies, Mutual aid, Cooperative economics (15 interests)
13. **alternative_healing**: Herbalism, Acupuncture, Ayurveda, Traditional Chinese Medicine, Homeopathy, Energy work, Crystal healing, Sound healing, Shamanic practices, Integrative medicine (15 interests)
14. **financial_independence**: FIRE movement, Index investing, Dividend investing, Real estate investing, Geoarbitrage, Side hustles, Passive income, Tax optimization, Early retirement, Financial literacy (15 interests)
15. **language_conlangs**: Constructed languages (Esperanto, Lojban), Language learning methods, Polyglot community, Etymology, Historical linguistics, Language documentation, Endangered languages, Linguistic typology, Writing systems, Phonetics (15 interests)
16. **future_studies**: Futurism, Scenario planning, Transhumanism, Singularity, Existential risk, Long-term thinking, Future of work, Emerging technologies, Social forecasting, Speculative design (12 interests)
17. **mycology_fungi**: Mushroom cultivation, Mushroom foraging, Fungal ecology, Mycelium networks, Medicinal mushrooms, Mycoremediation, Fungi identification, Mushroom photography, Fungal biodiversity, Mushroom gastronomy (15 interests)
18. **accessible_design**: Web accessibility, Universal design, Assistive technology, Inclusive design, Disability rights, WCAG compliance, Screen readers, Accessible gaming, Adaptive equipment, Neurodiversity accommodation (12 interests)
19. **contemplative_practices**: Vipassana meditation, Zen practice, Contemplative prayer, Lectio Divina, Walking meditation, Loving-kindness meditation, Body scan, Yoga nidra, Mindful movement, Contemplative arts (12 interests)
20. **repair_culture**: Right to repair, Electronics repair, Clothing repair, Tool repair, Repair cafes, Upcycling, Mending, Restoration, Maintenance culture, Anti-planned-obsolescence (12 interests)

**Total New Interests**: ~280 interests across 20 new categories
**New Total**: 15 old + 20 new = **35 categories**, 347 + 280 = **627 total interests**

#### Implementation

**File**: `/workspace/grove-backend/src/dev/seed-data/interests.json`

Add the 20 new categories with their interests. Example structure:

```json
{
  "web3_blockchain": [
    "NFT art creation", "DAO governance", "DeFi protocols", "Smart contract development",
    "Metaverse building", "Crypto art collecting", "Token economics", "Blockchain gaming",
    "Decentralized identity", "Web3 governance", "Yield farming", "Layer 2 scaling",
    "Decentralized finance", "Web3 community building", "Crypto security"
  ],
  "mental_health_therapy": [
    "EMDR therapy", "Cognitive behavioral therapy", "Trauma-informed care",
    "Inner child healing", "Shadow integration", "Internal Family Systems",
    "Somatic experiencing", "Attachment theory", "Therapeutic journaling",
    "Parts work", "PTSD recovery", "Complex trauma healing",
    "Polyvagal theory", "Emotional regulation", "Self-compassion practices"
  ],
  ... (18 more categories)
}
```

#### Topic Distribution Tracking

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

Add tracking in `generatePersonaBatchWithMetaPersonas()`:

```typescript
// After line 282 (after getting all interests)
const topicDistribution: Record<string, number> = {};
for (const interest of allInterests) {
  // Determine which category this interest belongs to
  const category = this.seedDataService.getCategoryForInterest(interest);
  topicDistribution[category] = (topicDistribution[category] || 0) + 1;
}

// Log distribution statistics (after line 289)
this.logger.log(`Topic distribution: ${JSON.stringify(topicDistribution)}`);

// Warn if any category is overused (> 15% threshold)
const maxAllowed = Math.ceil(count * 0.15); // 15% of total
for (const [category, usageCount] of Object.entries(topicDistribution)) {
  if (usageCount > maxAllowed) {
    this.logger.warn(
      `Category "${category}" overused: ${usageCount}/${count} (${((usageCount/count)*100).toFixed(1)}% > 15% threshold)`
    );
  }
}
```

**File**: `/workspace/grove-backend/src/dev/seed-data.service.ts`

Add helper method to find category for interest:

```typescript
/**
 * Get the category that an interest belongs to
 */
getCategoryForInterest(interest: string): string {
  for (const [category, interests] of Object.entries(this.seedData.interests)) {
    if (interests.includes(interest)) {
      return category;
    }
  }
  return 'unknown';
}
```

---

### Phase 3: Deduplication Check

#### Approach

Before inserting personas into the database, check if the combination of `interests + project` already exists. Use a Set to track combinations in O(1) lookup time.

#### Implementation

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

Modify `createPersonas()` method (starting line 712):

```typescript
private async createPersonas(
  personas: CreateManualPersonaDto[],
  orgId: string,
): Promise<PersonaResponse[]> {
  const created: PersonaResponse[] = [];
  const seenCombinations = new Set<string>(); // Deduplication tracking
  let duplicateCount = 0;

  for (const persona of personas) {
    // Generate unique key from interests + project
    const combinationKey = `${persona.interests.trim().toLowerCase()}|||${persona.project.trim().toLowerCase()}`;

    // Check for duplicate
    if (seenCombinations.has(combinationKey)) {
      this.logger.warn(
        `Duplicate persona detected: interests="${persona.interests.substring(0, 50)}..." + project="${persona.project.substring(0, 50)}...". Skipping.`
      );
      duplicateCount++;
      continue; // Skip this persona
    }

    seenCombinations.add(combinationKey);

    // Check if email already exists (existing logic)
    const existing = await this.prisma.user.findUnique({
      where: { email: persona.email },
    });

    if (existing) {
      this.logger.warn(`Persona with email ${persona.email} already exists, skipping`);
      continue;
    }

    // Create user with isTestData flag (existing logic continues...)
    const user = await this.prisma.user.create({
      data: {
        email: persona.email,
        name: persona.name,
        orgId,
        role: 'user',
        status: 'active',
        isTestData: true,
      },
    });

    // ... rest of existing creation logic ...
  }

  // Log deduplication statistics
  if (duplicateCount > 0) {
    this.logger.log(
      `Deduplication: Skipped ${duplicateCount} duplicate personas (${((duplicateCount/personas.length)*100).toFixed(1)}% of batch)`
    );
  }

  return created;
}
```

#### Edge Cases

**Case 1**: Different capitalization or spacing
- **Solution**: Normalize with `.trim().toLowerCase()` before comparison

**Case 2**: Semantically similar but not identical
- **Not Handled**: This would require embedding comparison (expensive). Only exact matches are deduplicated.
- **Rationale**: Semantic deduplication will be caught by embedding similarity metrics in testing.

**Case 3**: Duplicate email addresses
- **Already Handled**: Existing logic checks `prisma.user.findUnique({ where: { email } })` (line 720)

---

### Phase 4: Enhanced Conditional Prompting

#### Approach

Add three new conditioning attributes that are randomized per persona and included in the prompt to GPT-4o. This adds another dimension of diversity beyond style and topic.

#### New Attributes

**1. Life Stage Suggestion**
- Values: `'starting-out'` | `'established'` | `'transitioning'`
- Distribution: 33% each (random)
- Impact: Influences career stage, life context, time commitment

**2. Expertise Level**
- Values: `'beginner'` | `'intermediate'` | `'advanced'`
- Distribution: 30% beginner, 40% intermediate, 30% advanced (weighted random)
- Impact: Influences depth of knowledge, language sophistication, project complexity

**3. Geographic Hint**
- Values: `'urban'` | `'suburban'` | `'rural'` | `'mixed'`
- Distribution: 50% urban, 25% suburban, 15% rural, 10% mixed (weighted random)
- Impact: Influences available resources, community context, lifestyle references

#### Interface Definition

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

Add interface (before class definition):

```typescript
interface PersonaConditions {
  metaPersona: MetaPersona;
  interest: string;
  lifeStageSuggestion: 'starting-out' | 'established' | 'transitioning';
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  geographicHint: 'urban' | 'suburban' | 'rural' | 'mixed';
}
```

#### Randomization Logic

Add helper methods to DevService:

```typescript
/**
 * Generate random life stage with even distribution
 */
private getRandomLifeStage(): 'starting-out' | 'established' | 'transitioning' {
  const stages: Array<'starting-out' | 'established' | 'transitioning'> = [
    'starting-out',
    'established',
    'transitioning',
  ];
  return stages[Math.floor(Math.random() * stages.length)];
}

/**
 * Generate random expertise level with weighted distribution
 */
private getRandomExpertiseLevel(): 'beginner' | 'intermediate' | 'advanced' {
  const rand = Math.random();
  if (rand < 0.3) return 'beginner';      // 30%
  if (rand < 0.7) return 'intermediate';  // 40%
  return 'advanced';                      // 30%
}

/**
 * Generate random geographic hint with weighted distribution
 */
private getRandomGeographicHint(): 'urban' | 'suburban' | 'rural' | 'mixed' {
  const rand = Math.random();
  if (rand < 0.5) return 'urban';     // 50%
  if (rand < 0.75) return 'suburban'; // 25%
  if (rand < 0.9) return 'rural';     // 15%
  return 'mixed';                     // 10%
}
```

#### Prompt Integration

Update `buildSeedConstrainedPrompt()` method (line 440-477):

```typescript
private buildSeedConstrainedPrompt(
  names: Array<{ fullName: string }>,
  interests: string[],
  intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
  customPrompt?: string,
  avoidPhrases: string[] = [],
  metaPersona?: any,
  // NEW: Accept conditioning attributes
  conditions?: {
    lifeStage?: string;
    expertise?: string;
    geographic?: string;
  },
): string {
  if (customPrompt) {
    return customPrompt;
  }

  // If meta-persona is provided, use its specific guidelines
  if (metaPersona) {
    const personaList = names.map((name, i) => `- ${name.fullName}: ${interests[i]}`).join('\n');

    // NEW: Add conditioning section to prompt
    const conditioningText = conditions ? `

PERSONA CONTEXT (use as subtle background, not explicit in text):
- Life Stage: ${conditions.lifeStage} (affects time commitment, career context, life priorities)
- Expertise Level: ${conditions.expertise} (affects language sophistication, project complexity)
- Geographic Context: ${conditions.geographic} (affects available resources, community access)

Use these to inform the persona's voice and project naturally. Don't explicitly state them.` : '';

    return `Generate realistic employee profiles for these ${names.length} people with these pre-assigned interests.
${conditioningText}

ASSIGNED NAMES & INTERESTS:
${personaList}

CRITICAL RULES:
- Use the EXACT names provided above
- Base each persona on their assigned interest
- Write in FIRST PERSON ("I enjoy", "I'm learning", not "they enjoy")
- Follow the STYLE GUIDELINES from the system prompt
- Target length: ${metaPersona.lengthTarget.min}-${metaPersona.lengthTarget.max} characters for the bio
- Generate unique 5-digit numbers for emails

Return a JSON array with ${names.length} objects, each with:
- name: Use EXACT name from list above
- email: dev-persona-XXXXX@test.grove.test (unique 5-digit number)
- interests: A bio written in the assigned style (${metaPersona.lengthTarget.min}-${metaPersona.lengthTarget.max} chars)
- project: What they're currently working on (follow PROJECT FIELD RULES in system prompt)
- connectionType: "friendship", "mentorship", "collaboration", or "networking"
- deepDive (optional): A niche topic they're diving into
- preferences (optional): Meeting/connection preferences`;
  }

  // ... existing non-meta-persona logic unchanged ...
}
```

#### Usage in Generation Loop

Update `generatePersonaBatchWithMetaPersonas()` (line 293-300):

```typescript
for (let i = 0; i < count; i++) {
  const name = allNames[i];
  const interest = allInterests[i];
  const metaPersona = metaPersonaAssignments[i];

  // NEW: Generate conditioning attributes
  const conditions = {
    lifeStage: this.getRandomLifeStage(),
    expertise: this.getRandomExpertiseLevel(),
    geographic: this.getRandomGeographicHint(),
  };

  this.logger.log(
    `Generating persona ${i + 1}/${count} with ${metaPersona.name} (${conditions.lifeStage}, ${conditions.expertise}, ${conditions.geographic})`
  );

  try {
    const prompt = this.buildSeedConstrainedPrompt(
      [name],
      [interest],
      intensityLevel,
      undefined,
      [],
      metaPersona,
      conditions, // NEW: Pass conditions
    );

    // ... rest of generation logic ...
  }
}
```

---

## Implementation Plan - Phase by Phase

### Phase 1: Fix Project Field Template Pollution (CRITICAL)

**Time Estimate**: 2-3 hours

**Objective**: Eliminate "working on personal projects" repetition by adding distinct project field templates to each meta-persona system prompt.

#### Step 1.1: Update Meta-Persona System Prompts (90 min)

**File**: `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts`

For each of the 8 meta-personas (lines 16-280), add project field rules to the system prompt.

**Example - The Minimalist** (lines 21-48):
```typescript
systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in an extremely MINIMALIST style.

CRITICAL RULES FOR BIO (interests field):
- Use VERY short sentences or sentence fragments
- Target length: 20-60 characters total
- NO fluff, NO elaboration, NO descriptive adjectives
- Use periods to separate terse statements
- Think: "Philosophy. Logic. Truth." NOT "I'm fascinated by philosophy"
- Be direct and economical with every single word
- Strip away ALL unnecessary words

CRITICAL RULES FOR PROJECT FIELD:
- Use 1-3 words maximum
- Format: "[Verb] [noun]." or "[Noun]."
- Examples: "Building app.", "Training.", "Writing poetry.", "Coding.", "Learning Rust."
- NO explanations, NO context, NO filler words
- Target length: 10-30 characters
- Be ruthlessly concise

Examples of GOOD minimalist bios:
- "Coffee. Code. Cats."
...
`
```

**Repeat for all 8 meta-personas** using templates from "Architecture & Design - Phase 1" section above.

**Verification**:
- [ ] Read each system prompt to ensure project field rules are present
- [ ] Verify rules match meta-persona voice (e.g., Enthusiast uses exclamations, Academic uses formal language)
- [ ] Ensure length targets align (Minimalist: 10-30, Deep Diver: 150-300)

#### Step 1.2: Update Fallback Logic (30 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: Line 322 and add helper method

```typescript
// Line 322 - Update fallback in generatePersonaBatchWithMetaPersonas()
project: persona.project || this.getMetaPersonaFallbackProject(metaPersona, interest),

// Add method after line 339 (end of generatePersonaBatchWithMetaPersonas)
/**
 * Get meta-persona appropriate fallback project description
 */
private getMetaPersonaFallbackProject(metaPersona: MetaPersona, interest: string): string {
  const fallbacks = {
    'minimalist': 'Exploring.',
    'enthusiast': `Diving into ${interest}! It's amazing!`,
    'academic': `Researching applications of ${interest} in contemporary contexts.`,
    'storyteller': `Started exploring ${interest} recently. Still learning, but the journey has been meaningful.`,
    'pragmatist': `Current focus: ${interest}. Goal: consistent practice.`,
    'casual': `Working on ${interest}. Pretty straightforward.`,
    'deep-diver': `Currently researching ${interest} with focus on advanced techniques and underlying principles.`,
    'explorer': `Exploring ${interest}. What makes it meaningful? How does it connect to other interests?`,
  };

  return fallbacks[metaPersona.id] || `Exploring ${interest}`;
}
```

**Also update fallback in line 334** (error handler fallback):
```typescript
project: this.getMetaPersonaFallbackProject(metaPersona, interest),
```

**Verification**:
- [ ] Compile TypeScript: `cd /workspace/grove-backend && npm run build`
- [ ] No compilation errors
- [ ] Method signature matches usage sites

#### Step 1.3: Update Line 413 Fallback (Existing Method) (15 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: Line 413 in `generateSubBatch()` method

**Note**: This method is legacy but still used by non-meta-persona generation. Update for consistency, but it won't affect meta-persona testing.

```typescript
// Line 413 - Make fallback more generic (no "working on personal projects")
project: p.project || 'Exploring interests',
```

**Verification**:
- [ ] Compile TypeScript
- [ ] No compilation errors

#### Step 1.4: Testing - Quick Manual Validation (15 min)

**Don't regenerate full 100-persona batch yet.** Just test that system prompts are passed correctly.

Create a quick test script: `/workspace/grove-backend/scripts/test-project-fields.ts`

```typescript
#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const devService = app.get(DevService);

  console.log('Generating 8 test personas (one per meta-persona)...\n');

  // Generate 8 personas (one per meta-persona type)
  const personas = await devService.generatePersonaBatchWithMetaPersonas(
    8,
    'mixed',
    undefined,
    'project_field_test',
  );

  // Check project fields
  console.log('Project Fields Generated:\n');
  personas.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Project: "${p.project}"`);
    console.log(`   Length: ${p.project.length} chars`);
    console.log(`   Contains "working on personal"? ${p.project.toLowerCase().includes('working on personal') ? 'YES (BAD!)' : 'No (Good!)'}`);
    console.log();
  });

  await app.close();
}

main();
```

**Run**:
```bash
cd /workspace/grove-backend
npx ts-node scripts/test-project-fields.ts
```

**Expected Results**:
- [ ] 8 personas generated
- [ ] ZERO contain "working on personal projects"
- [ ] Project fields vary in length (some ~20 chars, some ~200 chars)
- [ ] Project fields match meta-persona voice (e.g., Minimalist is terse, Enthusiast uses exclamations)

**If test fails**:
- Check system prompts were updated correctly
- Check fallback method is being called
- Check OpenAI API key is configured (otherwise mock data is used)

#### Step 1.5: Success Criteria for Phase 1

- [ ] All 8 meta-persona system prompts include project field rules
- [ ] Fallback logic uses meta-persona-aware defaults
- [ ] Test script generates 8 personas with diverse project fields
- [ ] Zero instances of "working on personal projects" in test output
- [ ] TypeScript compiles without errors
- [ ] Existing tests still pass (if any)

**Deliverables**:
- Updated `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts`
- Updated `/workspace/grove-backend/src/dev/dev.service.ts`
- Test script `/workspace/grove-backend/scripts/test-project-fields.ts`
- Test output log

---

### Phase 2: Expand Topic Diversity (3-4 hours)

**Time Estimate**: 3-4 hours

**Objective**: Expand interest categories from 15 → 35, add ~280 new interests, and implement topic distribution tracking.

#### Step 2.1: Add 20 New Interest Categories (120 min)

**File**: `/workspace/grove-backend/src/dev/seed-data/interests.json`

Add 20 new categories with ~280 new interests (14 interests per new category average).

**Full list of interests** for each category is detailed in "Architecture & Design - Phase 2" section. Here's a template:

```json
{
  "... existing 15 categories ...",

  "web3_blockchain": [
    "NFT art creation", "DAO governance", "DeFi protocols", "Smart contract development",
    "Metaverse building", "Crypto art collecting", "Token economics", "Blockchain gaming",
    "Decentralized identity", "Web3 governance", "Yield farming", "Layer 2 scaling",
    "Decentralized finance", "Web3 community building", "Crypto security"
  ],
  "mental_health_therapy": [
    "EMDR therapy", "Cognitive behavioral therapy", "Trauma-informed care",
    "Inner child healing", "Shadow integration", "Internal Family Systems",
    "Somatic experiencing", "Attachment theory", "Therapeutic journaling",
    "Parts work", "PTSD recovery", "Complex trauma healing",
    "Polyvagal theory", "Emotional regulation", "Self-compassion practices"
  ],
  "urban_planning": [
    "Transit-oriented development", "Zoning reform", "15-minute cities",
    "Public space design", "Pedestrian infrastructure", "Bike lanes",
    "Mixed-use development", "Urban forestry", "Smart cities",
    "Tactical urbanism", "Complete streets", "Infill development",
    "Affordable housing policy", "Urban density", "Walkability metrics"
  ],
  ... (17 more categories - see full list in Architecture section)
}
```

**Implementation Tips**:
- Use VSCode or similar to validate JSON structure
- Ensure commas are correct (no trailing commas)
- Use consistent formatting (2-space indent)
- Each interest should be 2-5 words

**Verification**:
- [ ] JSON is valid (use `json.tool` or VSCode validation)
- [ ] 20 new categories added (total: 35)
- [ ] Each new category has 12-15 interests
- [ ] Total interests: ~627 (347 old + 280 new)

#### Step 2.2: Add Category Lookup Method (30 min)

**File**: `/workspace/grove-backend/src/dev/seed-data.service.ts`

Add method to find which category an interest belongs to:

```typescript
/**
 * Get the category that an interest belongs to
 * Used for topic distribution tracking
 */
getCategoryForInterest(interest: string): string {
  for (const [category, interests] of Object.entries(this.seedData.interests)) {
    if (interests.includes(interest)) {
      return category;
    }
  }
  this.logger.warn(`Interest "${interest}" not found in any category`);
  return 'unknown';
}

/**
 * Get topic distribution statistics for a set of interests
 * Returns category name → count mapping
 */
getTopicDistribution(interests: string[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const interest of interests) {
    const category = this.getCategoryForInterest(interest);
    distribution[category] = (distribution[category] || 0) + 1;
  }

  return distribution;
}
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Methods have correct return types

#### Step 2.3: Add Topic Distribution Tracking to Generation (45 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: In `generatePersonaBatchWithMetaPersonas()` method, after line 282

```typescript
// After getting all interests (line 281)
const allInterests = this.seedDataService.getRandomInterests(count, categories);

// NEW: Track topic distribution
const topicDistribution = this.seedDataService.getTopicDistribution(allInterests);

// Log distribution statistics (after meta-persona distribution log at line 289)
this.logger.log(`Meta-persona distribution: ${JSON.stringify(stats)}`);
this.logger.log(`Topic distribution (${Object.keys(topicDistribution).length} categories):`);

// Sort by usage count descending
const sortedTopics = Object.entries(topicDistribution)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 15); // Top 15 categories

for (const [category, usageCount] of sortedTopics) {
  const percentage = ((usageCount / count) * 100).toFixed(1);
  this.logger.log(`  - ${category}: ${usageCount} (${percentage}%)`);
}

// Warn if any category is overused (> 15% threshold)
const maxAllowed = Math.ceil(count * 0.15); // 15% of total
for (const [category, usageCount] of Object.entries(topicDistribution)) {
  if (usageCount > maxAllowed) {
    this.logger.warn(
      `⚠️  Category "${category}" overused: ${usageCount}/${count} (${((usageCount/count)*100).toFixed(1)}% > 15% threshold)`
    );
  }
}
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Logger is already injected (check constructor)
- [ ] Logic is after interest selection but before generation loop

#### Step 2.4: Testing - Verify Topic Distribution (45 min)

Create test script: `/workspace/grove-backend/scripts/test-topic-distribution.ts`

```typescript
#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeedDataService } from '../src/dev/seed-data.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const seedDataService = app.get(SeedDataService);

  console.log('Testing topic distribution...\n');

  // Test 1: Verify categories loaded
  const categories = seedDataService.getInterestCategories();
  console.log(`✓ Loaded ${categories.length} interest categories:`);
  console.log(`  ${categories.join(', ')}\n`);

  if (categories.length !== 35) {
    console.error(`❌ Expected 35 categories, got ${categories.length}`);
    process.exit(1);
  }

  // Test 2: Sample 100 random interests
  const sample = seedDataService.getRandomInterests(100);
  console.log(`✓ Sampled 100 random interests\n`);

  // Test 3: Get distribution
  const distribution = seedDataService.getTopicDistribution(sample);
  console.log(`Topic Distribution:\n`);

  const sorted = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a);

  for (const [category, count] of sorted) {
    const percentage = ((count / 100) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 2)); // Visual bar
    console.log(`  ${category.padEnd(30)} ${String(count).padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
  }

  // Test 4: Check for overuse
  console.log('\n');
  const maxAllowed = 15; // 15% of 100
  let overused = 0;
  for (const [category, count] of Object.entries(distribution)) {
    if (count > maxAllowed) {
      console.log(`⚠️  "${category}" overused: ${count}/100 (${((count/100)*100).toFixed(1)}%)`);
      overused++;
    }
  }

  if (overused === 0) {
    console.log('✓ No categories overused (all <= 15%)');
  }

  console.log('\n✅ Topic distribution test complete');

  await app.close();
}

main();
```

**Run**:
```bash
cd /workspace/grove-backend
npx ts-node scripts/test-topic-distribution.ts
```

**Expected Results**:
- [ ] 35 categories loaded (15 old + 20 new)
- [ ] 100 interests sampled
- [ ] Distribution shows spread across categories
- [ ] Most categories have 1-5 uses (with 100 samples from 35 categories, avg = 2.86 per category)
- [ ] No category exceeds 15% (15 uses)

**If test fails**:
- Check `interests.json` is valid JSON
- Check all 20 new categories are present
- Check `SeedDataService` reloads data correctly

#### Step 2.5: Success Criteria for Phase 2

- [ ] 20 new interest categories added to interests.json
- [ ] Total: 35 categories, ~627 interests
- [ ] JSON is valid and parseable
- [ ] `getCategoryForInterest()` method implemented
- [ ] `getTopicDistribution()` method implemented
- [ ] Topic distribution logging added to generation method
- [ ] Overuse warnings implemented (> 15% threshold)
- [ ] Test script confirms 35 categories load correctly
- [ ] Distribution is balanced (no category > 15% in sample)

**Deliverables**:
- Updated `/workspace/grove-backend/src/dev/seed-data/interests.json`
- Updated `/workspace/grove-backend/src/dev/seed-data.service.ts`
- Updated `/workspace/grove-backend/src/dev/dev.service.ts`
- Test script `/workspace/grove-backend/scripts/test-topic-distribution.ts`
- Test output log

---

### Phase 3: Add Deduplication Check (1-2 hours)

**Time Estimate**: 1-2 hours

**Objective**: Prevent identical `interests + project` combinations from being inserted into the database.

#### Step 3.1: Implement Deduplication Logic (60 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: `createPersonas()` method starting at line 712

```typescript
private async createPersonas(
  personas: CreateManualPersonaDto[],
  orgId: string,
): Promise<PersonaResponse[]> {
  const created: PersonaResponse[] = [];

  // NEW: Deduplication tracking
  const seenCombinations = new Set<string>();
  let duplicateCount = 0;
  let emailDuplicateCount = 0;

  for (const persona of personas) {
    // NEW: Generate unique key from interests + project
    const combinationKey = this.generatePersonaCombinationKey(
      persona.interests,
      persona.project,
    );

    // NEW: Check for duplicate combination
    if (seenCombinations.has(combinationKey)) {
      this.logger.warn(
        `Duplicate persona detected (interests+project combination already exists): ` +
        `interests="${persona.interests.substring(0, 50)}..." + ` +
        `project="${persona.project.substring(0, 50)}...". Skipping.`
      );
      duplicateCount++;
      continue; // Skip this persona
    }

    seenCombinations.add(combinationKey);

    // Check if email already exists (EXISTING LOGIC)
    const existing = await this.prisma.user.findUnique({
      where: { email: persona.email },
    });

    if (existing) {
      this.logger.warn(`Persona with email ${persona.email} already exists, skipping`);
      emailDuplicateCount++;
      continue;
    }

    // Create user with isTestData flag (EXISTING LOGIC CONTINUES...)
    const user = await this.prisma.user.create({
      data: {
        email: persona.email,
        name: persona.name,
        orgId,
        role: 'user',
        status: 'active',
        isTestData: true,
      },
    });

    // Create profile with isTestData flag
    const profile = await this.prisma.profile.create({
      data: {
        userId: user.id,
        interests: persona.interests,
        project: persona.project,
        connectionType: persona.connectionType,
        deepDive: persona.deepDive,
        preferences: persona.preferences,
        isTestData: true,
      },
    });

    // Queue embedding generation
    await this.embeddingQueue.add(
      {
        userId: user.id,
        profileId: profile.id,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(`Created test persona: ${persona.email} (User ID: ${user.id})`);

    // Check embedding status
    const embedding = await this.prisma.embedding.findUnique({
      where: { userId: user.id },
    });

    created.push({
      id: user.id,
      name: user.name,
      email: user.email,
      interests: profile.interests,
      project: profile.project,
      connectionType: profile.connectionType,
      deepDive: profile.deepDive || undefined,
      preferences: profile.preferences || undefined,
      embeddingStatus: embedding ? 'generated' : 'pending',
      createdAt: user.createdAt,
    });
  }

  // NEW: Log deduplication statistics
  if (duplicateCount > 0 || emailDuplicateCount > 0) {
    this.logger.log(
      `Deduplication summary: ` +
      `${duplicateCount} duplicate persona combinations skipped, ` +
      `${emailDuplicateCount} duplicate emails skipped ` +
      `(${((duplicateCount + emailDuplicateCount)/personas.length*100).toFixed(1)}% of batch)`
    );
  }

  return created;
}

/**
 * Generate a normalized combination key for deduplication
 * Uses interests + project fields, normalized for comparison
 */
private generatePersonaCombinationKey(interests: string, project: string): string {
  // Normalize: trim whitespace, lowercase, remove extra spaces
  const normalizedInterests = interests.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedProject = project.trim().toLowerCase().replace(/\s+/g, ' ');

  // Use a delimiter that's unlikely to appear in content
  return `${normalizedInterests}|||${normalizedProject}`;
}
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Method is private (implementation detail)
- [ ] Normalization handles edge cases (extra spaces, different capitalization)
- [ ] Delimiter `|||` is unlikely to appear in actual persona text

#### Step 3.2: Testing - Verify Deduplication (45 min)

Create test script: `/workspace/grove-backend/scripts/test-deduplication.ts`

```typescript
#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateManualPersonaDto } from '../src/dev/dto/create-manual-persona.dto';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const devService = app.get(DevService);
  const prisma = app.get(PrismaService);

  console.log('Testing deduplication logic...\n');

  // Ensure test org exists
  const testOrgId = '00000000-0000-0000-0000-000000000000';
  await prisma.org.upsert({
    where: { id: testOrgId },
    update: {},
    create: {
      id: testOrgId,
      name: 'Test Organization',
      domain: 'test.grove.local',
      status: 'active',
    },
  });

  // Test 1: Create personas with intentional duplicates
  const testPersonas: CreateManualPersonaDto[] = [
    {
      name: 'Alice Test',
      email: 'dedup-test-1@test.grove.test',
      interests: 'I love photography and hiking',
      project: 'Building a photo blog',
      connectionType: 'friendship',
    },
    {
      name: 'Bob Test',
      email: 'dedup-test-2@test.grove.test',
      interests: 'I love photography and hiking', // DUPLICATE interests
      project: 'Building a photo blog',           // DUPLICATE project
      connectionType: 'friendship',
    },
    {
      name: 'Carol Test',
      email: 'dedup-test-3@test.grove.test',
      interests: 'I LOVE PHOTOGRAPHY AND HIKING', // Same but different case
      project: 'Building a Photo Blog',           // Same but different case
      connectionType: 'friendship',
    },
    {
      name: 'Dave Test',
      email: 'dedup-test-4@test.grove.test',
      interests: 'I enjoy cooking',
      project: 'Testing new recipes',
      connectionType: 'friendship',
    },
  ];

  console.log(`Attempting to create ${testPersonas.length} personas (2 duplicates expected)...\n`);

  // Call createPersonas (this is a private method, so we use the public API)
  // Since createPersonas is private, we'll test through the public method
  // For this test, we'll manually call the createPersonas method via a workaround

  // Workaround: Use reflection or create a test-specific public method
  // For now, let's use the bulkUpload method which calls createPersonas
  const result = await devService.bulkUpload(
    { personas: testPersonas },
    testOrgId,
  );

  console.log(`\nResult: Created ${result.count} personas`);
  console.log(`Expected: 2 (Alice and Dave, Bob and Carol are duplicates)\n`);

  if (result.count === 2) {
    console.log('✅ Deduplication working correctly!');
  } else {
    console.log(`❌ Expected 2 personas, got ${result.count}`);
  }

  // Cleanup
  console.log('\nCleaning up test data...');
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'dedup-test-',
      },
    },
  });

  console.log('✓ Cleanup complete\n');

  await app.close();
}

main();
```

**Run**:
```bash
cd /workspace/grove-backend
npx ts-node scripts/test-deduplication.ts
```

**Expected Results**:
- [ ] 4 personas attempted
- [ ] 2 personas created (Alice, Dave)
- [ ] 2 duplicates detected and skipped (Bob duplicate of Alice, Carol duplicate of Alice)
- [ ] Log shows deduplication warnings
- [ ] Database has only 2 test personas

**If test fails**:
- Check `generatePersonaCombinationKey()` method normalizes correctly
- Check `seenCombinations` Set is working
- Check logger output for deduplication messages

#### Step 3.3: Success Criteria for Phase 3

- [ ] Deduplication logic implemented in `createPersonas()`
- [ ] `generatePersonaCombinationKey()` helper method created
- [ ] Normalization handles case, whitespace, and extra spaces
- [ ] Duplicate detection uses Set for O(1) lookup
- [ ] Statistics logged (duplicate count, percentage)
- [ ] Test script validates deduplication works
- [ ] Test script shows 2/4 personas created (2 duplicates skipped)
- [ ] TypeScript compiles without errors

**Deliverables**:
- Updated `/workspace/grove-backend/src/dev/dev.service.ts`
- Test script `/workspace/grove-backend/scripts/test-deduplication.ts`
- Test output log

---

### Phase 4: Enhanced Conditional Prompting (2-3 hours)

**Time Estimate**: 2-3 hours

**Objective**: Add life stage, expertise level, and geographic hint attributes to break persona clustering across additional dimensions.

#### Step 4.1: Add Interface and Helper Methods (45 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: Before class definition (top of file, after imports)

```typescript
/**
 * Enhanced conditioning attributes for persona generation
 * Adds additional dimensions beyond meta-persona style and topic
 */
interface PersonaConditions {
  metaPersona: MetaPersona;
  interest: string;
  lifeStageSuggestion: 'starting-out' | 'established' | 'transitioning';
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  geographicHint: 'urban' | 'suburban' | 'rural' | 'mixed';
}
```

**Location**: Inside DevService class (after constructor, before existing methods)

```typescript
/**
 * Generate random life stage with even distribution
 */
private getRandomLifeStage(): 'starting-out' | 'established' | 'transitioning' {
  const stages: Array<'starting-out' | 'established' | 'transitioning'> = [
    'starting-out',
    'established',
    'transitioning',
  ];
  return stages[Math.floor(Math.random() * stages.length)];
}

/**
 * Generate random expertise level with weighted distribution
 * Distribution: 30% beginner, 40% intermediate, 30% advanced
 */
private getRandomExpertiseLevel(): 'beginner' | 'intermediate' | 'advanced' {
  const rand = Math.random();
  if (rand < 0.3) return 'beginner';      // 30%
  if (rand < 0.7) return 'intermediate';  // 40%
  return 'advanced';                      // 30%
}

/**
 * Generate random geographic hint with weighted distribution
 * Distribution: 50% urban, 25% suburban, 15% rural, 10% mixed
 */
private getRandomGeographicHint(): 'urban' | 'suburban' | 'rural' | 'mixed' {
  const rand = Math.random();
  if (rand < 0.5) return 'urban';     // 50%
  if (rand < 0.75) return 'suburban'; // 25%
  if (rand < 0.9) return 'rural';     // 15%
  return 'mixed';                     // 10%
}
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Methods are private (internal use only)
- [ ] Distribution percentages add up to 100%
- [ ] Return types match interface definition

#### Step 4.2: Update buildSeedConstrainedPrompt() (60 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: `buildSeedConstrainedPrompt()` method signature (line 440)

```typescript
private buildSeedConstrainedPrompt(
  names: Array<{ fullName: string }>,
  interests: string[],
  intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
  customPrompt?: string,
  avoidPhrases: string[] = [],
  metaPersona?: any,
  // NEW: Add conditioning parameter
  conditions?: {
    lifeStage?: string;
    expertise?: string;
    geographic?: string;
  },
): string {
```

**Location**: Inside the method, after the meta-persona check (line 453-477)

```typescript
if (metaPersona) {
  const personaList = names.map((name, i) => `- ${name.fullName}: ${interests[i]}`).join('\n');

  // NEW: Add conditioning section to prompt
  const conditioningText = conditions ? `

PERSONA CONTEXT (use as subtle background influence, do NOT explicitly state these):
- Life Stage: ${conditions.lifeStage}
  - "starting-out": New to this interest, early in journey, learning basics, enthusiastic beginner energy
  - "established": Been doing this for a while, comfortable, consistent practice, moderate depth
  - "transitioning": Changing approach/focus, evolving relationship with the interest, reflective
- Expertise Level: ${conditions.expertise}
  - "beginner": Simple language, basic concepts, expressing curiosity, still learning fundamentals
  - "intermediate": Comfortable vocabulary, exploring nuances, building on foundations
  - "advanced": Technical depth, sophisticated understanding, mentorship/leadership potential
- Geographic Context: ${conditions.geographic}
  - "urban": City-based, access to communities/resources, possibly crowded spaces, fast-paced
  - "suburban": Balanced access, car-dependent, family/neighborhood context, moderate pace
  - "rural": Limited nearby community, self-directed, nature/space available, slower pace
  - "mixed": Blend of contexts or moving between them

CRITICAL: These are BACKGROUND influences only. Do not write "I'm a beginner in an urban setting" explicitly. Instead, let these naturally shape language sophistication, project scope, and context references. A beginner might say "just started" or "trying to learn", an advanced person might mention "exploring edge cases" or "mentoring newcomers". An urban person might reference "local meetups" or "coffee shops", a rural person might mention "online communities" or "self-teaching".` : '';

  return `Generate realistic employee profiles for these ${names.length} people with these pre-assigned interests.
${conditioningText}

ASSIGNED NAMES & INTERESTS:
${personaList}

CRITICAL RULES:
- Use the EXACT names provided above
- Base each persona on their assigned interest
- Write in FIRST PERSON ("I enjoy", "I'm learning", not "they enjoy")
- Follow the STYLE GUIDELINES from the system prompt
- Target length: ${metaPersona.lengthTarget.min}-${metaPersona.lengthTarget.max} characters for the bio
- Generate unique 5-digit numbers for emails
- The persona context above should SUBTLY influence the content, NOT be stated explicitly

Return a JSON array with ${names.length} objects, each with:
- name: Use EXACT name from list above
- email: dev-persona-XXXXX@test.grove.test (unique 5-digit number)
- interests: A bio written in the assigned style (${metaPersona.lengthTarget.min}-${metaPersona.lengthTarget.max} chars)
- project: What they're currently working on (follow PROJECT FIELD RULES in system prompt)
- connectionType: "friendship", "mentorship", "collaboration", or "networking"
- deepDive (optional): A niche topic they're diving into
- preferences (optional): Meeting/connection preferences`;
}

// ... rest of method unchanged (non-meta-persona logic) ...
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Conditioning text is only added when `conditions` parameter is provided
- [ ] Instructions emphasize SUBTLE influence (not explicit)
- [ ] Examples guide GPT-4o on how to apply conditions

#### Step 4.3: Update Generation Loop (30 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: In `generatePersonaBatchWithMetaPersonas()`, inside the for loop (around line 293-310)

```typescript
for (let i = 0; i < count; i++) {
  const name = allNames[i];
  const interest = allInterests[i];
  const metaPersona = metaPersonaAssignments[i];

  // NEW: Generate conditioning attributes
  const conditions = {
    lifeStage: this.getRandomLifeStage(),
    expertise: this.getRandomExpertiseLevel(),
    geographic: this.getRandomGeographicHint(),
  };

  this.logger.log(
    `Generating persona ${i + 1}/${count} with ${metaPersona.name} ` +
    `(${conditions.lifeStage}, ${conditions.expertise}, ${conditions.geographic})`
  );

  try {
    const prompt = this.buildSeedConstrainedPrompt(
      [name],
      [interest],
      intensityLevel,
      undefined,
      [],
      metaPersona,
      conditions, // NEW: Pass conditions
    );

    const result = await this.openaiService.generatePersonaContent(
      prompt,
      metaPersona.systemPrompt,
    );

    // ... rest of generation logic unchanged ...
  } catch (error) {
    // ... error handling unchanged ...
  }
}
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Conditions are generated for each persona
- [ ] Conditions are logged (visible in console output)
- [ ] Conditions are passed to `buildSeedConstrainedPrompt()`

#### Step 4.4: Add Conditioning Distribution Tracking (30 min)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Location**: After the generation loop in `generatePersonaBatchWithMetaPersonas()` (around line 340)

```typescript
// After the for loop completes, before allPersonas.push(...)
// NEW: Track conditioning attribute distribution
const conditioningStats = {
  lifeStage: { 'starting-out': 0, established: 0, transitioning: 0 },
  expertise: { beginner: 0, intermediate: 0, advanced: 0 },
  geographic: { urban: 0, suburban: 0, rural: 0, mixed: 0 },
};

// We need to track these during generation, so let's refactor slightly
// Move this tracking INSIDE the for loop, after conditions are generated

// Inside for loop, after `const conditions = { ... }`:
conditioningStats.lifeStage[conditions.lifeStage]++;
conditioningStats.expertise[conditions.expertise]++;
conditioningStats.geographic[conditions.geographic]++;

// After the for loop (line 340ish):
this.logger.log(`Conditioning attribute distribution:`);
this.logger.log(`  Life Stage: starting-out=${conditioningStats.lifeStage['starting-out']}, established=${conditioningStats.lifeStage.established}, transitioning=${conditioningStats.lifeStage.transitioning}`);
this.logger.log(`  Expertise: beginner=${conditioningStats.expertise.beginner}, intermediate=${conditioningStats.expertise.intermediate}, advanced=${conditioningStats.expertise.advanced}`);
this.logger.log(`  Geographic: urban=${conditioningStats.geographic.urban}, suburban=${conditioningStats.geographic.suburban}, rural=${conditioningStats.geographic.rural}, mixed=${conditioningStats.geographic.mixed}`);
```

**Full refactored version**:

```typescript
// Before for loop (line 290ish)
const conditioningStats = {
  lifeStage: { 'starting-out': 0, established: 0, transitioning: 0 },
  expertise: { beginner: 0, intermediate: 0, advanced: 0 },
  geographic: { urban: 0, suburban: 0, rural: 0, mixed: 0 },
};

// Inside for loop, after const conditions = { ... }:
conditioningStats.lifeStage[conditions.lifeStage]++;
conditioningStats.expertise[conditions.expertise]++;
conditioningStats.geographic[conditions.geographic]++;

// After for loop completes (before final log at line 341):
this.logger.log('\n=== Conditioning Attribute Distribution ===');
this.logger.log(`Life Stage: starting-out=${conditioningStats.lifeStage['starting-out']}, established=${conditioningStats.lifeStage.established}, transitioning=${conditioningStats.lifeStage.transitioning}`);
this.logger.log(`Expertise: beginner=${conditioningStats.expertise.beginner}, intermediate=${conditioningStats.expertise.intermediate}, advanced=${conditioningStats.expertise.advanced}`);
this.logger.log(`Geographic: urban=${conditioningStats.geographic.urban}, suburban=${conditioningStats.geographic.suburban}, rural=${conditioningStats.geographic.rural}, mixed=${conditioningStats.geographic.mixed}`);
this.logger.log('==========================================\n');
```

**Verification**:
- [ ] TypeScript compiles
- [ ] Stats object initialized before loop
- [ ] Stats incremented inside loop
- [ ] Stats logged after loop completes

#### Step 4.5: Testing - Verify Conditioning (45 min)

Create test script: `/workspace/grove-backend/scripts/test-conditioning.ts`

```typescript
#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const devService = app.get(DevService);

  console.log('Testing enhanced conditional prompting...\n');

  // Generate 24 personas (3 per meta-persona)
  console.log('Generating 24 personas with conditioning attributes...\n');

  const personas = await devService.generatePersonaBatchWithMetaPersonas(
    24,
    'mixed',
    undefined,
    'conditioning_test',
  );

  console.log(`\n✓ Generated ${personas.length} personas\n`);

  // Analyze: Look for variety in language suggesting different expertise levels
  console.log('Sample Analysis:\n');

  // Find examples of different expertise levels (based on language complexity)
  const samples = [
    personas.find(p => p.interests.includes('started') || p.interests.includes('new') || p.interests.includes('learning')),
    personas.find(p => p.interests.length > 200 && (p.interests.includes('advanced') || p.interests.includes('deep'))),
    personas.find(p => p.interests.includes('recently') || p.interests.includes('began')),
  ];

  samples.forEach((persona, i) => {
    if (persona) {
      console.log(`Example ${i + 1}: ${persona.name}`);
      console.log(`  Interests: "${persona.interests.substring(0, 100)}..."`);
      console.log(`  Project: "${persona.project}"`);
      console.log();
    }
  });

  console.log('✅ Check logs above for conditioning distribution statistics');
  console.log('   Expected: ~33% each life stage, 30%/40%/30% expertise, 50%/25%/15%/10% geographic\n');

  await app.close();
}

main();
```

**Run**:
```bash
cd /workspace/grove-backend
npx ts-node scripts/test-conditioning.ts
```

**Expected Results**:
- [ ] 24 personas generated
- [ ] Log shows conditioning distribution:
  - Life Stage: ~8 starting-out, ~8 established, ~8 transitioning
  - Expertise: ~7 beginner, ~10 intermediate, ~7 advanced
  - Geographic: ~12 urban, ~6 suburban, ~4 rural, ~2 mixed
- [ ] Sample personas show language variety (beginner uses simpler language, advanced uses technical terms)
- [ ] No explicit mentions of "I'm a beginner" or "I'm in an urban setting"

**If test fails**:
- Check helper methods return correct types
- Check conditions are passed to prompt
- Check prompt instructs GPT-4o to use conditions subtly

#### Step 4.6: Success Criteria for Phase 4

- [ ] `PersonaConditions` interface defined
- [ ] Three helper methods implemented: `getRandomLifeStage()`, `getRandomExpertiseLevel()`, `getRandomGeographicHint()`
- [ ] `buildSeedConstrainedPrompt()` accepts `conditions` parameter
- [ ] Conditioning section added to prompt (with subtle influence instructions)
- [ ] Generation loop generates and passes conditions for each persona
- [ ] Conditioning distribution tracked and logged
- [ ] Test script validates distribution matches expected weights
- [ ] Sample personas show subtle language variety
- [ ] TypeScript compiles without errors

**Deliverables**:
- Updated `/workspace/grove-backend/src/dev/dev.service.ts`
- Test script `/workspace/grove-backend/scripts/test-conditioning.ts`
- Test output log

---

### Phase 5: Testing and Validation (1-2 hours)

**Time Estimate**: 1-2 hours (mostly automated, waiting for generation + embeddings)

**Objective**: Regenerate 100-persona test batch with all fixes, run diversity analysis, and validate improvements.

#### Step 5.1: Clean Existing Test Data (5 min)

**Command**:
```bash
cd /workspace/grove-backend
npx ts-node -e "
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('Deleting existing test personas...');
  const result = await prisma.user.deleteMany({
    where: { isTestData: true },
  });
  console.log(\`Deleted \${result.count} test personas\`);

  await app.close();
}
main();
"
```

**Verification**:
- [ ] Command completes successfully
- [ ] Log shows number of deleted personas

#### Step 5.2: Generate New Test Batch (15 min + 3-5 min generation time)

**File**: Use existing script `/workspace/grove-backend/scripts/generate-meta-persona-test.ts` (no changes needed)

**Command**:
```bash
cd /workspace/grove-backend
npx ts-node scripts/generate-meta-persona-test.ts
```

**Expected Output**:
```
🚀 Starting meta-persona test data generation...

🏢 Ensuring test organization exists...
   ✅ Test organization already exists

🗑️  Deleting existing test personas...
   Deleted 0 existing test personas

✨ Generating 100 personas with meta-persona architecture...
   This may take several minutes (100 individual API calls)

Meta-persona distribution: {"The Academic":12,"The Storyteller":12,...}
Topic distribution (35 categories):
  - web3_blockchain: 4 (4.0%)
  - creative_artistic: 3 (3.0%)
  ...
Conditioning attribute distribution:
  Life Stage: starting-out=34, established=33, transitioning=33
  Expertise: beginner=28, intermediate=42, advanced=30
  Geographic: urban=51, suburban=24, rural=14, mixed=11

✅ Generated 100 personas with meta-persona architecture

💾 Creating profiles in database...
   Created 100 profiles in database

⏳ Waiting for embeddings to be generated...
   Progress: 100/100 embeddings (100.0%)

✅ All embeddings generated successfully!
```

**Verification**:
- [ ] 100 personas generated
- [ ] Meta-persona distribution balanced (12-13 each)
- [ ] Topic distribution shows 35 categories (not just 15)
- [ ] No category exceeds 15% (no overuse warnings)
- [ ] Conditioning distribution matches expected weights
- [ ] 100 profiles created in database
- [ ] 100 embeddings generated
- [ ] Zero "working on personal projects" in output (check logs)

**If generation fails**:
- Check OpenAI API key is configured
- Check network connectivity
- Check rate limits (may need to add delays between calls)

#### Step 5.3: Run Diversity Analysis (5 min)

**Command**:
```bash
cd /workspace/grove-backend
npx ts-node scripts/test-diversity.ts --batch-id="phase5_fixed" --count=100
```

**Expected Output**:
```
Running diversity analysis...

Persona Count: 100
Timestamp: 2025-10-31T...

=== Embedding Similarity ===
Average Pairwise Similarity: 0.384 ✅
Clustered Pairs (>0.70): 0% ✅
Similarity Std Dev: 0.118 ✅
Status: PASS

=== Length Distribution ===
Avg Length: 245
Std Dev: 218 ✅
Distribution: brief=47%, short=4%, medium=2%, long=21%, veryLong=26%
Status: PASS

=== N-gram Repetition ===
Trigram Diversity: 0.963 ✅
High Repetition Count (>5): 0 ✅
Top repeated trigrams:
  - "im working on" (4 times)
  - "i am currently" (4 times)
  ...
Status: PASS

OVERALL: PASS ✅
```

**Verification**:
- [ ] Avg embedding similarity < 0.40 (target met)
- [ ] Length std dev > 200 (preserved from Phase 4)
- [ ] Trigram diversity > 0.95
- [ ] "working on personal" count = 0 (critical fix validated)
- [ ] Overall status: PASS

**If analysis fails**:
- Check embeddings were generated correctly
- Check diversity analysis CLI is working
- Review specific failing metrics

#### Step 5.4: Create Comparison Document (30 min)

Create `/workspace/thoughts/metrics/2025-10-31-phase5-fixed-vs-phase4-comparison.md` to document improvements.

**Template structure**:
```markdown
# Phase 5 (Fixed) vs Phase 4 (Original Meta-Persona) Comparison

## Executive Summary

After implementing project field templates, topic diversity expansion, deduplication, and enhanced conditioning, the persona generation system now PASSES all diversity metrics.

## Detailed Metrics Comparison

### Embedding Similarity
| Metric | Phase 4 | Phase 5 Fixed | Change | Status |
|--------|---------|---------------|--------|--------|
| Avg Similarity | 0.433 ❌ | 0.384 ✅ | -11.3% | IMPROVED |
| Clustered Pairs | 2 (0.04%) | 0 (0%) | -100% | IMPROVED |
| Std Dev | 0.116 | 0.118 | +1.7% | STABLE |

### Length Distribution
| Metric | Phase 4 | Phase 5 Fixed | Change | Status |
|--------|---------|---------------|--------|--------|
| Std Dev | 220.6 ✅ | 218 ✅ | -1.2% | PRESERVED |
| Avg Length | 248 | 245 | -1.2% | STABLE |

### N-gram Repetition
| Metric | Phase 4 | Phase 5 Fixed | Change | Status |
|--------|---------|---------------|--------|--------|
| Trigram Diversity | 0.942 | 0.963 ✅ | +2.2% | IMPROVED |
| "working on personal" | 40x ❌ | 0x ✅ | -100% | FIXED |

## Root Cause Fixes Validated

1. ✅ Project field templates eliminated template pollution
2. ✅ Topic expansion (35 categories) improved semantic diversity
3. ✅ Deduplication prevented exact duplicates
4. ✅ Enhanced conditioning added subtle variation

## Conclusion

All critical issues resolved. System ready for production deployment.
```

**Fill in with actual metrics** from Step 5.3 output.

**Verification**:
- [ ] Document created
- [ ] All metrics filled in with actual values
- [ ] Improvements documented and explained
- [ ] Conclusion states readiness (or next steps if not passing)

#### Step 5.5: Manual Quality Spot Check (15 min)

Query database for sample personas and review quality:

**Command**:
```bash
cd /workspace/grove-backend
npx ts-node -e "
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  // Get 10 random test personas
  const personas = await prisma.user.findMany({
    where: { isTestData: true },
    include: { profile: true },
    take: 10,
  });

  console.log('Sample Personas:\n');
  personas.forEach((user, i) => {
    console.log(\`\${i + 1}. \${user.name}\`);
    console.log(\`   Interests: \"\${user.profile.interests}\"\`);
    console.log(\`   Project: \"\${user.profile.project}\"\`);
    console.log(\`   Lengths: interests=\${user.profile.interests.length}, project=\${user.profile.project.length}\`);
    console.log();
  });

  await app.close();
}
main();
"
```

**Review**:
- [ ] Interests show variety (brief, medium, long, very long)
- [ ] Project fields show variety (not all "working on personal projects")
- [ ] No obvious duplicates
- [ ] Language complexity varies (some simple, some technical)
- [ ] Styles are distinct (Minimalist is terse, Storyteller is narrative)

#### Step 5.6: Success Criteria for Phase 5

**Automated Metrics** (from diversity analysis):
- [ ] ✅ Avg embedding similarity < 0.40 (target: < 0.40)
- [ ] ✅ Length std dev > 200 (target: > 50, bonus: > 200)
- [ ] ✅ Trigram diversity > 0.95 (target: > 0.95)
- [ ] ✅ "working on personal projects" count = 0 (target: 0)
- [ ] ✅ Duplicate pairs = 0 (target: 0)
- [ ] ✅ Overall status: PASS

**Qualitative**:
- [ ] ✅ Topic distribution shows 35 categories (up from 15)
- [ ] ✅ No category exceeds 15% usage
- [ ] ✅ Conditioning distribution matches expected weights
- [ ] ✅ Project fields vary in style per meta-persona
- [ ] ✅ Sample personas show language variety
- [ ] ✅ No obvious quality issues

**Deliverables**:
- [ ] 100 test personas generated and in database
- [ ] Diversity analysis results saved
- [ ] Comparison document created
- [ ] Sample quality review completed
- [ ] All phases complete

---

## Risk Assessment & Mitigation

### Critical Risks

**Risk 1: OpenAI API Failures During Generation**
- **Likelihood**: Medium (API rate limits, network issues, service outages)
- **Impact**: High (blocks testing and validation)
- **Mitigation**:
  - Fallback logic already implemented (Phase 1.2)
  - Add retry logic with exponential backoff (future enhancement)
  - Test with smaller batches first (8-24 personas)
  - Monitor API rate limits during generation

**Risk 2: Metrics Worsen Instead of Improve**
- **Likelihood**: Low (design is based on proven research and Phase 4 learnings)
- **Impact**: High (need to rethink approach)
- **Mitigation**:
  - Phased implementation allows incremental testing
  - Each phase has its own test script to validate in isolation
  - Can roll back to Phase 4 if needed (code is additive, not destructive)
  - Comparison document will show if regressions occur

**Risk 3: 35 Categories Create Topic Fragmentation**
- **Likelihood**: Medium (more categories = more spread)
- **Impact**: Medium (may need to adjust category count)
- **Mitigation**:
  - Topic distribution tracking will show if spread is too thin
  - Can adjust in seed data without code changes
  - Target 2-4 personas per category on average (35 categories, 100 personas = 2.86 avg)

### Non-Critical Risks

**Risk 4: Enhanced Conditioning Has Minimal Impact**
- **Likelihood**: Medium (GPT-4o may not pick up on subtle cues)
- **Impact**: Low (Phase 4 will show if it helps; if not, can skip in production)
- **Mitigation**:
  - Test independently in Phase 4 test script
  - Can disable by not passing `conditions` parameter
  - No harm if ineffective, just no additional benefit

**Risk 5: Deduplication Too Aggressive**
- **Likelihood**: Low (using exact string matching, very conservative)
- **Impact**: Low (may skip valid personas, but unlikely)
- **Mitigation**:
  - Logging shows how many duplicates are skipped
  - Can review logs to see if false positives occur
  - Can adjust normalization logic if needed

**Risk 6: Generation Time Exceeds 10 Minutes**
- **Likelihood**: Medium (100 sequential API calls, 2-4 seconds each = 3-7 minutes baseline)
- **Impact**: Low (annoying but not blocking)
- **Mitigation**:
  - Accept longer generation time for testing (10-15 minutes acceptable)
  - Performance optimization (batching) deferred to future sprint
  - Can generate smaller batches for faster iteration during development

---

## Rollback Plan

If metrics worsen or critical issues are discovered:

### Rollback Procedure

**Step 1: Identify which phase introduced the regression**
- Review comparison document metrics
- Check logs for errors or warnings
- Isolate the problematic change

**Step 2: Revert code changes for that phase**
- Use git to revert specific files
- Or manually remove code changes from that phase
- Keep earlier phases if they worked correctly

**Step 3: Regenerate test batch without the reverted phase**
- Clean test data
- Run generation script
- Run diversity analysis
- Validate metrics improved

**Step 4: Document findings and next steps**
- Update comparison document with rollback results
- Document why the phase was rolled back
- Plan alternative approach if needed

### Phase-Specific Rollback

**Phase 1 Rollback**: Remove project field templates from system prompts
- **Impact**: Reverts to Phase 4 behavior (template pollution returns)
- **Effort**: 30 minutes (edit 8 system prompts)

**Phase 2 Rollback**: Revert interests.json to 15 categories
- **Impact**: Removes new topics, may not help semantic diversity
- **Effort**: 5 minutes (git revert file)

**Phase 3 Rollback**: Remove deduplication logic
- **Impact**: Exact duplicates may be inserted (unlikely to affect metrics much)
- **Effort**: 15 minutes (remove code from createPersonas method)

**Phase 4 Rollback**: Remove conditional prompting
- **Impact**: Personas lack life stage/expertise/geographic variation
- **Effort**: 30 minutes (remove from prompt and generation loop)

### Complete Rollback

If all phases need to be rolled back:

**Option A: Revert to Phase 4 (original meta-persona)**
```bash
git checkout ce3dc9cf -- src/dev/meta-personas/meta-persona.service.ts
git checkout ce3dc9cf -- src/dev/dev.service.ts
git checkout ce3dc9cf -- src/dev/seed-data/interests.json
```

**Option B: Revert to baseline (no meta-personas)**
```bash
# Use original generatePersonaBatch() instead of generatePersonaBatchWithMetaPersonas()
# Modify test script to call old method
```

---

## Performance Considerations

### Current Performance Profile

**Phase 4 Baseline**:
- 100 personas × 2-4 seconds per API call = 3-7 minutes generation time
- 100 embedding generations = 5-10 minutes (async queue)
- Total: 8-17 minutes end-to-end

**Expected After All Phases**:
- Same generation time (no performance changes)
- Topic distribution tracking: +50ms overhead (negligible)
- Deduplication: O(n) with Set, <10ms overhead
- Enhanced conditioning: No additional overhead (just longer prompts)
- **Total expected**: 8-17 minutes (no regression)

### Future Optimizations (Out of Scope)

**Optimization 1: Batch API Calls by Meta-Persona**
- **Current**: 100 individual API calls
- **Future**: 8 API calls (12-13 personas per call, grouped by meta-persona)
- **Savings**: 100 calls → 8 calls = 12.5x reduction
- **Estimated time**: 3-7 minutes → 15-30 seconds
- **Effort**: 4-6 hours (requires refactoring generation logic)

**Optimization 2: Parallel Generation for Different Meta-Personas**
- **Current**: Sequential generation
- **Future**: Generate all 8 meta-persona types in parallel
- **Savings**: 8x parallelization = ~8x faster
- **Estimated time**: 3-7 minutes → 30-60 seconds
- **Effort**: 2-3 hours (requires async/await orchestration)

**Optimization 3: Caching Interest Category Lookups**
- **Current**: O(n) search through all categories for each interest
- **Future**: Build reverse map (interest → category) on service initialization
- **Savings**: O(n) → O(1), reduces overhead from ~50ms → ~1ms
- **Effort**: 30 minutes

---

## Testing Strategy

### Unit Testing (Future Enhancement)

**Recommended unit tests** (not included in this plan, but suggested for future):

1. **Test meta-persona fallback logic**:
   - Verify each meta-persona ID returns correct fallback
   - Verify unknown ID returns generic fallback

2. **Test conditioning helper methods**:
   - Verify `getRandomLifeStage()` returns valid values
   - Verify `getRandomExpertiseLevel()` distribution over 1000 samples
   - Verify `getRandomGeographicHint()` distribution over 1000 samples

3. **Test deduplication key generation**:
   - Verify normalization (case, whitespace)
   - Verify delimiter prevents collisions
   - Verify identical content generates same key

4. **Test topic distribution tracking**:
   - Verify `getCategoryForInterest()` returns correct category
   - Verify `getTopicDistribution()` counts correctly
   - Verify overuse detection triggers at 15% threshold

### Integration Testing

**Covered by phase-specific test scripts**:
- Phase 1: `test-project-fields.ts` - Validates project field variety
- Phase 2: `test-topic-distribution.ts` - Validates 35 categories loaded
- Phase 3: `test-deduplication.ts` - Validates duplicate detection
- Phase 4: `test-conditioning.ts` - Validates conditioning distribution
- Phase 5: Full diversity analysis - Validates all metrics

### Manual Testing

**Step 1: Spot check persona quality**
- Read 10-20 random personas
- Verify they sound natural and human-written
- Check for obvious AI artifacts or template language

**Step 2: Verify meta-persona distinctiveness**
- Read one persona from each meta-persona type
- Verify they sound different (Minimalist vs Storyteller vs Academic)
- Check length targets are respected

**Step 3: Check for edge cases**
- Very brief personas (< 30 chars) - should exist
- Very long personas (> 400 chars) - should exist
- Unusual interests (niche categories) - should exist
- Different expertise levels - should be subtly visible in language

---

## Documentation Requirements

### Code Documentation

**Required**:
- [ ] JSDoc comments on all new public methods
- [ ] Inline comments explaining non-obvious logic (e.g., deduplication key format, conditioning distribution weights)
- [ ] Update README if generation process changes

**Example JSDoc**:
```typescript
/**
 * Generate a meta-persona aware fallback project description
 *
 * Used when AI generation fails or returns incomplete data.
 * Returns a project description matching the meta-persona's voice and length target.
 *
 * @param metaPersona - The meta-persona to match
 * @param interest - The persona's interest for context
 * @returns A fallback project description in the meta-persona's style
 *
 * @example
 * getMetaPersonaFallbackProject(minimalistMetaPersona, 'photography')
 * // Returns: "Exploring."
 *
 * getMetaPersonaFallbackProject(enthusiastMetaPersona, 'photography')
 * // Returns: "Diving into photography! It's amazing!"
 */
private getMetaPersonaFallbackProject(metaPersona: MetaPersona, interest: string): string {
  // ...
}
```

### Process Documentation

**Required documents**:
- [ ] This implementation plan (current document)
- [ ] Phase 5 comparison document (Step 5.4)
- [ ] Test output logs for each phase

**Recommended documents** (future):
- Architecture decision record (ADR) for meta-persona approach
- Runbook for troubleshooting persona generation issues
- Performance optimization roadmap

---

## Approval & Sign-Off

### Pre-Implementation Checklist

Before starting implementation:
- [ ] Plan reviewed and approved by user
- [ ] OpenAI API key is configured and working
- [ ] Development environment is set up (Node.js, TypeScript, PostgreSQL)
- [ ] Backup of current codebase created (git branch)
- [ ] Time allocated for implementation (9-14 hours)

### Post-Implementation Checklist

After Phase 5 complete:
- [ ] All 5 phases implemented and tested
- [ ] Diversity analysis shows PASS on all metrics
- [ ] Comparison document shows improvements over Phase 4
- [ ] Manual quality review shows good persona variety
- [ ] No regressions in length diversity (std dev > 200)
- [ ] Zero instances of "working on personal projects"
- [ ] Zero exact duplicates detected

### Production Deployment Checklist

Before deploying to production (separate from this plan):
- [ ] Code review by second developer
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Performance benchmarks acceptable
- [ ] Rollback procedure tested
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] User acceptance testing complete

---

## Conclusion

This implementation plan addresses all critical issues discovered in Phase 4 testing while preserving the 4.5x length diversity improvement. The five-phase approach allows incremental validation and easy rollback if issues arise.

**Key Improvements**:
1. **Phase 1**: Eliminates "working on personal projects" template pollution
2. **Phase 2**: Expands topic diversity from 15 → 35 categories
3. **Phase 3**: Prevents exact duplicate personas
4. **Phase 4**: Adds life stage, expertise, and geographic conditioning
5. **Phase 5**: Validates all improvements with 100-persona test batch

**Expected Outcome**: All diversity metrics PASS, semantic similarity < 0.40, length diversity > 200, zero template pollution.

**Implementation Time**: 9-14 hours (mostly automated testing)

**Risk**: Low (incremental approach, easy rollback, based on proven research)

**Next Steps**: Obtain approval and begin Phase 1 implementation.

---

## Appendix A: Research Citations

**ArXiv Papers Referenced**:
1. "More unique topics = better diversity" - Source: thoughts/research/2025-10-30-persona-generation-diversity-improvements-research.md
2. "Conditional prompting breaks clustering" - Source: Meta-persona architecture design from Phase 3

**Internal Documentation Referenced**:
- thoughts/metrics/2025-10-31-meta-persona-vs-baseline-comparison.md
- thoughts/metrics/2025-10-31-baseline-diversity-metrics.md
- thoughts/implementation-details/2025-10-31-persona-diversity-phase-3-meta-persona-architecture.md
- thoughts/reviews/2025-10-31-PERSONA-DIV-003-phase-3-review-meta-persona-architecture.md

---

## Appendix B: File Change Summary

**Files Created** (6):
- `/workspace/grove-backend/scripts/test-project-fields.ts` - Phase 1 test
- `/workspace/grove-backend/scripts/test-topic-distribution.ts` - Phase 2 test
- `/workspace/grove-backend/scripts/test-deduplication.ts` - Phase 3 test
- `/workspace/grove-backend/scripts/test-conditioning.ts` - Phase 4 test
- `/workspace/thoughts/metrics/2025-10-31-phase5-fixed-vs-phase4-comparison.md` - Results document
- `/workspace/thoughts/plans/2025-10-31-fix-persona-generation-project-field-and-topic-diversity.md` - This plan

**Files Modified** (3):
- `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts` - Add project field templates to 8 system prompts
- `/workspace/grove-backend/src/dev/dev.service.ts` - Multiple changes:
  - Add meta-persona fallback helper
  - Add topic distribution tracking
  - Add deduplication logic
  - Add conditioning interface and helpers
  - Update prompt builder
  - Update generation loop
- `/workspace/grove-backend/src/dev/seed-data/interests.json` - Add 20 new categories (~280 interests)
- `/workspace/grove-backend/src/dev/seed-data.service.ts` - Add category lookup methods

**Files Unchanged**:
- `/workspace/grove-backend/scripts/generate-meta-persona-test.ts` - Reuse existing
- `/workspace/grove-backend/src/openai/openai.service.ts` - No changes needed
- All other files remain unchanged

**Total LOC Added**: ~800 lines (including test scripts and documentation)

**Total LOC Modified**: ~200 lines (mostly in dev.service.ts)

---

**Plan Status**: Draft - Awaiting Approval
**Created By**: Claude (Plan Architect Agent)
**Date**: 2025-10-31
