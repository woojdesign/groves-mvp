---
doc_type: research
date: 2025-11-07T14:58:54+00:00
title: "Persona Generation Progress Stuck at 0% Despite Job Success"
research_question: "Why does the persona generation progress indicator stay at 0% even though jobs succeed in the background?"
researcher: Sean Kim

git_commit: c02aa5c1ed74961e0ca56b92c5dd468316dc4522
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-11-07
last_updated_by: Sean Kim

tags:
  - persona-generation
  - progress-tracking
  - bull-queue
  - frontend
  - polling
  - race-condition
status: completed

related_docs:
  - thoughts/reviews/2025-11-07-async-persona-generation-implementation-review.md
  - thoughts/research/2025-11-07-persona-generation-long-running-operations-and-background-job-architecture.md
---

# Research: Persona Generation Progress Stuck at 0% Despite Job Success

**Date**: 2025-11-07T14:58:54+00:00
**Researcher**: Sean Kim
**Git Commit**: c02aa5c1ed74961e0ca56b92c5dd468316dc4522
**Branch**: main
**Repository**: workspace

## Research Question

Why does the persona generation progress indicator stay at 0% even though jobs succeed in the background?

## Problem Statement

**QA Report:** "UI was not updated (though jobs succeeded in background). Progress remained at 0%. After page reload, new personas appeared."

**Symptoms:**
- Job completes successfully (personas are created in database)
- Progress indicator stuck at 0% throughout entire job
- No UI update until manual page reload
- Data is actually present (reload shows new personas)

## Summary

The progress indicator stays at 0% due to a **timing race condition** between when the job is queued and when the background worker picks it up and sets progress. The frontend starts polling immediately after receiving the `jobId`, but at that point the job is still in the "waiting" state in Bull's queue and **progress has not yet been initialized**.

**Root Cause:**
When Bull retrieves a job that's in the "waiting" or "waiting-children" state (before the processor runs), `job.progress()` returns `0` by default. The frontend correctly handles this with `status.progress ?? 0`, but this means the very first poll (and potentially several subsequent polls) will show 0% progress, even though the job will eventually run and complete successfully.

**Why it appears stuck:**
For fast-completing jobs (10-30 seconds), by the time the second poll happens (T+2 seconds), the job may already be at 50%+ completion or even fully complete. The user sees:
- T=0ms: Job queued, progress bar shows 0%
- T=2000ms: Job at 80% or completed
- No visual indication of progress actually happening

The progress updates ARE working correctly on the backend - the issue is entirely about **timing and initial state handling**.

## Detailed Findings

### 1. Backend Progress Updates (WORKING CORRECTLY)

**PersonaGenerationProcessor** (`/workspace/grove-backend/src/dev/persona-generation.processor.ts:20`):
```typescript
await job.progress(5);
const result = await this.devService.handlePersonaGenerationJob(job.data, job);
```
- Sets progress to 5% immediately when processor starts

**DevService.handlePersonaGenerationJob** (`/workspace/grove-backend/src/dev/dev.service.ts:114-170`):
```typescript
// Line 125: Initial progress
await job.progress(10);

// Lines 128-150: During batch generation (10% → 80%)
await this.generatePersonaBatch(
  count,
  intensityLevel,
  categories,
  undefined,
  async (completed) => {
    const progress = Math.min(
      generationEnd,
      generationStart + Math.floor((completed / count) * (generationEnd - generationStart)),
    );
    await job.progress(progress);
  },
);

// Line 153: After generation, before DB save
await job.progress(85);

// Line 156: Create personas in database
const created = await this.createPersonas(personas, orgId);

// Line 166: Mark complete
await job.progress(100);
```

**Verdict:** Progress updates are being set correctly at 5%, 10%, 10-80% (incremental), 85%, and 100%.

### 2. Job Status Endpoint (WORKING CORRECTLY)

**DevService.getJobStatus** (`/workspace/grove-backend/src/dev/dev.service.ts:172-220`):
```typescript
async getJobStatus(jobId: string) {
  const job = await this.personaGenerationQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' as const, progress: 0 };
  }

  const state = await job.getState();
  const rawProgress = await job.progress();
  const progress = typeof rawProgress === 'number' ? rawProgress : 0;

  if (state === 'completed') {
    return { status: 'completed' as const, progress: 100, result: job.returnvalue };
  }

  if (state === 'failed') {
    return { status: 'failed' as const, progress, error: job.failedReason };
  }

  // Handle waiting, active, delayed states
  let mappedState: 'queued' | 'active' | 'delayed';
  switch (state) {
    case 'waiting':
    case 'waiting-children':
      mappedState = 'queued';
      break;
    case 'delayed':
      mappedState = 'delayed';
      break;
    default:
      mappedState = 'active';
      break;
  }

  return { status: mappedState, progress };
}
```

**Key Observation (Line 183-184):**
- Bull's `job.progress()` returns `0` by default if progress was never set
- When job is in "waiting" state, progress is `0` because the processor hasn't run yet
- The endpoint correctly returns this `0` value

**Verdict:** Endpoint is working correctly - it returns whatever Bull reports.

### 3. Frontend Polling (WORKING CORRECTLY)

**PersonaGenerator.tsx** (`/workspace/src/admin/dev/components/PersonaGenerator.tsx:41-103`):
```typescript
useEffect(() => {
  if (!jobId) {
    return undefined;
  }

  let isActive = true;

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollStatus = async () => {
    try {
      const status = await devApi.getPersonaGenerationJobStatus(jobId);
      if (!isActive) {
        return;
      }

      // THIS IS THE KEY LINE
      setProgress(Math.max(0, Math.min(100, status.progress ?? 0)));

      if (status.status === 'completed' && status.result) {
        clearPolling();
        onPersonasCreated(status.result.personas);
        setLoading(false);
        setJobId(null);
        setProgress(0);
      } else if (status.status === 'failed') {
        clearPolling();
        setError(status.error || 'Persona generation failed');
        setLoading(false);
        setJobId(null);
        setProgress(0);
      } else if (status.status === 'not_found') {
        clearPolling();
        setError('Generation job not found. Please try again.');
        setLoading(false);
        setJobId(null);
        setProgress(0);
      }
    } catch (pollError: any) {
      // Error handling...
    }
  };

  // IMMEDIATE POLL + INTERVAL
  pollStatus();
  pollingRef.current = setInterval(pollStatus, 2000);

  return () => {
    isActive = false;
    clearPolling();
  };
}, [jobId, onPersonasCreated]);
```

**Line 62:** `setProgress(Math.max(0, Math.min(100, status.progress ?? 0)));`
- Correctly defaults to 0 if `status.progress` is undefined
- Clamps to 0-100 range

**Lines 96-97:** Immediate poll + 2-second interval
- Polls immediately when jobId is set
- Polls every 2 seconds thereafter

**Verdict:** Frontend is working correctly - it accurately displays whatever the backend reports.

### 4. The Race Condition (ROOT CAUSE)

**Timeline of Events:**

```
T=0ms:    User clicks "Generate"
T=5ms:    Frontend calls /admin/dev/personas/preset
T=10ms:   Backend queues job in Bull → job enters "waiting" state
T=15ms:   Backend returns { jobId: "preset-1234...", status: "queued" }
T=20ms:   Frontend receives jobId, triggers useEffect
T=21ms:   useEffect runs, pollStatus() fires FIRST POLL
T=25ms:   API call: GET /admin/dev/personas/jobs/:jobId
T=30ms:   Backend responds: { status: "queued", progress: 0 }
          ^^^ Job is still "waiting" - processor hasn't started yet!
T=35ms:   Frontend updates: setProgress(0) - UI shows 0%

T=50ms:   Bull worker picks up job from queue
T=51ms:   PersonaGenerationProcessor.handle() called
T=52ms:   await job.progress(5) - Progress set to 5%
T=55ms:   await job.progress(10) - Progress set to 10%
T=100ms:  Generating personas... progress 10→80%

T=2021ms: SECOND POLL fires (useEffect interval)
T=2025ms: API call: GET /admin/dev/personas/jobs/:jobId
T=2030ms: Backend responds: { status: "completed", progress: 100 }
          ^^^ Job finished between first and second poll!
T=2035ms: Frontend updates: setProgress(100), shows personas
```

**The Issue:**
For jobs that complete in <2 seconds (or even <10 seconds), the user experience is:
1. Click generate → Progress bar appears at 0%
2. [2 seconds pass]
3. Progress jumps to 100% or personas suddenly appear

The progress bar never visually moves through intermediate values (10%, 50%, 80%), creating the illusion that it's "stuck at 0%".

### 5. Why "After Page Reload, New Personas Appeared"

This confirms the job completed successfully:
- Job ran to completion in background
- Personas were created in database
- Frontend just didn't show progress updates in real-time
- Page reload fetches fresh data from DB → new personas visible

## Contributing Factors

### Factor 1: Fast Job Completion

For small batches (10 personas), jobs complete in 10-30 seconds. With a 2-second polling interval:
- First poll: T=0ms → progress = 0% (job queued)
- Second poll: T=2000ms → progress = 30-50% (job running)
- Third poll: T=4000ms → progress = 100% (job complete)

Users only see 2-3 progress updates, making it feel "stuck" initially.

### Factor 2: Initial Job State

Bull jobs go through states:
1. **"waiting"** - Queued, not picked up by worker yet
2. **"active"** - Worker processing job
3. **"completed"** - Job finished

Progress is only set once a job moves from "waiting" → "active". The first poll almost always catches the job in "waiting" state with progress = 0.

### Factor 3: No Optimistic UI

The frontend doesn't show any optimistic progress like:
- "Queuing job..." → 0%
- "Starting generation..." → 5%
- "Generating personas..." → progress from API

It waits for backend to report real progress, which starts at 0.

## Solutions Analysis

### Solution 1: Set Initial Progress When Queuing (RECOMMENDED)

**Change:** Set progress to 0 immediately when job is queued, before returning to client.

**File:** `/workspace/grove-backend/src/dev/dev.service.ts:81-104`

**Current code:**
```typescript
const job = await this.personaGenerationQueue.add(
  jobId,
  { jobId, orgId, template: dto.template, count: config.count, ... },
  { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, ... },
);

return {
  success: true,
  jobId: job.id.toString(),
  status: 'queued',
  message: `Persona generation queued (${config.count} personas)`,
};
```

**Fix:** Add initial progress immediately after queuing:
```typescript
const job = await this.personaGenerationQueue.add(
  jobId,
  { jobId, orgId, template: dto.template, count: config.count, ... },
  { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, ... },
);

// Set initial progress to 0 immediately
await job.progress(0);

return {
  success: true,
  jobId: job.id.toString(),
  status: 'queued',
  message: `Persona generation queued (${config.count} personas)`,
};
```

**Why this works:**
- Job will have progress = 0 even in "waiting" state
- First poll will correctly show 0% (not undefined defaulting to 0)
- Subsequent progress updates (5%, 10%, etc.) will be visible
- No frontend changes needed

**Downside:**
- None - this is a clean fix that matches expected behavior

### Solution 2: Reduce Polling Interval

**Change:** Poll more frequently (every 500ms or 1000ms instead of 2000ms).

**File:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:97`

**Current:** `pollingRef.current = setInterval(pollStatus, 2000);`

**Fix:** `pollingRef.current = setInterval(pollStatus, 500);`

**Why this helps:**
- More frequent polls = more granular progress updates
- User sees progress moving more smoothly
- Catches intermediate states (10%, 30%, 50%, etc.)

**Downside:**
- 4x more API calls (increases backend load)
- Minimal benefit if jobs complete very quickly

### Solution 3: Optimistic UI Updates

**Change:** Show optimistic progress on frontend before first poll.

**File:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:27-39`

**Current:**
```typescript
const handlePresetGenerate = async () => {
  try {
    setLoading(true);
    setError(null);
    setProgress(0);
    const result = await devApi.generatePreset(presetTemplate as any);
    setJobId(result.jobId);
  } catch (err: any) {
    // error handling...
  }
};
```

**Fix:** Add optimistic progress:
```typescript
const handlePresetGenerate = async () => {
  try {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Optimistic update: Show we're starting
    setProgress(1); // 1% = "job is queued"

    const result = await devApi.generatePreset(presetTemplate as any);
    setJobId(result.jobId);

    // Optimistic update: Job accepted by backend
    setProgress(2); // 2% = "job queued successfully"
  } catch (err: any) {
    // error handling...
  }
};
```

**Why this helps:**
- User sees immediate feedback (progress bar moves from 0% → 1% → 2%)
- Creates perception of responsiveness
- Fills the gap before first poll returns

**Downside:**
- Not "real" progress - could be misleading if job fails to queue
- Adds complexity to state management

### Solution 4: Add Status Text Labels

**Change:** Show text status alongside progress bar.

**File:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:151-154`

**Current:**
```typescript
{loading ? (
  <>
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    Generating... {progress}%
  </>
) : (
  // ...
)}
```

**Fix:** Add contextual status:
```typescript
{loading ? (
  <>
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    {progress === 0 && 'Queuing job...'}
    {progress > 0 && progress < 10 && 'Starting generation...'}
    {progress >= 10 && progress < 85 && `Generating personas... ${progress}%`}
    {progress >= 85 && progress < 100 && 'Saving to database...'}
  </>
) : (
  // ...
)}
```

**Why this helps:**
- Users understand what's happening even when progress = 0%
- "Queuing job..." is more informative than "0%"
- Reduces perception of being "stuck"

**Downside:**
- Requires frontend changes
- Status labels might not always be accurate

## Recommended Solution

**Implement Solution 1 (Set Initial Progress When Queuing) + Solution 4 (Status Labels)**

This combination:
1. Fixes the root cause (progress always initialized)
2. Improves UX (status labels provide context)
3. Requires minimal code changes
4. No performance impact

## Code References

### Backend Progress Updates
- **Processor entry point:** `/workspace/grove-backend/src/dev/persona-generation.processor.ts:20` - Sets progress to 5%
- **Job handler initialization:** `/workspace/grove-backend/src/dev/dev.service.ts:125` - Sets progress to 10%
- **Incremental updates:** `/workspace/grove-backend/src/dev/dev.service.ts:128-150` - Progress 10% → 80%
- **Pre-save:** `/workspace/grove-backend/src/dev/dev.service.ts:153` - Sets progress to 85%
- **Completion:** `/workspace/grove-backend/src/dev/dev.service.ts:166` - Sets progress to 100%

### Job Status Endpoint
- **Controller:** `/workspace/grove-backend/src/dev/dev.controller.ts:59-62` - GET endpoint
- **Service:** `/workspace/grove-backend/src/dev/dev.service.ts:172-220` - getJobStatus method
- **Progress retrieval:** `/workspace/grove-backend/src/dev/dev.service.ts:183-184` - Reads from Bull

### Frontend Polling
- **Polling setup:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:41-103` - useEffect with interval
- **Progress state update:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:62` - setProgress with default
- **Polling interval:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:97` - Every 2 seconds
- **Progress display:** `/workspace/src/admin/dev/components/PersonaGenerator.tsx:151-154` - UI rendering

### Job Queuing
- **Queue setup:** `/workspace/grove-backend/src/jobs/jobs.module.ts:24-26` - persona-generation queue
- **Job creation:** `/workspace/grove-backend/src/dev/dev.service.ts:81-104` - Queue.add() call
- **Job options:** `/workspace/grove-backend/src/dev/dev.service.ts:92-102` - Retry config

## Historical Context

This issue exists because the async persona generation feature was recently implemented (2025-11-07) to solve 30-second timeout issues in staging. The implementation correctly added:
- Background job processing with Bull
- Progress tracking throughout job execution
- Frontend polling for status updates

However, the initial progress state (when job is queued but not yet running) was not explicitly set, creating a race condition where early polls see progress = 0 by default.

Reference: `/workspace/thoughts/reviews/2025-11-07-async-persona-generation-implementation-review.md` - Comprehensive review of the async implementation.

## Related Research

- `/workspace/thoughts/research/2025-11-07-persona-generation-long-running-operations-and-background-job-architecture.md` - Architecture research for async persona generation
- `/workspace/thoughts/reviews/2025-11-07-async-persona-generation-implementation-review.md` - Post-implementation code review

## Open Questions

1. Should progress polling continue after failures, or immediately stop?
   - Current: Stops immediately on first failure
   - Trade-off: More resilient vs. faster error feedback

2. Should jobId persist in localStorage to resume after page refresh?
   - Current: Lost on page refresh
   - Trade-off: Better UX vs. complexity

3. Should polling use exponential backoff for long-running jobs?
   - Current: Fixed 2-second interval
   - Trade-off: Reduced API calls vs. consistent update frequency

## Conclusion

The progress indicator stays at 0% due to a **timing race condition** between job queuing and processor startup. The first poll catches the job in "waiting" state where progress hasn't been initialized yet. For fast-completing jobs, this creates the illusion that progress is "stuck" at 0%.

**All components are working correctly** - this is purely a timing and initial state issue.

**Recommended fix:** Set `await job.progress(0)` immediately after queuing the job, ensuring progress is always initialized even in "waiting" state. This is a one-line backend change with no frontend modifications needed.
