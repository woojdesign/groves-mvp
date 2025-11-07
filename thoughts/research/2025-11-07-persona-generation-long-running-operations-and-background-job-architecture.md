---
doc_type: research
date: 2025-11-07T14:02:55+00:00
title: "Persona Generation Long-Running Operations and Background Job Architecture"
research_question: "How does persona generation currently work and what architecture should be used for handling long-running operations in staging?"
researcher: Sean Kim

git_commit: c02aa5c1ed74961e0ca56b92c5dd468316dc4522
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-11-07
last_updated_by: Sean Kim

tags:
  - persona-generation
  - background-jobs
  - bull-queue
  - staging
  - timeout
  - progress-tracking
  - architecture
status: draft

related_docs: []
---

# Research: Persona Generation Long-Running Operations and Background Job Architecture

**Date**: 2025-11-07T14:02:55+00:00
**Researcher**: Sean Kim
**Git Commit**: c02aa5c1ed74961e0ca56b92c5dd468316dc4522
**Branch**: main
**Repository**: workspace

## Research Question

How does persona generation currently work and what architecture should be used for handling long-running operations in staging with progress tracking?

**Problem Statement:**
- Persona generation times out after 30 seconds in staging
- User wants to see progress updates
- Operations should continue in the background
- Need visual status updates

## Summary

The persona generation system currently operates **synchronously** within HTTP request handlers, waiting for all OpenAI API calls and database operations to complete before responding. This causes timeout issues when generating batches of personas (especially 10-50 personas). The system already has Bull/BullMQ queue infrastructure for embedding generation but does NOT use it for persona generation itself.

**Key Findings:**
- Frontend timeout: 30 seconds (`/workspace/src/config/env.ts:9`)
- No backend HTTP timeout configured (NestJS defaults vary by platform)
- Persona generation is synchronous in `DevService.generatePreset()` (`/workspace/grove-backend/src/dev/dev.service.ts:55-79`)
- Bull queue infrastructure EXISTS and is ALREADY USED for embedding generation (`/workspace/grove-backend/src/jobs/embedding-generation.processor.ts`)
- No existing job status endpoints or polling mechanisms
- No WebSocket/SSE implementations found

## Current Architecture

### 1. Persona Generation Flow (Synchronous)

**Entry Point**: `/api/admin/dev/personas/preset`

**Request Flow:**
1. **Frontend** (`/workspace/src/admin/dev/components/PersonaGenerator.tsx:24-36`)
   - User clicks "Generate from Template" button
   - `handlePresetGenerate()` calls `devApi.generatePreset(template)`
   - Shows loading spinner while waiting
   - **Blocks on single HTTP request** until completion

2. **API Service** (`/workspace/src/lib/devApiService.ts:99-107`)
   - `generatePreset()` makes POST to `/admin/dev/personas/preset`
   - Uses axios instance with 30-second timeout (`/workspace/src/config/env.ts:9`)

3. **Backend Controller** (`/workspace/grove-backend/src/dev/dev.controller.ts:51-57`)
   - `@Post('personas/preset')` endpoint
   - Directly calls `devService.generatePreset()`
   - **Waits synchronously** for service to complete
   - Returns full response when done

4. **Dev Service** (`/workspace/grove-backend/src/dev/dev.service.ts:55-79`)
   - `generatePreset()` performs ALL work synchronously:
     ```typescript
     // Line 55-79
     async generatePreset(dto: GeneratePresetDto, orgId: string) {
       // 1. Generate personas using AI (BLOCKS on OpenAI calls)
       const personas = await this.generatePersonaBatch(
         config.count,
         config.intensityLevel,
         config.categories,
       );

       // 2. Create all personas in database (BLOCKS on DB writes)
       const created = await this.createPersonas(personas, orgId);

       // 3. Return response
       return { success: true, count: created.length, personas: created };
     }
     ```

5. **Batch Generation** (`/workspace/grove-backend/src/dev/dev.service.ts:207-274`)
   - Splits into sub-batches of 10 personas (line 216)
   - Each sub-batch makes an OpenAI API call (line 246-252)
   - For 50 personas: 5 sequential OpenAI calls, each taking 5-15 seconds
   - **Total time: 25-75 seconds for 50 personas**
   - **Times out at 30 seconds on frontend**

6. **Database Creation** (`/workspace/grove-backend/src/dev/dev.service.ts:824-934`)
   - Creates User + Profile records for each persona
   - **Queues embedding generation** (line 889-898) - This part is async!
   - Returns immediately with `embeddingStatus: 'pending'`

### 2. Existing Background Job Infrastructure

**Bull Queue System** (Already Implemented!)

**Configuration** (`/workspace/grove-backend/src/jobs/jobs.module.ts:11-31`)
```typescript
BullModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    redis: {
      host: configService.get<string>('REDIS_HOST') || 'localhost',
      port: configService.get<number>('REDIS_PORT') || 6379,
    },
  }),
}),
BullModule.registerQueue({
  name: 'embedding-generation',
}),
```

**Embedding Generation Processor** (`/workspace/grove-backend/src/jobs/embedding-generation.processor.ts`)
- Processes `embedding-generation` queue jobs
- Runs asynchronously in background
- Has retry logic (3 attempts with exponential backoff)
- Works PERFECTLY for long-running tasks

**Current Usage:**
- Embedding generation is already async (`/workspace/grove-backend/src/dev/dev.service.ts:889-898`)
- Profiles module also uses the same queue (`/workspace/grove-backend/src/profiles/profiles.service.ts:72`)
- Queue is injected via `@InjectQueue('embedding-generation')` (line 48 of dev.service.ts)

### 3. Timeout Sources

**Frontend Timeout:**
- Location: `/workspace/src/config/env.ts:9`
- Value: 30,000 ms (30 seconds)
- Applied to: All axios requests via `config.apiTimeout`
- Impact: Any request exceeding 30 seconds will fail with timeout error

**Backend Timeout:**
- No explicit HTTP timeout configured in NestJS
- Platform-dependent defaults (varies by deployment environment)
- Likely higher than 30 seconds but not guaranteed

**OpenAI API Timeouts:**
- Not explicitly configured
- Subject to OpenAI's rate limits and response times
- Typically 5-15 seconds per batch of 10 personas

### 4. UI Progress Tracking

**Current Implementation:**
- Binary loading state (`/workspace/src/admin/dev/components/PersonaGenerator.tsx:18`)
- Simple spinner during generation (line 84-86)
- No progress percentage or status updates
- No ability to see intermediate results

**Dev Dashboard** (`/workspace/src/admin/dev/DevDashboardPage.tsx`)
- Shows stats: total, generated, pending, failed (lines 105-110)
- Manual refresh button (line 130)
- Polls persona list on mount (line 33)
- No automatic polling during generation

## Timeout Sources (Complete List)

1. **Frontend axios timeout**: 30 seconds
   - File: `/workspace/src/config/env.ts:9`
   - Setting: `apiTimeout: 30000`

2. **Backend HTTP timeout**: Not explicitly configured
   - File: `/workspace/grove-backend/src/main.ts`
   - No timeout middleware found
   - Relies on platform defaults

3. **CORS configuration**: No timeout-related settings
   - File: `/workspace/grove-backend/src/main.ts:32-50`
   - Only origin/credentials/headers

4. **OpenAI Service**: No explicit timeout
   - File: `/workspace/grove-backend/src/openai/openai.service.ts`
   - Uses default axios/openai client timeouts

## Proposed Solution

### Architecture: Background Job Pattern with Polling

**Use the existing Bull queue infrastructure** for persona generation, not just embeddings.

### Phase 1: Make Persona Generation Asynchronous

#### 1.1 Create New Queue: `persona-generation`

**File**: `/workspace/grove-backend/src/jobs/jobs.module.ts`

Add new queue registration:
```typescript
BullModule.registerQueue({
  name: 'embedding-generation',
}),
BullModule.registerQueue({
  name: 'persona-generation', // NEW
}),
```

#### 1.2 Create Persona Generation Processor

**New File**: `/workspace/grove-backend/src/jobs/persona-generation.processor.ts`

```typescript
export interface PersonaGenerationJobPayload {
  jobId: string;
  orgId: string;
  template: string;
  count: number;
  intensityLevel: string;
  categories?: string[];
}

@Processor('persona-generation')
export class PersonaGenerationProcessor {
  @Process()
  async handlePersonaGeneration(job: Job<PersonaGenerationJobPayload>) {
    const { jobId, orgId, template, count, intensityLevel, categories } = job.data;

    // Update progress: 0% - Starting
    await job.progress(0);

    try {
      // Generate personas in sub-batches
      const personas = await this.generatePersonaBatch(count, intensityLevel, categories);
      await job.progress(50); // 50% - Personas generated

      // Create in database
      const created = await this.createPersonas(personas, orgId);
      await job.progress(100); // 100% - Complete

      return { success: true, count: created.length, personas: created };
    } catch (error) {
      // Job will retry automatically
      throw error;
    }
  }
}
```

#### 1.3 Update DevService to Queue Jobs

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

Modify `generatePreset()` to queue instead of execute:
```typescript
async generatePreset(dto: GeneratePresetDto, orgId: string) {
  const jobId = `preset-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const config = this.getPresetConfig(dto.template);

  // Queue the job instead of executing synchronously
  const job = await this.personaGenerationQueue.add(
    {
      jobId,
      orgId,
      template: dto.template,
      count: config.count,
      intensityLevel: config.intensityLevel,
      categories: config.categories,
    },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  );

  // Return immediately with job ID
  return {
    success: true,
    jobId: job.id.toString(),
    status: 'queued',
    message: `Persona generation queued (${config.count} personas)`,
  };
}
```

#### 1.4 Add Job Status Endpoint

**File**: `/workspace/grove-backend/src/dev/dev.controller.ts`

Add new endpoint:
```typescript
@Get('personas/jobs/:jobId')
async getJobStatus(@Param('jobId') jobId: string) {
  return this.devService.getJobStatus(jobId);
}
```

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

Add method:
```typescript
async getJobStatus(jobId: string) {
  const job = await this.personaGenerationQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();
  const progress = await job.progress();

  if (state === 'completed') {
    const result = await job.returnvalue;
    return {
      status: 'completed',
      progress: 100,
      result,
    };
  }

  if (state === 'failed') {
    return {
      status: 'failed',
      progress: progress || 0,
      error: job.failedReason,
    };
  }

  return {
    status: state, // 'waiting', 'active', 'delayed'
    progress: progress || 0,
  };
}
```

### Phase 2: Frontend Polling Implementation

#### 2.1 Add Job Status API Call

**File**: `/workspace/src/lib/devApiService.ts`

Add interface and function:
```typescript
export interface JobStatusResponse {
  status: 'queued' | 'active' | 'completed' | 'failed' | 'not_found';
  progress: number;
  result?: GeneratePersonasResponse;
  error?: string;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await api.get<JobStatusResponse>(
    `/admin/dev/personas/jobs/${jobId}`
  );
  return response.data;
}
```

#### 2.2 Update PersonaGenerator Component

**File**: `/workspace/src/admin/dev/components/PersonaGenerator.tsx`

Add polling logic:
```typescript
const [jobId, setJobId] = useState<string | null>(null);
const [progress, setProgress] = useState(0);

const handlePresetGenerate = async () => {
  try {
    setLoading(true);
    setError(null);

    // Start job
    const result = await devApi.generatePreset(presetTemplate as any);
    setJobId(result.jobId);

    // Poll for status
    const pollInterval = setInterval(async () => {
      const status = await devApi.getJobStatus(result.jobId);
      setProgress(status.progress);

      if (status.status === 'completed') {
        clearInterval(pollInterval);
        onPersonasCreated(status.result.personas);
        setLoading(false);
        setJobId(null);
      }

      if (status.status === 'failed') {
        clearInterval(pollInterval);
        setError(status.error || 'Generation failed');
        setLoading(false);
        setJobId(null);
      }
    }, 2000); // Poll every 2 seconds

  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to start generation');
    setLoading(false);
  }
};
```

#### 2.3 Add Progress UI

Update the button UI to show progress:
```typescript
<Button onClick={handlePresetGenerate} disabled={loading} className="w-full">
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Generating... {progress}%
    </>
  ) : (
    <>
      <Sparkles className="h-4 w-4 mr-2" />
      Generate from Template
    </>
  )}
</Button>
```

### Alternative: Server-Sent Events (SSE) for Real-Time Updates

Instead of polling, implement SSE for push-based updates:

**Benefits:**
- Real-time updates without polling overhead
- Lower latency
- More efficient

**Drawbacks:**
- More complex implementation
- Requires additional backend setup
- May have compatibility issues with some proxies

**Implementation would require:**
1. NestJS SSE endpoint using `@Sse()` decorator
2. Frontend EventSource API
3. Redis pub/sub for job progress events

**Recommendation**: Start with polling (simpler), migrate to SSE if needed.

## Implementation Checklist

### Backend Changes

- [ ] **Create persona-generation queue**
  - File: `/workspace/grove-backend/src/jobs/jobs.module.ts`
  - Add: `BullModule.registerQueue({ name: 'persona-generation' })`

- [ ] **Create PersonaGenerationProcessor**
  - New file: `/workspace/grove-backend/src/jobs/persona-generation.processor.ts`
  - Implement: `@Process()` handler with progress tracking
  - Move: `generatePersonaBatch()` logic from DevService

- [ ] **Update DevService**
  - File: `/workspace/grove-backend/src/dev/dev.service.ts`
  - Add: `@InjectQueue('persona-generation')` injection
  - Modify: `generatePreset()` to queue jobs instead of execute
  - Add: `getJobStatus(jobId)` method

- [ ] **Add job status endpoint**
  - File: `/workspace/grove-backend/src/dev/dev.controller.ts`
  - Add: `@Get('personas/jobs/:jobId')` endpoint

- [ ] **Update DevModule imports**
  - File: `/workspace/grove-backend/src/dev/dev.module.ts`
  - Ensure: JobsModule is imported (already done on line 19)

### Frontend Changes

- [ ] **Update API service**
  - File: `/workspace/src/lib/devApiService.ts`
  - Add: `JobStatusResponse` interface
  - Add: `getJobStatus(jobId)` function

- [ ] **Update PersonaGenerator component**
  - File: `/workspace/src/admin/dev/components/PersonaGenerator.tsx`
  - Add: `jobId` and `progress` state
  - Modify: `handlePresetGenerate()` to start job and poll
  - Add: Polling interval logic
  - Update: Button UI to show progress percentage

- [ ] **Update DevDashboardPage**
  - File: `/workspace/src/admin/dev/DevDashboardPage.tsx`
  - Optional: Add auto-refresh during generation
  - Optional: Show "X personas being generated" banner

### Testing

- [ ] Test with 10 persona generation (should complete quickly)
- [ ] Test with 50 persona generation (should show progress)
- [ ] Test timeout scenario (job continues even if user closes tab)
- [ ] Test failed job scenario (show error message)
- [ ] Test multiple concurrent generations (queue should handle)

### Deployment Considerations

- [ ] Ensure Redis is available in staging environment
- [ ] Configure Redis connection settings
- [ ] Set appropriate Bull queue retry settings
- [ ] Monitor queue performance and job completion times
- [ ] Consider adding job cleanup for old completed jobs

## Code References

### Current Synchronous Flow

- `/workspace/src/admin/dev/components/PersonaGenerator.tsx:24-36` - Frontend generation handler
- `/workspace/src/lib/devApiService.ts:99-107` - API service call
- `/workspace/grove-backend/src/dev/dev.controller.ts:51-57` - Controller endpoint
- `/workspace/grove-backend/src/dev/dev.service.ts:55-79` - Synchronous generation method
- `/workspace/grove-backend/src/dev/dev.service.ts:207-274` - Batch generation logic
- `/workspace/grove-backend/src/dev/dev.service.ts:824-934` - Database creation

### Existing Background Job Infrastructure

- `/workspace/grove-backend/src/jobs/jobs.module.ts:11-31` - Bull queue configuration
- `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts` - Example processor
- `/workspace/grove-backend/src/dev/dev.service.ts:48-49` - Queue injection pattern
- `/workspace/grove-backend/src/dev/dev.service.ts:889-898` - Example job queuing

### Timeout Configuration

- `/workspace/src/config/env.ts:9` - Frontend 30-second timeout
- `/workspace/src/lib/api.ts:17` - Axios instance configuration
- `/workspace/grove-backend/src/main.ts` - Backend server setup

### UI Components

- `/workspace/src/admin/dev/DevDashboardPage.tsx` - Main dashboard
- `/workspace/src/admin/dev/components/PersonaGenerator.tsx` - Generation UI
- `/workspace/src/admin/dev/components/PersonaList.tsx` - Persona list with status badges

## Architecture Benefits

### Why This Solution Works

1. **Leverages Existing Infrastructure**
   - Bull/Redis already configured
   - Embedding processor proves pattern works
   - Minimal new dependencies

2. **Handles Long-Running Operations**
   - No HTTP timeout issues
   - Job continues even if user closes tab
   - Automatic retries on failure

3. **Progress Visibility**
   - Real-time progress updates
   - User sees generation isn't stuck
   - Better user experience

4. **Scalability**
   - Queue handles concurrent generations
   - Can prioritize jobs
   - Can add more workers if needed

5. **Reliability**
   - Retry logic for transient failures
   - Job persistence in Redis
   - Can monitor job status in Bull Board (if added)

### Comparison: Current vs Proposed

| Aspect | Current (Synchronous) | Proposed (Background Jobs) |
|--------|----------------------|---------------------------|
| Timeout risk | High (30s frontend) | None (async) |
| Progress visibility | No | Yes (percentage) |
| User experience | Blocking, uncertain | Non-blocking, clear |
| Scalability | Limited (one at a time) | High (queue-based) |
| Reliability | No retry | Automatic retry |
| Code complexity | Simple | Moderate |
| Infrastructure | None extra needed | Redis (already have) |

## Open Questions

1. **Job Cleanup**: How long should completed/failed jobs remain in Redis?
   - Recommendation: 24 hours, then auto-cleanup

2. **Concurrent Generation Limit**: Should we limit concurrent persona generation jobs?
   - Recommendation: Max 3 concurrent jobs per org

3. **Progress Granularity**: Should we show sub-batch progress?
   - Recommendation: Yes, update progress after each sub-batch (every 10 personas)

4. **Frontend Timeout Increase**: Should we increase the 30s timeout as a fallback?
   - Recommendation: No, keep it as-is. Background jobs solve the root cause.

5. **Bull Board**: Should we add Bull Board for admin job monitoring?
   - Recommendation: Yes, very useful for debugging in staging

## Related Documentation

- Bull Queue Documentation: https://docs.bullmq.io/
- NestJS Bull Integration: https://docs.nestjs.com/techniques/queues
- Existing embedding generation processor: `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts`

## Next Steps

1. Implement Phase 1 (Backend) first
2. Test job queuing and processing manually
3. Implement Phase 2 (Frontend polling)
4. Test end-to-end in staging
5. Consider SSE migration if polling proves insufficient
6. Add Bull Board for job monitoring (optional but recommended)
