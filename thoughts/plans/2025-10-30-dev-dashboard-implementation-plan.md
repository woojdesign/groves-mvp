---
doc_type: plan
date: 2025-10-30T20:34:21+00:00
title: "Dev Dashboard: Test Persona Generation and Management"
feature: "dev-dashboard"

phases:
  - name: "Phase 1: Database & Guards"
    status: pending
  - name: "Phase 2: Backend: Generation"
    status: pending
  - name: "Phase 3: Backend: Status/Matching"
    status: pending
  - name: "Phase 4: Frontend: Generation UI"
    status: pending
  - name: "Phase 5: Frontend: Status UI"
    status: pending
  - name: "Phase 6: Testing"
    status: pending

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-30
last_updated_by: Sean Kim

tags:
  - development
  - testing
  - personas
  - admin
status: draft

related_docs: []
---

# Dev Dashboard Implementation Plan

## Overview

**Problem**: Developers need to generate test personas for matching algorithm development and testing without cluttering production data.

**Solution**: Build a super_admin-only Dev Dashboard with 4 persona generation methods, status monitoring, and match preview capabilities. All test data is flagged and filtered from real user matching.

**Success Criteria**:
- Generate test personas via 4 methods (presets, custom, manual, bulk)
- View embedding status and match previews with similarity scores
- Manage test users (delete, export)
- Block access in production environment
- Test data never appears in real user matches

---

## Requirements

### Functional Requirements

**4 Persona Generation Methods**:
1. **Preset Templates**: 10 casual/engaged/deep/mixed + 50 diverse personas
2. **Custom Generation**: Specify count, intensity level, categories, optional custom prompt
3. **Manual Creation**: Form with 5 onboarding questions
4. **Bulk Upload**: Upload JSON/CSV files

**Status Dashboard**:
- List all test users with embedding status (generated/pending/failed)
- Preview potential matches with similarity scores (dev-only feature)
- Delete individual or bulk test users
- Export test data as JSON

### Technical Requirements

- **Security**: super_admin role only, blocked in production (NODE_ENV check)
- **Data Isolation**: isTestData flag on User/Profile, filtered from real matching
- **Backend**: NestJS DevModule with dedicated controller/service
- **Frontend**: React components under /admin/dev route
- **Database**: Schema migration for isTestData flag
- **Integration**: OpenAI API for persona generation and embeddings

### Out of Scope

- Test data analytics/reporting (future phase)
- Automated test scenario orchestration
- Match acceptance simulation
- Performance benchmarking tools

---

## Current State Analysis

### Backend Structure
- **Admin System**: `/workspace/grove-backend/src/admin/` with controller/service/DTOs
  - Existing pattern: `@Roles(Role.SUPER_ADMIN)` decorator for authorization
  - OrgScoped decorator for multi-tenancy
- **OpenAI Service**: `/workspace/grove-backend/src/openai/openai.service.ts`
  - Has `generateEmbedding()` and `preprocessProfileText()` methods
  - Mock embeddings available when API key not configured
- **Profile Creation**: `/workspace/grove-backend/src/profiles/profiles.service.ts`
  - Creates profile + triggers embedding generation
- **Database**: PostgreSQL with Prisma ORM
  - 11 tables defined in `/workspace/grove-backend/prisma/schema.prisma`
  - User model has role field (user, org_admin, super_admin)

### Frontend Structure
- **Admin Route**: `/workspace/src/admin/AdminRoute.tsx` checks role, redirects if unauthorized
- **Admin Layout**: `/workspace/src/admin/components/AdminLayout.tsx` provides shell
- **Existing Pages**: AdminDashboardPage, UsersPage, SettingsPage, AuditLogsPage
- **API Service**: `/workspace/src/lib/apiService.ts` for HTTP requests

### Matching System
- **Matching Service**: `/workspace/grove-backend/src/matching/` handles similarity calculations
- **Embeddings**: Vector column in embeddings table for cosine similarity matching
- Need to add filter to exclude isTestData=true users from real matches

---

## Architecture Design

### Database Changes

Add `isTestData` boolean flag to User and Profile models:

```prisma
model User {
  // ... existing fields
  isTestData Boolean @default(false) @map("is_test_data") // Dev-generated test persona
  // ... relations
}

model Profile {
  // ... existing fields
  isTestData Boolean @default(false) @map("is_test_data") // Dev-generated test persona
  // ... relations
}
```

### Backend Architecture

```
grove-backend/src/dev/
├── dev.module.ts          # DevModule with EnvironmentGuard
├── dev.controller.ts      # 4 generation + status endpoints
├── dev.service.ts         # Persona generation logic
├── guards/
│   └── environment.guard.ts  # Blocks production access
├── dto/
│   ├── generate-preset.dto.ts
│   ├── generate-custom.dto.ts
│   ├── create-manual.dto.ts
│   └── bulk-upload.dto.ts
└── templates/
    └── persona-templates.ts   # 60 preset personas
```

**Key Endpoints**:
- `POST /admin/dev/personas/preset` - Generate from preset templates
- `POST /admin/dev/personas/custom` - Generate with OpenAI
- `POST /admin/dev/personas/manual` - Create single persona manually
- `POST /admin/dev/personas/bulk` - Upload JSON/CSV
- `GET /admin/dev/personas` - List all test users with status
- `GET /admin/dev/personas/:id/matches` - Preview matches for test user
- `DELETE /admin/dev/personas/:id` - Delete test user
- `DELETE /admin/dev/personas` - Bulk delete (query params)
- `GET /admin/dev/personas/export` - Export all test data

### Frontend Architecture

```
src/admin/dev/
├── pages/
│   └── DevDashboardPage.tsx      # Main dev dashboard
├── components/
│   ├── PersonaGenerationPanel.tsx  # 4 generation methods
│   ├── PresetTemplateForm.tsx
│   ├── CustomGenerationForm.tsx
│   ├── ManualCreationForm.tsx
│   ├── BulkUploadForm.tsx
│   ├── PersonaStatusList.tsx       # Table with status
│   ├── MatchPreview.tsx            # Similarity scores
│   └── PersonaActions.tsx          # Delete/export buttons
└── types/
    └── dev.types.ts                # TypeScript interfaces
```

### Security Flow

```
Request → SuperAdminGuard → EnvironmentGuard → DevController
                ↓                   ↓
          Check role         Check NODE_ENV !== 'production'
          super_admin        Return 403 if production
```

---

## Phase-by-Phase Implementation

## Phase 1: Database & Guards

**Goal**: Prepare database schema and security infrastructure

**Prerequisites**: None

**Files to Create**:
1. `/workspace/grove-backend/prisma/migrations/YYYYMMDDHHMMSS_add_is_test_data_flag/migration.sql`
   ```sql
   ALTER TABLE "users" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE "profiles" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;
   CREATE INDEX "users_is_test_data_idx" ON "users"("is_test_data");
   ```

2. `/workspace/grove-backend/src/dev/guards/environment.guard.ts`
   ```typescript
   import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';

   @Injectable()
   export class EnvironmentGuard implements CanActivate {
     constructor(private configService: ConfigService) {}

     canActivate(context: ExecutionContext): boolean {
       const nodeEnv = this.configService.get<string>('NODE_ENV');

       if (nodeEnv === 'production') {
         throw new ForbiddenException('Dev endpoints are disabled in production');
       }

       return true;
     }
   }
   ```

3. `/workspace/grove-backend/src/dev/dev.module.ts`
   ```typescript
   import { Module } from '@nestjs/common';
   import { DevController } from './dev.controller';
   import { DevService } from './dev.service';
   import { PrismaService } from '../prisma/prisma.service';
   import { OpenaiService } from '../openai/openai.service';
   import { ProfilesService } from '../profiles/profiles.service';

   @Module({
     controllers: [DevController],
     providers: [DevService, PrismaService, OpenaiService, ProfilesService],
   })
   export class DevModule {}
   ```

**Files to Modify**:
1. `/workspace/grove-backend/prisma/schema.prisma` - Add isTestData fields
2. `/workspace/grove-backend/src/app.module.ts` - Import DevModule
3. `/workspace/grove-backend/src/matching/matching.service.ts` - Add filter: `user.isTestData === false` in match queries

**Success Criteria**:
- [ ] Migration runs successfully: `npx prisma migrate dev`
- [ ] New columns exist in database
- [ ] EnvironmentGuard returns 403 when NODE_ENV=production
- [ ] DevModule loads without errors

**Time Estimate**: 2 hours

---

## Phase 2: Backend: Generation

**Goal**: Implement 4 persona generation endpoints

**Prerequisites**: Phase 1 complete

**Files to Create**:

1. `/workspace/grove-backend/src/dev/templates/persona-templates.ts`
   ```typescript
   export const PERSONA_CATEGORIES = {
     casual: [...], // 10 personas
     engaged: [...],
     deep: [...],
     mixed: [...],
     diverse: [...], // 50 personas across interests
   };
   ```

2. `/workspace/grove-backend/src/dev/dto/generate-preset.dto.ts`
   ```typescript
   export class GeneratePresetDto {
     @IsEnum(['casual', 'engaged', 'deep', 'mixed', 'diverse'])
     category: string;

     @IsInt()
     @Min(1)
     @Max(50)
     count: number;
   }
   ```

3. `/workspace/grove-backend/src/dev/dto/generate-custom.dto.ts`
   ```typescript
   export class GenerateCustomDto {
     @IsInt() @Min(1) @Max(100)
     count: number;

     @IsEnum(['casual', 'engaged', 'deep'])
     intensity: string;

     @IsArray()
     categories: string[]; // ['tech', 'art', 'science']

     @IsOptional()
     @IsString()
     customPrompt?: string;
   }
   ```

4. `/workspace/grove-backend/src/dev/dto/create-manual.dto.ts`
   ```typescript
   export class CreateManualDto {
     @IsString()
     nicheInterest: string;

     @IsString()
     project: string;

     @IsString()
     connectionType: string;

     @IsOptional()
     @IsString()
     rabbitHole?: string;

     @IsOptional()
     @IsString()
     preferences?: string;
   }
   ```

5. `/workspace/grove-backend/src/dev/dto/bulk-upload.dto.ts`
   ```typescript
   export class BulkUploadDto {
     @IsArray()
     personas: CreateManualDto[];
   }
   ```

6. `/workspace/grove-backend/src/dev/dev.service.ts`
   - `generateFromPreset(dto)` - Select random personas from templates
   - `generateCustom(dto)` - Use OpenAI to generate personas based on criteria
   - `createManual(dto)` - Create single persona
   - `bulkCreate(dto)` - Create multiple personas
   - All methods set `isTestData: true`, generate unique emails like `test-persona-{uuid}@dev.grove.test`

7. `/workspace/grove-backend/src/dev/dev.controller.ts`
   ```typescript
   @Controller('admin/dev')
   @UseGuards(AuthGuard, RolesGuard, EnvironmentGuard)
   @Roles(Role.SUPER_ADMIN)
   export class DevController {
     @Post('personas/preset')
     async generatePreset(@Body() dto: GeneratePresetDto) { }

     @Post('personas/custom')
     async generateCustom(@Body() dto: GenerateCustomDto) { }

     @Post('personas/manual')
     async createManual(@Body() dto: CreateManualDto) { }

     @Post('personas/bulk')
     async bulkCreate(@Body() dto: BulkUploadDto) { }
   }
   ```

**Key Patterns**:
- Use `ProfilesService.createProfile()` to leverage existing embedding generation
- Email format: `test-persona-{uuid}@dev.grove.test`
- Name format: Generated or "Test User {number}"
- Always set `isTestData: true` on User and Profile
- Use existing `openaiService.generateEmbedding()` for custom generation

**Success Criteria**:
- [ ] POST /admin/dev/personas/preset creates users from templates
- [ ] POST /admin/dev/personas/custom generates OpenAI personas
- [ ] POST /admin/dev/personas/manual creates single persona
- [ ] POST /admin/dev/personas/bulk processes JSON array
- [ ] All test users have isTestData=true
- [ ] Embeddings queued/generated for all personas
- [ ] Returns 403 when NODE_ENV=production
- [ ] Returns 403 for non-super_admin users

**Time Estimate**: 6 hours

---

## Phase 3: Backend: Status/Matching

**Goal**: Implement status dashboard and match preview endpoints

**Prerequisites**: Phase 2 complete

**Files to Modify**:

1. `/workspace/grove-backend/src/dev/dev.controller.ts` - Add endpoints:
   ```typescript
   @Get('personas')
   async listPersonas(
     @Query('page') page?: string,
     @Query('limit') limit?: string,
   ) {
     // Return test users with embedding status
   }

   @Get('personas/:id/matches')
   async previewMatches(@Param('id') userId: string) {
     // Calculate similarity scores for test user
   }

   @Delete('personas/:id')
   async deletePersona(@Param('id') userId: string) {
     // Delete test user and cascade
   }

   @Delete('personas')
   async bulkDelete(@Query('ids') ids: string) {
     // Delete multiple test users
   }

   @Get('personas/export')
   async exportPersonas() {
     // Return JSON of all test data
   }
   ```

2. `/workspace/grove-backend/src/dev/dev.service.ts` - Add methods:
   - `listTestPersonas(page, limit)` - Query with `isTestData: true`, join embeddings
   - `previewMatches(userId)` - Use matching service to calculate top 10 matches
   - `deletePersona(userId)` - Soft delete or hard delete test user
   - `bulkDelete(userIds)` - Delete multiple in transaction
   - `exportTestData()` - Serialize all test users/profiles/embeddings

**Response Format**:
```typescript
// GET /admin/dev/personas
{
  personas: [
    {
      id: string,
      email: string,
      name: string,
      profile: {
        nicheInterest: string,
        project: string,
        connectionType: string,
      },
      embeddingStatus: 'generated' | 'pending' | 'failed',
      createdAt: string,
    }
  ],
  pagination: { page, limit, total }
}

// GET /admin/dev/personas/:id/matches
{
  userId: string,
  matches: [
    {
      userId: string,
      name: string,
      profile: { nicheInterest, project },
      similarityScore: number,
      sharedTopics: string[],
    }
  ]
}
```

**Success Criteria**:
- [ ] GET /admin/dev/personas returns paginated test users
- [ ] Embedding status correctly shown (check embeddings table)
- [ ] GET /admin/dev/personas/:id/matches returns similarity scores
- [ ] DELETE /admin/dev/personas/:id removes test user
- [ ] DELETE /admin/dev/personas bulk deletes by IDs
- [ ] GET /admin/dev/personas/export returns JSON
- [ ] All endpoints blocked in production

**Time Estimate**: 4 hours

---

## Phase 4: Frontend: Generation UI

**Goal**: Build React forms for 4 persona generation methods

**Prerequisites**: Phase 2 complete

**Files to Create**:

1. `/workspace/src/admin/dev/types/dev.types.ts`
   ```typescript
   export interface TestPersona {
     id: string;
     email: string;
     name: string;
     profile: {
       nicheInterest: string;
       project: string;
       connectionType: string;
     };
     embeddingStatus: 'generated' | 'pending' | 'failed';
     createdAt: string;
   }

   export interface GeneratePresetRequest { category: string; count: number; }
   export interface GenerateCustomRequest { count: number; intensity: string; categories: string[]; customPrompt?: string; }
   // ... other types
   ```

2. `/workspace/src/admin/dev/components/PresetTemplateForm.tsx`
   - Dropdown: casual/engaged/deep/mixed/diverse (10/10/10/10/50)
   - Number input: count (1-50)
   - Submit button → POST /admin/dev/personas/preset

3. `/workspace/src/admin/dev/components/CustomGenerationForm.tsx`
   - Number input: count (1-100)
   - Radio buttons: intensity (casual/engaged/deep)
   - Multi-select: categories (tech, art, science, business, health, etc.)
   - Textarea: custom prompt (optional)
   - Submit → POST /admin/dev/personas/custom

4. `/workspace/src/admin/dev/components/ManualCreationForm.tsx`
   - 5 text inputs matching onboarding questions
   - Submit → POST /admin/dev/personas/manual

5. `/workspace/src/admin/dev/components/BulkUploadForm.tsx`
   - File input (JSON/CSV)
   - Parse and validate format
   - Submit → POST /admin/dev/personas/bulk

6. `/workspace/src/admin/dev/components/PersonaGenerationPanel.tsx`
   - Tabs for 4 methods
   - Success/error toast notifications
   - Loading states during generation

**Key Patterns**:
- Use existing `apiService.post()` from `/workspace/src/lib/apiService.ts`
- Follow AdminLayout styling conventions
- Toast notifications for success/errors
- Disable form during submission
- Clear form after successful generation

**Success Criteria**:
- [ ] All 4 forms render correctly
- [ ] Preset form generates personas on submit
- [ ] Custom form sends correct payload
- [ ] Manual form creates single persona
- [ ] Bulk upload parses JSON/CSV files
- [ ] Loading states show during API calls
- [ ] Success/error messages display
- [ ] Forms reset after success

**Time Estimate**: 5 hours

---

## Phase 5: Frontend: Status UI

**Goal**: Build status dashboard and match preview components

**Prerequisites**: Phase 3 complete

**Files to Create**:

1. `/workspace/src/admin/dev/components/PersonaStatusList.tsx`
   - Table columns: Name, Email, Interest, Project, Embedding Status, Created, Actions
   - Pagination controls
   - Checkbox for bulk selection
   - Delete button (individual)
   - Bulk delete button
   - Export button

2. `/workspace/src/admin/dev/components/MatchPreview.tsx`
   - Click persona → open modal/panel
   - Show top 10 matches with similarity scores
   - Display shared interests
   - Color-coded similarity (green >0.8, yellow 0.6-0.8, gray <0.6)

3. `/workspace/src/admin/dev/components/PersonaActions.tsx`
   - Delete confirmation dialog
   - Export format selector (JSON only for MVP)
   - Bulk action handlers

4. `/workspace/src/admin/dev/pages/DevDashboardPage.tsx`
   - Two-column layout:
     - Left: PersonaGenerationPanel
     - Right: PersonaStatusList
   - MatchPreview overlay/modal
   - Route: `/admin/dev`

5. `/workspace/src/App.tsx` - Add route:
   ```tsx
   <Route path="/admin/dev" element={
     <AdminRoute>
       <DevDashboardPage />
     </AdminRoute>
   } />
   ```

**Key Patterns**:
- Fetch data on mount: `useEffect(() => fetchPersonas(), [])`
- Polling for embedding status updates (every 5s when pending embeddings exist)
- Optimistic updates for delete actions
- Confirm dialog before bulk delete

**Success Criteria**:
- [ ] /admin/dev route loads dev dashboard
- [ ] Table displays all test personas with status
- [ ] Embedding status badge shows generated/pending/failed
- [ ] Click "Preview Matches" opens modal with similarity scores
- [ ] Delete button removes persona (with confirmation)
- [ ] Bulk delete works for selected personas
- [ ] Export downloads JSON file
- [ ] Pagination works correctly
- [ ] Route blocked for non-super_admin users

**Time Estimate**: 5 hours

---

## Phase 6: Testing

**Goal**: Manually verify all functionality

**Prerequisites**: Phases 1-5 complete

**Test Scenarios**:

### 1. Security Tests
- [ ] Log in as org_admin → cannot access /admin/dev (redirected)
- [ ] Log in as super_admin → can access /admin/dev
- [ ] Set NODE_ENV=production → all /admin/dev endpoints return 403
- [ ] Set NODE_ENV=development → endpoints work

### 2. Preset Generation
- [ ] Generate 5 casual personas → creates 5 test users
- [ ] Generate 10 diverse personas → creates 10 test users
- [ ] All users have isTestData=true
- [ ] All profiles created with expected fields
- [ ] Embeddings generated or queued

### 3. Custom Generation
- [ ] Generate 3 "deep" personas in "tech" category → OpenAI creates personas
- [ ] Custom prompt "blockchain enthusiasts" → generates relevant personas
- [ ] Verify embedding generation triggered

### 4. Manual Creation
- [ ] Fill form with 5 questions → creates single persona
- [ ] Persona appears in status list
- [ ] Embedding generated

### 5. Bulk Upload
- [ ] Upload JSON with 5 personas → creates all 5
- [ ] Invalid JSON → shows error message
- [ ] CSV upload → parses and creates personas

### 6. Status Dashboard
- [ ] All test personas display in table
- [ ] Embedding status shows correctly (pending → generated)
- [ ] Pagination works for >50 personas
- [ ] Search/filter (if implemented)

### 7. Match Preview
- [ ] Click persona → modal opens
- [ ] Shows top 10 matches with similarity scores
- [ ] Scores range from 0-1
- [ ] Shared interests displayed
- [ ] Only matches other test users (isTestData=true)

### 8. Delete Operations
- [ ] Delete single persona → removed from list
- [ ] Delete cascades to profile/embedding
- [ ] Bulk select 5 personas → bulk delete works
- [ ] Confirmation dialog appears

### 9. Export
- [ ] Export button downloads JSON file
- [ ] JSON contains all test personas with profiles
- [ ] File format is valid JSON

### 10. Data Isolation
- [ ] Real user matching excludes test personas
- [ ] Test persona matching excludes real users
- [ ] Verify with SQL query: `SELECT * FROM matches WHERE user_a_id IN (SELECT id FROM users WHERE is_test_data = true)`
- [ ] Should only find matches between test users

**Success Criteria**:
- [ ] All 10 test scenarios pass
- [ ] No test data leaks into real user matches
- [ ] Production environment blocks access
- [ ] Super admin can generate, view, and delete test personas

**Time Estimate**: 3 hours

---

## Risks & Mitigations

### Risk 1: OpenAI Rate Limits
**Impact**: Custom generation fails at scale
**Mitigation**:
- Implement exponential backoff retry logic
- Queue-based generation with rate limiting
- Fallback to template-based generation
- Display clear error messages

### Risk 2: Test Data Leakage
**Impact**: Test personas appear in real user matches
**Likelihood**: Medium
**Mitigation**:
- Add `isTestData` filter to ALL matching queries
- Write integration test to verify isolation
- Add database constraint/trigger to prevent test→real matches
- Periodic audit query in monitoring

### Risk 3: Accidental Production Deployment
**Impact**: Dev endpoints exposed in production
**Likelihood**: Low
**Mitigation**:
- EnvironmentGuard checks NODE_ENV
- Add CI/CD check to fail if dev routes accessible
- Feature flag in addition to environment check
- Alert if /admin/dev receives traffic in production

### Risk 4: Bulk Operations Performance
**Impact**: Creating 100 personas times out
**Likelihood**: Medium
**Mitigation**:
- Batch operations in transactions
- Background job queue for large batches
- Progress indicator in UI
- Limit bulk operations to 50 at a time

---

## Configuration Changes

### Environment Variables
```bash
# .env
NODE_ENV=development  # Must be != 'production' for dev endpoints
OPENAI_API_KEY=sk-... # Required for custom generation
```

### Database Migration
```bash
cd grove-backend
npx prisma migrate dev --name add_is_test_data_flag
npx prisma generate
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run all tests (Phase 6)
- [ ] Verify EnvironmentGuard blocks production
- [ ] Test with OpenAI API key
- [ ] Test without OpenAI API key (mock embeddings)
- [ ] Code review for security issues

### Deployment
- [ ] Run database migration in staging
- [ ] Deploy backend first
- [ ] Verify /admin/dev returns 403 in staging (if production-like)
- [ ] Deploy frontend
- [ ] Verify super_admin can access dev dashboard in development

### Post-Deployment
- [ ] Create 10 test personas in development
- [ ] Run match preview for test user
- [ ] Verify test data isolated from real users
- [ ] Monitor logs for errors
- [ ] Document usage in internal wiki

---

## Documentation Requirements

### Developer Documentation
- [ ] Add section to README: "Dev Dashboard Usage"
- [ ] Document persona template structure
- [ ] Explain isTestData flag and filtering
- [ ] Provide example API requests (curl/Postman)

### User Documentation (Internal)
- [ ] Create guide: "How to Generate Test Personas"
- [ ] Explain 4 generation methods with screenshots
- [ ] Document match preview feature
- [ ] Export/import workflow for test scenarios

### API Documentation
- [ ] Add /admin/dev endpoints to Swagger/OpenAPI
- [ ] Document request/response schemas
- [ ] Add authentication requirements
- [ ] Note production blocking behavior

---

## Future Enhancements

**Phase 7: Analytics** (not in scope)
- Match success rates for test personas
- Similarity score distribution charts
- Persona category effectiveness

**Phase 8: Test Orchestration** (not in scope)
- Automated test scenarios (e.g., "generate 20 users, run matching, verify top 5")
- Match acceptance simulation
- A/B testing for matching algorithms

**Phase 9: Performance Tools** (not in scope)
- Benchmark matching speed with N personas
- Load testing with test data
- Embedding generation performance metrics

---

## Time Estimate Summary

| Phase | Estimate |
|-------|----------|
| Phase 1: Database & Guards | 2 hours |
| Phase 2: Backend: Generation | 6 hours |
| Phase 3: Backend: Status/Matching | 4 hours |
| Phase 4: Frontend: Generation UI | 5 hours |
| Phase 5: Frontend: Status UI | 5 hours |
| Phase 6: Testing | 3 hours |
| **Total** | **25 hours** (~3-4 days) |

---

## Success Metrics

**Completion Criteria**:
- [x] All 6 phases complete
- [x] All test scenarios pass
- [x] Documentation written
- [x] Code reviewed and approved
- [x] Deployed to development environment

**Quality Metrics**:
- Zero test data in real user matches
- 100% of dev endpoints blocked in production
- <2s response time for persona generation (preset)
- <30s response time for custom generation (OpenAI)
- All API endpoints return proper error codes

**Adoption Metrics** (post-launch):
- Number of test personas generated per week
- Usage of 4 generation methods (distribution)
- Match preview feature usage
- Developer satisfaction survey

---

## Appendix: Key Code Patterns

### Creating Test User
```typescript
// dev.service.ts
async createTestUser(profileData: CreateManualDto) {
  const email = `test-persona-${uuidv4()}@dev.grove.test`;

  const user = await this.prisma.user.create({
    data: {
      email,
      name: profileData.nicheInterest.slice(0, 30) || 'Test User',
      orgId: 'default-dev-org-id',
      isTestData: true,
      role: 'user',
    },
  });

  const profile = await this.profilesService.createProfile({
    userId: user.id,
    ...profileData,
    isTestData: true,
  });

  return { user, profile };
}
```

### Filtering Test Data from Matching
```typescript
// matching.service.ts
async findMatches(userId: string) {
  const currentUser = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  // Only match test users with test users, real users with real users
  const candidates = await this.prisma.user.findMany({
    where: {
      id: { not: userId },
      isTestData: currentUser.isTestData, // KEY FILTER
      status: 'active',
      embedding: { isNot: null },
    },
    include: { embedding: true, profile: true },
  });

  // ... similarity calculation
}
```

### Environment Guard
```typescript
// environment.guard.ts
canActivate(context: ExecutionContext): boolean {
  const nodeEnv = this.configService.get<string>('NODE_ENV');

  if (nodeEnv === 'production') {
    throw new ForbiddenException('Dev endpoints disabled in production');
  }

  return true;
}
```

---

**Plan Status**: Draft
**Next Steps**: Review plan → Get approval → Begin Phase 1
**Questions/Blockers**: None
