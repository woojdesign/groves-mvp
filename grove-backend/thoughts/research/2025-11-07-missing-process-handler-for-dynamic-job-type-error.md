---
doc_type: research
title: "Missing Process Handler for Dynamic Job Type Error in Persona Generation"
created: 2025-11-07T00:00:00Z
created_by: Claude Code
last_updated: 2025-11-07T00:00:00Z
last_updated_by: Claude Code
status: completed
research_question: "Why is Bull throwing 'Missing process handler for job type preset-1762530193031-at2tpx' when generating personas, and how does job type registration work in Bull/NestJS?"
tags:
  - bull
  - nestjs
  - queue
  - job-types
  - error-diagnosis
  - persona-generation
  - job-routing
related_docs:
  - thoughts/research/2025-11-07-bull-queue-processor-registration-duplicate-handler-error.md
git_commit: c432981b2d8afe22813fbcfb06ca7f2cc0f87fd9
git_branch: main
---

# Research: Missing Process Handler for Dynamic Job Type Error in Persona Generation

**Date**: 2025-11-07 00:00:00 UTC
**Researcher**: Claude Code
**Git Commit**: c432981b2d8afe22813fbcfb06ca7f2cc0f87fd9
**Branch**: main
**Repository**: groves-mvp

## Research Question

Why is Bull throwing "Missing process handler for job type preset-1762530193031-at2tpx" when generating personas via the Dev Dashboard, and how does job type/name registration work in Bull/NestJS?

## Summary

**Root Cause**: **JOB NAME/TYPE MISMATCH** - `DevService.generatePreset()` enqueues jobs with a **dynamic job name** (first argument to `queue.add()`), but `PersonaGenerationProcessor` has `@Process()` with **no argument**, which only handles the **default/unnamed** job type.

**The Mismatch**:
- **Enqueueing** (line 81-82 of `/workspace/grove-backend/src/dev/dev.service.ts`):
  ```typescript
  const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job = await this.personaGenerationQueue.add(
    jobId,  // ← First argument = JOB NAME (e.g., "preset-1762530193031-at2tpx")
    { jobId, orgId, ... }  // ← Second argument = payload
  );
  ```

- **Processing** (line 13 of `/workspace/grove-backend/src/dev/persona-generation.processor.ts`):
  ```typescript
  @Process()  // ← No argument = handles ONLY "__default__" job type
  async handle(job: Job<PersonaGenerationJobPayload>) { ... }
  ```

**Bull's Behavior**:
- When `queue.add(name, payload)` is called with a name, Bull creates a **named job**
- Named jobs require a processor with `@Process(name)` to match
- `@Process()` with no argument only handles unnamed/default jobs (when you call `queue.add(payload)` with one argument)
- Bull throws "Missing process handler for job type X" when it can't find a matching `@Process(X)` decorator

**Solution**: Change line 81-82 in `DevService.generatePreset()` to call `queue.add()` with **one argument** (payload only), not two arguments (name + payload).

---

## Detailed Findings

### 1. Bull Job Type/Name System

#### 1.1 How Bull Routes Jobs to Processors

Bull uses a **job name** (also called "job type") to route jobs to the correct handler method within a processor.

**Job Name Assignment**:
- **With name**: `queue.add('my-job-name', payload)` → Job name = `"my-job-name"`
- **Without name**: `queue.add(payload)` → Job name = `"__default__"`

**Processor Handler Registration**:
- **With name**: `@Process('my-job-name')` → Handles jobs with name = `"my-job-name"`
- **Without name**: `@Process()` → Handles jobs with name = `"__default__"`

**Routing Logic**:
```typescript
// Bull's internal routing (conceptual)
const handlers = {
  '__default__': defaultHandler,
  'my-job-name': specificHandler,
};

function processJob(job) {
  const handler = handlers[job.name];
  if (!handler) {
    throw new Error(`Missing process handler for job type ${job.name}`);
  }
  return handler(job);
}
```

#### 1.2 Single Processor, Multiple Handlers

A processor can have multiple `@Process()` decorators for different job types:

```typescript
@Processor('my-queue')
export class MyProcessor {
  @Process()  // Handles unnamed jobs
  async handleDefault(job: Job) { ... }

  @Process('specific-job')  // Handles jobs named 'specific-job'
  async handleSpecific(job: Job) { ... }

  @Process('another-job')  // Handles jobs named 'another-job'
  async handleAnother(job: Job) { ... }
}
```

**Use Case**: When you want different job types on the same queue processed by different methods.

**NOT Used in This Codebase**: The codebase uses one processor per queue with a single `@Process()` handler.

#### 1.3 Job ID vs. Job Name (Critical Distinction)

**Job ID**:
- Unique identifier for a specific job instance
- Automatically assigned by Bull (sequential integer) OR can be set via options
- Used to query job status: `queue.getJob(jobId)`
- Format: `1`, `2`, `3`, etc. (or custom via `jobId` option)

**Job Name/Type**:
- Category/type of job
- Used for routing to the correct processor handler
- Multiple jobs can have the same name
- Format: any string (e.g., `"send-email"`, `"generate-report"`)

**The Confusion**:
In `/workspace/grove-backend/src/dev/dev.service.ts:79-82`, the code creates a dynamic string called `jobId`:
```typescript
const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
```

But then uses it as the **first argument** to `queue.add()`, which Bull interprets as the **job name/type**, NOT the job ID:
```typescript
const job = await this.personaGenerationQueue.add(
  jobId,  // ← Bull interprets this as JOB NAME, not job ID!
  { ... }
);
```

**What the developer likely intended**:
- Use `jobId` as a unique identifier for tracking purposes
- But the correct way is to pass it in the job options or payload, not as the first argument

**Correct patterns**:

**Pattern A: Use job ID option (recommended for tracking)**
```typescript
const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const job = await this.personaGenerationQueue.add(
  { jobId, orgId, ... },  // ← ONE argument (payload)
  {
    jobId,  // ← Job ID in options
    attempts: 3,
    backoff: { ... },
  }
);
// Access later: job.id === jobId
```

**Pattern B: Use payload for tracking (current approach, but fix the enqueueing)**
```typescript
const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const job = await this.personaGenerationQueue.add(
  { jobId, orgId, ... },  // ← ONE argument (payload with jobId inside)
  {
    attempts: 3,
    backoff: { ... },
  }
);
// Access later: job.data.jobId === jobId
```

---

### 2. The Error in DevService.generatePreset()

#### 2.1 Current Implementation (INCORRECT)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts:62-115`

```typescript
async generatePreset(
  dto: GeneratePresetDto,
  orgId: string,
): Promise<{
  success: boolean;
  jobId: string;
  status: 'queued';
  message: string;
}> {
  this.logger.log(`Queuing persona generation job for template: ${dto.template}`);

  const config = this.getPresetConfig(dto.template);

  if (!config) {
    throw new BadRequestException(`Unknown preset template: ${dto.template}`);
  }

  // Line 79: Generate dynamic job identifier
  const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Line 81-104: Enqueue job with TWO arguments
  const job = await this.personaGenerationQueue.add(
    jobId,  // ← PROBLEM: First argument = JOB NAME (not job ID!)
    {       // ← Second argument = payload
      jobId,
      orgId,
      template: dto.template,
      count: config.count,
      intensityLevel: config.intensityLevel,
      categories: config.categories,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 60 * 60 * 24,
      },
      removeOnFail: {
        age: 60 * 60 * 24,
      },
    },
  );

  // Line 106-107: Initialize progress
  await job.progress(0);

  // Line 109-114: Return response with Bull's job.id (integer)
  return {
    success: true,
    jobId: job.id.toString(),  // ← Returns Bull's auto-generated ID, NOT the custom jobId!
    status: 'queued',
    message: `Persona generation queued (${config.count} personas)`,
  };
}
```

#### 2.2 What Happens When This Runs

**Step 1: Job Enqueueing**
```typescript
const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// Result: jobId = "preset-1762530193031-at2tpx"

const job = await this.personaGenerationQueue.add(
  jobId,  // ← Bull interprets as job NAME
  { jobId, orgId, ... }
);
```

**Step 2: Bull Creates Job**
- Bull creates a job with:
  - `job.name = "preset-1762530193031-at2tpx"`  (from first argument)
  - `job.id = 2`  (auto-generated sequential ID)
  - `job.data = { jobId: "preset-1762530193031-at2tpx", orgId, ... }`

**Step 3: Job is Queued**
- Job enters the queue successfully
- Frontend receives `jobId: "2"` (the Bull ID, not the custom jobId)
- Frontend polls `/api/dev/personas/generate/status/2`

**Step 4: Bull Attempts to Process**
- Bull looks for a processor with `@Processor('persona-generation')`
- Finds `PersonaGenerationProcessor`
- Bull looks for a handler with `@Process('preset-1762530193031-at2tpx')`
- **DOESN'T FIND ONE** - only finds `@Process()` (default handler)
- **THROWS ERROR**: `"Missing process handler for job type preset-1762530193031-at2tpx"`

#### 2.3 Why the Job ID is Returned as "2" Instead of the Custom String

**Line 111 returns**:
```typescript
jobId: job.id.toString(),
```

- `job.id` is Bull's auto-generated sequential integer ID (1, 2, 3, ...)
- The custom `jobId` string (`"preset-1762530193031-at2tpx"`) is stored in `job.data.jobId`
- But the API returns `job.id.toString()` which is `"2"`

**This creates a disconnect**:
- Custom `jobId` in payload: `"preset-1762530193031-at2tpx"`
- Bull `job.id`: `2`
- API returns: `"2"`
- Frontend polls with: `"2"`
- `getJobStatus()` uses: `this.personaGenerationQueue.getJob(jobId)` which works with Bull's ID

**Conclusion**: The custom `jobId` generation (line 79) is **unnecessary** because:
1. It's used as the job name (incorrectly)
2. Bull's auto-generated ID is returned instead
3. The custom ID ends up only in the payload, unused for tracking

---

### 3. The Processor Handler Registration

#### 3.1 PersonaGenerationProcessor Definition

**File**: `/workspace/grove-backend/src/dev/persona-generation.processor.ts:1-32`

```typescript
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DevService } from './dev.service';
import { PersonaGenerationJobPayload } from './persona-generation.job-types';

@Processor('persona-generation')  // Line 7: Binds to 'persona-generation' queue
export class PersonaGenerationProcessor {
  private readonly logger = new Logger(PersonaGenerationProcessor.name);

  constructor(private readonly devService: DevService) {}

  @Process()  // Line 13: Handles ONLY "__default__" job type (no name argument)
  async handle(job: Job<PersonaGenerationJobPayload>) {
    this.logger.log(
      `Starting persona generation job ${job.id} (template=${job.data.template}, count=${job.data.count})`,
    );

    try {
      await job.progress(5);
      const result = await this.devService.handlePersonaGenerationJob(job.data, job);
      this.logger.log(`Persona generation job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
      this.logger.error(`Persona generation job ${job.id} failed: ${message}`);
      throw error;
    }
  }
}
```

**Analysis**:
- Line 7: `@Processor('persona-generation')` - Correct, binds to the queue
- Line 13: `@Process()` - **PROBLEM**: No argument means it only handles jobs with name `"__default__"`
- This processor will NEVER handle jobs named `"preset-1762530193031-at2tpx"`

#### 3.2 What the Processor Logs Would Show (If It Ran)

The log at line 15-16 would show:
```typescript
this.logger.log(
  `Starting persona generation job ${job.id} (template=${job.data.template}, count=${job.data.count})`,
);
```

- `job.id` = Bull's sequential ID (e.g., `2`)
- `job.data.template` = the template from payload
- **Not logged**: `job.name` (which would be `"preset-1762530193031-at2tpx"`)

**But this never executes** because Bull can't find a handler for the job name.

#### 3.3 Where the Processor is Registered

**File**: `/workspace/grove-backend/src/jobs/jobs.module.ts:34`

```typescript
providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor],
```

**Note**: After the previous fix (documented in `/workspace/grove-backend/thoughts/research/2025-11-07-bull-queue-processor-registration-duplicate-handler-error.md`), the processor is now registered in **ONLY ONE** module (`JobsModule`), which is correct.

The previous error was "Cannot define the same handler twice __default__" (duplicate registration).

The current error is "Missing process handler for job type preset-1762530193031-at2tpx" (missing handler for named job).

**These are DIFFERENT errors** caused by different issues.

---

### 4. Comparison with Working EmbeddingGenerationProcessor

#### 4.1 How Embedding Jobs are Enqueued (CORRECT)

**File**: `/workspace/grove-backend/src/dev/dev.service.ts:1044-1054`

```typescript
// Queue embedding generation
await this.embeddingQueue.add(
  {  // ← ONE argument (payload only)
    userId: user.id,
    profileId: profile.id,
  },
  {  // ← Second argument is OPTIONS, not payload
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
);
```

**Analysis**:
- **ONE argument** before options: the payload object
- No job name argument
- Bull assigns job name = `"__default__"`

**Other Examples of Correct Enqueueing**:

**ProfilesService** (`/workspace/grove-backend/src/profiles/profiles.service.ts:72-77`):
```typescript
await this.embeddingQueue.add(
  {
    userId,
    profileId: profile.id,
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
);
```

**Script** (`/workspace/grove-backend/queue-embeddings.ts:49-57`):
```typescript
await embeddingQueue.add(
  {
    userId: profile.userId,
    profileId: profile.id,
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
);
```

**All follow the same pattern**: `queue.add(payload, options)` - no name argument.

#### 4.2 How Embedding Jobs are Processed (CORRECT)

**File**: `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts:13-24`

```typescript
@Processor('embedding-generation')
export class EmbeddingGenerationProcessor {
  // ...

  @Process()  // ← No argument = handles "__default__" job type
  async handleEmbeddingGeneration(job: Job<EmbeddingJobPayload>) {
    const { userId, profileId } = job.data;
    // ...
  }
}
```

**Analysis**:
- `@Process()` with no argument
- Matches the enqueueing pattern (no job name)
- Jobs are routed correctly

#### 4.3 The Pattern Match

**Embedding Queue** (CORRECT):
- Enqueueing: `queue.add(payload, options)` → job name = `"__default__"`
- Processing: `@Process()` → handles `"__default__"`
- **MATCH**: ✅ Jobs are processed

**Persona Queue** (INCORRECT):
- Enqueueing: `queue.add(jobId, payload, options)` → job name = `"preset-1762530193031-at2tpx"`
- Processing: `@Process()` → handles `"__default__"`
- **NO MATCH**: ❌ Bull throws "Missing process handler"

---

### 5. Why the Error Occurs

#### 5.1 Bull's Handler Lookup Logic

When a job is ready to process, Bull:

1. **Gets the job from Redis**
   - Job contains: `{ id: 2, name: "preset-1762530193031-at2tpx", data: {...} }`

2. **Finds the processor for the queue**
   - Queue name: `"persona-generation"`
   - Processor: `PersonaGenerationProcessor`

3. **Looks up the handler by job name**
   - Job name: `"preset-1762530193031-at2tpx"`
   - Available handlers in processor:
     - `"__default__"` → `handle()` method
   - No handler for `"preset-1762530193031-at2tpx"`

4. **Throws error**
   - `Error: Missing process handler for job type preset-1762530193031-at2tpx`

#### 5.2 What the Logs Show

**User's Observation**:
> "Logs show job is queued successfully (job ID 2)"

**Explanation**:
- Line 109-114 of `DevService.generatePreset()` returns success
- Job is successfully added to Redis queue
- Bull worker picks up the job
- Bull tries to find handler
- **Fails before calling processor** - so no processor logs appear
- Error is logged by Bull, not the application

**Log Analysis**:
> "Frontend polls the job status endpoint every 2 seconds"
> "Job appears to complete (status changes from 304 to 200 in logs)"

**Explanation**:
- HTTP 304 = Not Modified (cached response)
- HTTP 200 = OK (new response)
- This is just HTTP caching behavior, not job status
- The job is likely stuck in "failed" or "waiting" state

**Missing Logs**:
> "No errors visible in the HTTP logs"

**Explanation**:
- The error occurs in the Bull worker, not the HTTP handler
- HTTP handler successfully enqueues the job (200 response)
- Worker error might be logged separately or swallowed

#### 5.3 Job Status After Error

When Bull can't find a handler:
- Job state: likely `"failed"`
- Job fail reason: `"Missing process handler for job type preset-1762530193031-at2tpx"`

**Checking via `getJobStatus()`** (`/workspace/grove-backend/src/dev/dev.service.ts:175-224`):

```typescript
async getJobStatus(jobId: string) {
  const job = await this.personaGenerationQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found', progress: 0 };
  }

  const state = await job.getState();

  if (state === 'failed') {
    return {
      status: 'failed',
      progress,
      error: job.failedReason,  // ← Would show the error here
    };
  }
  // ...
}
```

The frontend should be receiving a response with:
```json
{
  "status": "failed",
  "progress": 0,
  "error": "Missing process handler for job type preset-1762530193031-at2tpx"
}
```

---

### 6. The Fix

#### 6.1 Solution 1: Remove Job Name Argument (Recommended)

**Change**: `/workspace/grove-backend/src/dev/dev.service.ts:79-104`

**Before (INCORRECT)**:
```typescript
const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const job = await this.personaGenerationQueue.add(
  jobId,  // ← REMOVE THIS (first argument)
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
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
    },
    removeOnFail: {
      age: 60 * 60 * 24,
    },
  },
);
```

**After (CORRECT)**:
```typescript
const job = await this.personaGenerationQueue.add(
  {  // ← First argument is now the payload
    orgId,
    template: dto.template,
    count: config.count,
    intensityLevel: config.intensityLevel,
    categories: config.categories,
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
    },
    removeOnFail: {
      age: 60 * 60 * 24,
    },
  },
);
```

**Changes**:
1. Remove line 79 (jobId generation) - it's unused
2. Remove line 82 (jobId as first argument)
3. Remove `jobId` from payload (line 84) - it's unused

**Why This Works**:
- `queue.add(payload, options)` creates unnamed job
- Job name = `"__default__"`
- `@Process()` handles `"__default__"`
- **MATCH**: ✅ Jobs are processed

**What About Tracking?**:
- Bull's `job.id` is already unique and returned to frontend
- No need for custom `jobId` generation
- If custom tracking is needed, add it to payload for logging purposes only

#### 6.2 Solution 2: Add Named Handler (Alternative, NOT Recommended)

**If you want to keep named jobs**, you could add a handler:

```typescript
@Processor('persona-generation')
export class PersonaGenerationProcessor {
  @Process()  // Keep default handler for unnamed jobs
  async handle(job: Job<PersonaGenerationJobPayload>) { ... }

  @Process('preset-*')  // ← Won't work! Bull doesn't support wildcards
  async handlePreset(job: Job<PersonaGenerationJobPayload>) { ... }
}
```

**Problems with this approach**:
1. Bull doesn't support wildcard job names
2. You'd need a separate `@Process()` for every possible jobId value (infinite!)
3. Violates the principle of using job names for job TYPES, not job INSTANCES

**Verdict**: ❌ Don't use this approach

#### 6.3 Solution 3: Use Job Options for Custom ID (Alternative)

**If custom job IDs are required** (for external tracking systems):

```typescript
const customId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const job = await this.personaGenerationQueue.add(
  {  // ← Payload (no custom ID)
    orgId,
    template: dto.template,
    count: config.count,
    intensityLevel: config.intensityLevel,
    categories: config.categories,
  },
  {
    jobId: customId,  // ← Set Bull's job ID to custom value
    attempts: 3,
    backoff: { ... },
    // ...
  },
);

// Now job.id === customId
return {
  success: true,
  jobId: job.id.toString(),  // ← Returns customId
  status: 'queued',
  message: `Persona generation queued (${config.count} personas)`,
};
```

**Benefits**:
- Custom job ID for tracking
- Still uses unnamed jobs (default handler works)
- Frontend receives custom ID

**Drawbacks**:
- Must ensure custom IDs are unique (Bull enforces this)
- If two requests generate same ID, second will fail
- Current implementation uses timestamp + random, should be safe

**Verdict**: ✓ Valid if custom IDs are required, but check if they're actually needed

---

### 7. Related Concepts

#### 7.1 Job Options vs. Job Data

**Job Data** (payload):
- The `data` property of a job
- Contains business logic parameters
- Accessed via `job.data`
- Example: `{ userId: '123', profileId: '456' }`

**Job Options**:
- Configuration for Bull's behavior
- Controls retries, timeouts, priorities, etc.
- Not accessible in processor (except via `job` properties)
- Example: `{ attempts: 3, backoff: {...}, priority: 1 }`

**Common Options**:
- `attempts`: Number of retry attempts
- `backoff`: Retry delay strategy
- `delay`: Initial delay before processing
- `priority`: Job priority (lower = higher priority)
- `removeOnComplete`: Auto-remove after success
- `removeOnFail`: Auto-remove after failure
- `jobId`: Custom job ID (must be unique)
- `timeout`: Max processing time

#### 7.2 When to Use Named Jobs

**Use named jobs when**:
- You have different JOB TYPES on the same queue
- Each type needs different processing logic
- Example: `'send-welcome-email'`, `'send-reset-email'`, `'send-notification-email'`

**Don't use named jobs when**:
- You want to track individual job instances
- You want unique identifiers per job
- **Use `jobId` option instead**

**Example of proper named jobs**:

```typescript
// Enqueueing
await emailQueue.add('welcome', { userId: '123' });
await emailQueue.add('reset', { userId: '123', token: 'abc' });
await emailQueue.add('notification', { userId: '123', message: 'Hello' });

// Processing
@Processor('email-queue')
export class EmailProcessor {
  @Process('welcome')
  async sendWelcome(job: Job) { ... }

  @Process('reset')
  async sendReset(job: Job) { ... }

  @Process('notification')
  async sendNotification(job: Job) { ... }
}
```

#### 7.3 Bull Job Lifecycle

```
[Enqueue] → [Waiting] → [Active] → [Completed/Failed]
                ↓            ↓
           [Delayed]    [Progress Updates]
```

**States**:
1. **Waiting**: Job in queue, waiting to be processed
2. **Delayed**: Job scheduled for future processing
3. **Active**: Job currently being processed by worker
4. **Completed**: Job finished successfully
5. **Failed**: Job failed after all retry attempts
6. **Paused**: Queue is paused, jobs not processing
7. **Stuck**: Job processing for too long, likely dead worker

**Transitions**:
- `waiting` → `active`: Worker picks up job
- `active` → `completed`: Handler returns successfully
- `active` → `failed`: Handler throws error, no retries left
- `active` → `waiting`: Handler throws error, retry scheduled
- `failed` → `waiting`: Manual retry via `job.retry()`

---

## Code References

### Job Enqueueing (THE PROBLEM)
- `/workspace/grove-backend/src/dev/dev.service.ts:79` - Custom jobId generation (unnecessary)
- `/workspace/grove-backend/src/dev/dev.service.ts:81-82` - **PROBLEM**: `queue.add(jobId, payload)` uses jobId as JOB NAME
- `/workspace/grove-backend/src/dev/dev.service.ts:111` - Returns Bull's auto-generated ID, not custom jobId

### Processor Definition (EXPECTS DEFAULT JOB TYPE)
- `/workspace/grove-backend/src/dev/persona-generation.processor.ts:7` - `@Processor('persona-generation')`
- `/workspace/grove-backend/src/dev/persona-generation.processor.ts:13` - `@Process()` handles ONLY `"__default__"`

### Processor Registration
- `/workspace/grove-backend/src/jobs/jobs.module.ts:34` - Processor registered in JobsModule
- `/workspace/grove-backend/src/jobs/jobs.module.ts:25-27` - Queue registered

### Correct Pattern (Embedding Queue)
- `/workspace/grove-backend/src/dev/dev.service.ts:1045-1054` - Correct: `queue.add(payload, options)`
- `/workspace/grove-backend/src/profiles/profiles.service.ts:72-77` - Correct: `queue.add(payload, options)`
- `/workspace/grove-backend/queue-embeddings.ts:49-57` - Correct: `queue.add(payload, options)`
- `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts:23-24` - Correct: `@Process()` matches

### Job Status Checking
- `/workspace/grove-backend/src/dev/dev.service.ts:175-224` - `getJobStatus()` method
- `/workspace/grove-backend/src/dev/dev.service.ts:176` - Uses `queue.getJob(jobId)` with Bull's ID

---

## Architecture Documentation

### Bull Queue Patterns in This Codebase

**Pattern 1: Unnamed Jobs (Default)**
- **Used by**: Embedding generation, (should be) Persona generation
- **Enqueueing**: `queue.add(payload, options)`
- **Processing**: `@Process()` with no argument
- **Job name**: `"__default__"`
- **Use case**: Single job type per queue

**Pattern 2: Named Jobs (Not Currently Used)**
- **Could be used for**: Multiple job types on one queue
- **Enqueueing**: `queue.add(jobTypeName, payload, options)`
- **Processing**: `@Process(jobTypeName)`
- **Job name**: Custom string
- **Use case**: Multiple job types per queue

**Pattern 3: Custom Job IDs (Optional)**
- **Used for**: External tracking, idempotency
- **Enqueueing**: `queue.add(payload, { jobId: customId, ... })`
- **Processing**: No change
- **Job ID**: Custom value (must be unique)
- **Use case**: Preventing duplicate jobs, external system integration

### Queue Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        DevService                             │
│                                                               │
│  generatePreset() ─────┐                                     │
│  handlePersonaGenerationJob() ←─────────────────┐           │
└───────────────────────────┼─────────────────────┼───────────┘
                             │ enqueues             │ calls
                             │ (producer)           │ (logic)
                             ↓                      │
                 ┌─────────────────────┐           │
                 │  persona-generation │           │
                 │        Queue        │           │
                 │     (Bull/Redis)    │           │
                 └─────────────────────┘           │
                             │                      │
                             │ processes            │
                             │ (consumer)           │
                             ↓                      │
          ┌──────────────────────────────────┐    │
          │ PersonaGenerationProcessor       │    │
          │                                  │    │
          │   @Process() ──────────────────────┘
          │   async handle(job) {               │
          │     devService.handlePersonaGenerationJob()
          │   }                                 │
          └──────────────────────────────────┘
```

**Key Points**:
1. `DevService` is both producer (enqueues) and worker (processes)
2. Processor delegates to `DevService` for business logic
3. This creates a circular dependency (solved with `forwardRef()`)
4. The processor is just a thin wrapper for routing

---

## Historical Context (from thoughts/)

### Previous Related Error

**Document**: `/workspace/grove-backend/thoughts/research/2025-11-07-bull-queue-processor-registration-duplicate-handler-error.md`

**Previous Error**: `"Cannot define the same handler twice __default__"`

**Previous Cause**: `PersonaGenerationProcessor` was registered in TWO modules (`JobsModule` and `DevModule`)

**Previous Fix**: Remove processor from `DevModule.providers`

**Current Error**: `"Missing process handler for job type preset-1762530193031-at2tpx"`

**Current Cause**: Job is enqueued with a DYNAMIC NAME, but processor only handles DEFAULT name

**Why They're Different**:
- Previous: **Too many handlers** for `"__default__"` (duplicate registration)
- Current: **No handler** for `"preset-1762530193031-at2tpx"` (wrong job name)

**Connection**:
Both errors involve the `@Process()` decorator and job routing, but they're opposite problems:
- Previous: Multiple handlers for the same job name
- Current: No handler for a specific job name

---

## Solution Summary

### Recommended Fix

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Line 79-104**: Replace this code:
```typescript
const jobId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const job = await this.personaGenerationQueue.add(
  jobId,  // ← REMOVE THIS LINE
  {
    jobId,  // ← REMOVE THIS LINE
    orgId,
    template: dto.template,
    count: config.count,
    intensityLevel: config.intensityLevel,
    categories: config.categories,
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
    },
    removeOnFail: {
      age: 60 * 60 * 24,
    },
  },
);
```

**With**:
```typescript
const job = await this.personaGenerationQueue.add(
  {
    orgId,
    template: dto.template,
    count: config.count,
    intensityLevel: config.intensityLevel,
    categories: config.categories,
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
    },
    removeOnFail: {
      age: 60 * 60 * 24,
    },
  },
);
```

### Why This Works

1. `queue.add(payload, options)` creates an unnamed job
2. Job name becomes `"__default__"`
3. `PersonaGenerationProcessor.@Process()` handles `"__default__"`
4. Bull routes job correctly
5. Processor executes successfully

### What Changes

**Before**:
- Job name: `"preset-1762530193031-at2tpx"` (dynamic)
- Bull can't find handler
- Error: "Missing process handler"

**After**:
- Job name: `"__default__"` (standard)
- Bull finds handler: `PersonaGenerationProcessor.handle()`
- Processing succeeds

### What Doesn't Change

- Processor code: no changes needed
- Processor registration: already correct
- Job options: same retry/cleanup config
- Job tracking: Bull's auto-generated ID works fine
- Frontend: no changes needed (still polls with job ID)

---

## Related Research

- `/workspace/grove-backend/thoughts/research/2025-11-07-bull-queue-processor-registration-duplicate-handler-error.md` - Previous processor registration issue (different root cause)

---

## Open Questions

None. The root cause is identified, the fix is clear and simple, and the pattern is validated against the working embedding queue.
