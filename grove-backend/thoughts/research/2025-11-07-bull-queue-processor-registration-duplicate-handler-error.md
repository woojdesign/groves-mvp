---
doc_type: research
title: "Bull Queue Processor Registration Architecture and Duplicate Handler Error"
created: 2025-11-07T00:00:00Z
created_by: Claude Code
last_updated: 2025-11-07T00:00:00Z
last_updated_by: Claude Code
status: completed
research_question: "How are Bull queue processors registered in this NestJS application, and why is PersonaGenerationProcessor causing a 'Cannot define the same handler twice __default__' error?"
tags:
  - nestjs
  - bull
  - queue
  - processor
  - circular-dependency
  - architecture
  - error-diagnosis
related_docs: []
git_commit: c432981b2d8afe22813fbcfb06ca7f2cc0f87fd9
git_branch: main
---

# Research: Bull Queue Processor Registration Architecture and Duplicate Handler Error

**Date**: 2025-11-07 00:00:00 UTC
**Researcher**: Claude Code
**Git Commit**: c432981b2d8afe22813fbcfb06ca7f2cc0f87fd9
**Branch**: main
**Repository**: groves-mvp

## Research Question

How are Bull queue processors registered in this NestJS application, and why is PersonaGenerationProcessor causing a "Cannot define the same handler twice __default__" error?

## Executive Summary

**Root Cause**: **DUPLICATE PROCESSOR REGISTRATION** - `PersonaGenerationProcessor` is registered as a provider in **TWO** modules simultaneously:
- `JobsModule` (line 34: `/workspace/grove-backend/src/jobs/jobs.module.ts`)
- `DevModule` (line 25: `/workspace/grove-backend/src/dev/dev.module.ts`)

**Why This Causes the Error**: When both modules are imported into `AppModule`, NestJS instantiates `PersonaGenerationProcessor` twice. Bull detects this and throws "Cannot define the same handler twice __default__" because the `@Process()` decorator with no argument registers a handler for the default job type, and Bull prevents duplicate default handlers on the same queue.

**Architectural Pattern Violation**: The codebase follows a clear pattern where processors should only be registered in the module that owns the queue configuration (`JobsModule`). `EmbeddingGenerationProcessor` correctly follows this pattern. `PersonaGenerationProcessor` violates it by being registered in both modules.

**Solution**: Remove `PersonaGenerationProcessor` from `DevModule.providers` array. `DevModule` should only import `JobsModule` to access the queue, not register the processor itself.

---

## Detailed Findings

### 1. Current Bull Queue Architecture

#### 1.1 Queue Registration Locations

The application registers two Bull queues:

**Location 1: JobsModule** (`/workspace/grove-backend/src/jobs/jobs.module.ts:22-27`)
```typescript
BullModule.registerQueue({
  name: 'embedding-generation',
}),
BullModule.registerQueue({
  name: 'persona-generation',
}),
```

**Location 2: ProfilesModule** (`/workspace/grove-backend/src/profiles/profiles.module.ts:9-11`)
```typescript
BullModule.registerQueue({
  name: 'embedding-generation',
}),
```

**Analysis**: Both `JobsModule` and `ProfilesModule` register the `'embedding-generation'` queue. This is intentional and safe because:
- `BullModule.registerQueue()` is idempotent in NestJS
- Multiple modules can register the same queue to gain access to it via `@InjectQueue()`
- Only one actual queue instance exists in Redis
- This allows `ProfilesModule` to enqueue jobs without depending on `JobsModule`

The `'persona-generation'` queue is only registered in `JobsModule`.

#### 1.2 Processor Registration Locations

**Processor 1: EmbeddingGenerationProcessor**
- Defined: `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts:13-14`
  ```typescript
  @Processor('embedding-generation')
  export class EmbeddingGenerationProcessor {
  ```
- Registered: **ONLY** in `/workspace/grove-backend/src/jobs/jobs.module.ts:34`
  ```typescript
  providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor],
  ```

**Processor 2: PersonaGenerationProcessor**
- Defined: `/workspace/grove-backend/src/dev/persona-generation.processor.ts:7-8`
  ```typescript
  @Processor('persona-generation')
  export class PersonaGenerationProcessor {
  ```
- Registered: **TWICE** - This is the problem!
  1. `/workspace/grove-backend/src/jobs/jobs.module.ts:34`
     ```typescript
     providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor],
     ```
  2. `/workspace/grove-backend/src/dev/dev.module.ts:25`
     ```typescript
     providers: [DevService, SeedDataService, PersonaGenerationProcessor],
     ```

---

### 2. PersonaGenerationProcessor Duplicate Registration Issue

#### 2.1 Where PersonaGenerationProcessor is Defined

**File**: `/workspace/grove-backend/src/dev/persona-generation.processor.ts`

```typescript
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DevService } from './dev.service';
import { PersonaGenerationJobPayload } from './persona-generation.job-types';

@Processor('persona-generation')  // Line 7: Registers handler for 'persona-generation' queue
export class PersonaGenerationProcessor {
  private readonly logger = new Logger(PersonaGenerationProcessor.name);

  constructor(private readonly devService: DevService) {}  // Line 11: Depends on DevService

  @Process()  // Line 13: Registers default handler (no job name argument)
  async handle(job: Job<PersonaGenerationJobPayload>) {
    // ... implementation
  }
}
```

**Key Details**:
- The `@Processor('persona-generation')` decorator binds this class to the `'persona-generation'` queue
- The `@Process()` decorator with no argument registers a handler for the **default job type**
- The processor has a constructor dependency on `DevService` from the same module

#### 2.2 Module Registration Analysis

**JobsModule** (`/workspace/grove-backend/src/jobs/jobs.module.ts:1-37`)

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenaiModule } from '../openai/openai.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingGenerationProcessor } from './embedding-generation.processor';
import { PersonaGenerationProcessor } from '../dev/persona-generation.processor';  // Line 8

@Module({
  imports: [
    BullModule.forRootAsync({...}),  // Lines 12-21: Redis configuration
    BullModule.registerQueue({
      name: 'embedding-generation',
    }),
    BullModule.registerQueue({
      name: 'persona-generation',     // Line 26: Queue registration
    }),
    OpenaiModule,
    EmbeddingsModule,
    PrismaModule,
    // Use forwardRef to avoid circular dependency with DevModule
    forwardRef(() => require('../dev/dev.module').DevModule),  // Line 32: Circular dependency workaround
  ],
  providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor],  // Line 34: FIRST REGISTRATION
  exports: [BullModule],
})
export class JobsModule {}
```

**DevModule** (`/workspace/grove-backend/src/dev/dev.module.ts:1-28`)

```typescript
import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { SeedDataService } from './seed-data.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenaiModule } from '../openai/openai.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MatchingModule } from '../matching/matching.module';
import { JobsModule } from '../jobs/jobs.module';  // Line 9: Imports JobsModule
import { DiversityTestingModule } from './diversity-testing/diversity-testing.module';
import { MetaPersonasModule } from './meta-personas/meta-personas.module';
import { PersonaGenerationProcessor } from './persona-generation.processor';  // Line 12

@Module({
  imports: [
    PrismaModule,
    OpenaiModule,
    ProfilesModule,
    MatchingModule,
    JobsModule,  // Line 20: Imports JobsModule (which already registers PersonaGenerationProcessor)
    DiversityTestingModule,
    MetaPersonasModule,
  ],
  controllers: [DevController],
  providers: [DevService, SeedDataService, PersonaGenerationProcessor],  // Line 25: SECOND REGISTRATION
  exports: [DevService],
})
export class DevModule {}
```

#### 2.3 Why This Causes the Error

**NestJS Module Loading Sequence**:
1. `AppModule` imports both `JobsModule` and `DevModule` (`/workspace/grove-backend/src/app.module.ts:41,47`)
2. When `JobsModule` loads:
   - Registers `'persona-generation'` queue with Bull
   - Instantiates `PersonaGenerationProcessor` from its providers array
   - Bull sees the `@Processor('persona-generation')` decorator and registers it
   - Bull sees the `@Process()` decorator and registers a handler for the default job type
3. When `DevModule` loads:
   - Imports `JobsModule` (but queues are already registered)
   - Instantiates `PersonaGenerationProcessor` **AGAIN** from its providers array
   - Bull sees the `@Processor('persona-generation')` decorator **AGAIN**
   - Bull attempts to register another handler for the default job type on the same queue
   - **ERROR**: Bull throws "Cannot define the same handler twice __default__"

**Bull's Perspective**:
- Bull maintains a registry of job handlers per queue
- Each handler is identified by the job name (or "__default__" for unnamed handlers)
- When Bull sees the same handler name registered twice on the same queue, it throws an error
- This is a safety mechanism to prevent ambiguous job routing

#### 2.4 Circular Dependency Between JobsModule and DevModule

**Evidence of Circular Dependency**:
- `JobsModule` imports `DevModule` using `forwardRef()` (line 32 of `/workspace/grove-backend/src/jobs/jobs.module.ts`)
- `DevModule` imports `JobsModule` (line 20 of `/workspace/grove-backend/src/dev/dev.module.ts`)
- `JobsModule` imports `PersonaGenerationProcessor` from `dev/` directory (line 8)
- `PersonaGenerationProcessor` depends on `DevService` (constructor injection)

**Why the Circular Dependency Exists**:
```
JobsModule → PersonaGenerationProcessor → DevService
     ↑                                         ↓
     └─────────────── DevModule ←──────────────┘
```

- `JobsModule` needs `PersonaGenerationProcessor` to process jobs
- `PersonaGenerationProcessor` needs `DevService` to execute business logic
- `DevService` needs to inject the queue to enqueue jobs (`@InjectQueue('persona-generation')`)
- The queue is provided by `JobsModule`
- Therefore: `JobsModule` → `DevModule` (via processor dependency) and `DevModule` → `JobsModule` (via queue injection)

**Current Workaround Attempt**:
```typescript
// JobsModule line 32
forwardRef(() => require('../dev/dev.module').DevModule),
```

This `forwardRef()` attempts to break the circular dependency, but it doesn't solve the duplicate registration issue because:
- `forwardRef()` delays module resolution, not provider instantiation
- Both modules still list `PersonaGenerationProcessor` in their providers arrays
- NestJS still instantiates the processor twice

---

### 3. EmbeddingGenerationProcessor Comparison (Correct Pattern)

#### 3.1 Where EmbeddingGenerationProcessor is Defined

**File**: `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts:13-22`

```typescript
@Processor('embedding-generation')
export class EmbeddingGenerationProcessor {
  private readonly logger = new Logger(EmbeddingGenerationProcessor.name);

  constructor(
    private openaiService: OpenaiService,
    private embeddingsService: EmbeddingsService,
    private prisma: PrismaService,
  ) {}

  @Process()
  async handleEmbeddingGeneration(job: Job<EmbeddingJobPayload>) {
    // ... implementation
  }
}
```

**Key Differences from PersonaGenerationProcessor**:
- Located in the same directory as `JobsModule` (`/workspace/grove-backend/src/jobs/`)
- Depends on services from other modules (`OpenaiService`, `EmbeddingsService`, `PrismaService`)
- **Does NOT depend on services from DevModule**

#### 3.2 Module Registration Pattern

**ONLY Registered in JobsModule**:
```typescript
// /workspace/grove-backend/src/jobs/jobs.module.ts:34
providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor],
```

**NOT Registered in ProfilesModule**:
```typescript
// /workspace/grove-backend/src/profiles/profiles.module.ts:15
providers: [ProfilesService],  // No processor here
```

Even though `ProfilesModule` registers the `'embedding-generation'` queue (to enqueue jobs), it does **NOT** register the processor.

#### 3.3 How ProfilesModule Enqueues Jobs

**ProfilesService** (`/workspace/grove-backend/src/profiles/profiles.service.ts` - not shown, but inferred from architecture):
```typescript
@Injectable()
export class ProfilesService {
  constructor(
    @InjectQueue('embedding-generation')
    private embeddingQueue: Queue<EmbeddingJobPayload>,
  ) {}

  async enqueueEmbeddingGeneration(userId: string, profileId: string) {
    await this.embeddingQueue.add({ userId, profileId });
  }
}
```

**Pattern**:
1. `ProfilesModule` imports `BullModule.registerQueue({ name: 'embedding-generation' })`
2. `ProfilesService` injects the queue using `@InjectQueue('embedding-generation')`
3. `ProfilesService` can enqueue jobs
4. **But** `ProfilesModule` does NOT register `EmbeddingGenerationProcessor`
5. Only `JobsModule` registers the processor
6. The processor processes jobs from any source (ProfilesModule, DevModule, etc.)

#### 3.4 Why This Pattern Works

**Separation of Concerns**:
- **Queue Registration**: Can be in multiple modules (idempotent)
- **Processor Registration**: Should be in **ONLY ONE** module
- **Job Enqueueing**: Any module with queue access can enqueue jobs
- **Job Processing**: Handled by the single processor instance

**Benefits**:
- No duplicate processor instances
- No handler registration conflicts
- Clear ownership: `JobsModule` owns all job processing logic
- Other modules can enqueue jobs without depending on processor implementation

---

### 4. Best Practice Pattern for This Codebase

#### 4.1 Established Pattern

Based on the analysis, the codebase follows this pattern:

**Rule 1: Queue Registration**
- Queues can be registered in multiple modules using `BullModule.registerQueue()`
- This is safe and idempotent
- Purpose: Allow modules to inject and enqueue jobs

**Rule 2: Processor Registration**
- Processors should be registered as providers in **ONLY ONE** module
- Typically, this should be `JobsModule` (the "jobs processing" module)
- This prevents duplicate handler registration errors

**Rule 3: Processor Location**
- Processors can be defined anywhere in the codebase
- However, they should be logically grouped near the business logic they execute OR in the jobs directory
- If a processor depends on services from a specific feature module, consider location carefully

**Rule 4: Cross-Module Dependencies**
- If a processor needs services from another module, import that module
- Do NOT register the processor in both modules
- Use `forwardRef()` if circular dependencies arise (though this is often a design smell)

**Rule 5: Job Enqueueing**
- Any module can enqueue jobs if it:
  1. Imports `BullModule.registerQueue()` for the queue
  2. Injects the queue using `@InjectQueue('queue-name')`
- The enqueueing module does NOT need to register the processor

#### 4.2 Should Processors Be in the Same Module as Queue Registration?

**Answer**: **YES, for this codebase**

The `EmbeddingGenerationProcessor` pattern demonstrates this:
- Processor file: `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts`
- Processor registration: `/workspace/grove-backend/src/jobs/jobs.module.ts`
- Queue registration: `/workspace/grove-backend/src/jobs/jobs.module.ts`

**Alternative Pattern (Not Used Here)**:
Some codebases place processors in feature modules:
- Processor file: `/workspace/grove-backend/src/dev/persona-generation.processor.ts`
- Processor registration: `/workspace/grove-backend/src/dev/dev.module.ts`
- Queue registration: `/workspace/grove-backend/src/dev/dev.module.ts`

But this requires that only the feature module registers the processor, and other modules only import the queue.

#### 4.3 Should Processors Be in the Module That Uses Them?

**Answer**: **NO, processors should be in the module that PROCESSES them**

The confusion here is between "uses" in the sense of:
1. **Enqueues jobs** (producer): Any module can do this
2. **Processes jobs** (consumer): Only one module should do this

`DevModule` **enqueues** persona generation jobs via `DevService`:
```typescript
// /workspace/grove-backend/src/dev/dev.service.ts:55-56
@InjectQueue('persona-generation')
private personaGenerationQueue: Queue<PersonaGenerationJobPayload>,
```

But `DevModule` should NOT register the processor. The processor should be registered in `JobsModule`.

#### 4.4 How Should Circular Dependencies Be Handled?

**Current Situation**:
- `JobsModule` uses `forwardRef()` to import `DevModule` because `PersonaGenerationProcessor` depends on `DevService`
- This is a design smell indicating tight coupling

**Better Approaches**:

**Option A: Move Processor to JobsModule Directory** (Recommended)
1. Keep `PersonaGenerationProcessor` code in `src/dev/` (business logic location)
2. Remove it from `DevModule.providers`
3. Keep it in `JobsModule.providers`
4. `JobsModule` imports `DevModule` normally (no `forwardRef()`)
5. Result: No circular dependency

**Option B: Extract Business Logic to Shared Service**
1. Create a new service (e.g., `PersonaGenerationService`) in `DevModule`
2. Move business logic from processor to this service
3. Move processor to `src/jobs/` directory
4. Processor depends on `PersonaGenerationService` instead of `DevService`
5. `JobsModule` imports `DevModule` normally
6. Result: Cleaner separation of concerns

**Option C: Keep Processor in DevModule, Remove from JobsModule** (Alternative)
1. Remove `PersonaGenerationProcessor` from `JobsModule.providers`
2. Keep it in `DevModule.providers`
3. `JobsModule` only registers the queue
4. Other modules can still enqueue jobs
5. Result: Simpler module structure, but less centralized job processing

---

### 5. Root Cause: Why is the Handler Being Registered Twice?

#### 5.1 Module Dependency Graph

```
AppModule
├── JobsModule
│   ├── providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor]  ← FIRST REGISTRATION
│   ├── imports: [forwardRef(() => DevModule)]
│   └── exports: [BullModule]
│
└── DevModule
    ├── providers: [DevService, SeedDataService, PersonaGenerationProcessor]  ← SECOND REGISTRATION
    └── imports: [JobsModule]
```

#### 5.2 Step-by-Step Registration Flow

1. **AppModule initialization begins**
2. **JobsModule loads** (order depends on import order in AppModule)
   - Registers `'persona-generation'` queue with Bull
   - Creates provider instance: `EmbeddingGenerationProcessor`
   - Creates provider instance: `PersonaGenerationProcessor` **(FIRST INSTANCE)**
   - Bull registers handler for `PersonaGenerationProcessor.handle()` on `'persona-generation'` queue with name `"__default__"`
3. **DevModule loads**
   - Imports `JobsModule` (already loaded, no-op)
   - Creates provider instance: `DevService`
   - Creates provider instance: `SeedDataService`
   - Creates provider instance: `PersonaGenerationProcessor` **(SECOND INSTANCE)**
   - Bull attempts to register handler for `PersonaGenerationProcessor.handle()` on `'persona-generation'` queue with name `"__default__"`
   - **ERROR**: Bull detects duplicate handler name `"__default__"` on queue `'persona-generation'`
   - Throws: `"Cannot define the same handler twice __default__"`

#### 5.3 Why Bull Detects This as an Error

**Bull's Handler Registry**:
- Bull maintains a map of handlers per queue: `Queue<job name → handler function>`
- For `@Process()` without arguments, the job name is `"__default__"`
- When Bull sees:
  ```typescript
  @Processor('persona-generation')
  class PersonaGenerationProcessor {
    @Process()  // Registers handler with name "__default__"
    async handle(job) { ... }
  }
  ```
- It registers: `personaGenerationQueue["__default__"] = handle`
- If a second processor with `@Process()` is registered on the same queue, Bull tries:
  ```typescript
  personaGenerationQueue["__default__"] = handle  // ERROR: Already exists!
  ```

**Why Bull Prevents This**:
- Ambiguity: Which handler should process default jobs?
- Race conditions: Two handlers competing for the same jobs
- Data corruption: Jobs might be partially processed by multiple handlers

#### 5.4 The Specific Error Message

```
Error: Cannot define the same handler twice __default__
```

**Breakdown**:
- `"Cannot define the same handler twice"`: Bull's error message for duplicate handlers
- `"__default__"`: The handler name (comes from `@Process()` with no argument)
- This error is thrown by Bull's internal handler registry when it detects a collision

#### 5.5 Why forwardRef() Doesn't Fix It

The `forwardRef()` in `JobsModule` attempts to break the circular dependency:
```typescript
forwardRef(() => require('../dev/dev.module').DevModule),
```

**What forwardRef() Does**:
- Delays module resolution until all modules are defined
- Prevents errors like "Cannot resolve dependency before module is defined"

**What forwardRef() Does NOT Do**:
- Does NOT prevent duplicate provider registration
- Does NOT merge provider arrays from different modules
- Does NOT deduplicate processor instances

The root issue is that **both modules list PersonaGenerationProcessor in their providers arrays**. Even with `forwardRef()`, NestJS will instantiate the processor twice because it's explicitly requested twice.

---

## Code References

### Queue Registrations
- `/workspace/grove-backend/src/jobs/jobs.module.ts:22-27` - Both queues registered
- `/workspace/grove-backend/src/profiles/profiles.module.ts:9-11` - embedding-generation queue registered

### Processor Definitions
- `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts:13-14` - EmbeddingGenerationProcessor definition
- `/workspace/grove-backend/src/dev/persona-generation.processor.ts:7-8` - PersonaGenerationProcessor definition

### Processor Registrations (THE PROBLEM)
- `/workspace/grove-backend/src/jobs/jobs.module.ts:34` - FIRST PersonaGenerationProcessor registration
- `/workspace/grove-backend/src/dev/dev.module.ts:25` - SECOND PersonaGenerationProcessor registration (DUPLICATE)

### Processor Handler Methods
- `/workspace/grove-backend/src/jobs/embedding-generation.processor.ts:23-24` - `@Process()` handler
- `/workspace/grove-backend/src/dev/persona-generation.processor.ts:13-14` - `@Process()` handler (causes duplicate __default__)

### Module Imports
- `/workspace/grove-backend/src/app.module.ts:41` - JobsModule imported
- `/workspace/grove-backend/src/app.module.ts:47` - DevModule imported
- `/workspace/grove-backend/src/dev/dev.module.ts:20` - DevModule imports JobsModule
- `/workspace/grove-backend/src/jobs/jobs.module.ts:32` - JobsModule imports DevModule with forwardRef()

### Service Dependencies
- `/workspace/grove-backend/src/dev/dev.service.ts:55-56` - DevService injects persona-generation queue
- `/workspace/grove-backend/src/dev/persona-generation.processor.ts:11` - PersonaGenerationProcessor depends on DevService

---

## Solution Summary

### What Needs to Be Fixed

**Remove PersonaGenerationProcessor from DevModule**:
```typescript
// File: /workspace/grove-backend/src/dev/dev.module.ts
// Line 25: Change this line

// BEFORE (INCORRECT):
providers: [DevService, SeedDataService, PersonaGenerationProcessor],

// AFTER (CORRECT):
providers: [DevService, SeedDataService],
```

### Why This Fixes the Issue

1. `PersonaGenerationProcessor` will only be registered once (in `JobsModule`)
2. Bull will only register one handler for the `'persona-generation'` queue
3. No duplicate `"__default__"` handler error
4. `DevService` can still enqueue jobs by injecting the queue from `JobsModule`
5. The processor will still have access to `DevService` because `JobsModule` imports `DevModule`

### What Doesn't Need to Change

- Queue registration in `JobsModule` ✓ (correct)
- Queue injection in `DevService` ✓ (correct)
- Processor definition in `/workspace/grove-backend/src/dev/persona-generation.processor.ts` ✓ (correct)
- Processor registration in `JobsModule` ✓ (correct)
- `forwardRef()` in `JobsModule` ✓ (needed for circular dependency)

---

## Architecture Lessons

### Pattern to Follow

**For adding a new queue and processor**:

1. **Define the queue**:
   ```typescript
   // In JobsModule or feature module
   BullModule.registerQueue({ name: 'my-new-queue' })
   ```

2. **Create the processor**:
   ```typescript
   // In src/jobs/ or feature directory
   @Processor('my-new-queue')
   export class MyQueueProcessor {
     @Process()
     async handle(job: Job) { ... }
   }
   ```

3. **Register the processor in ONE module only**:
   ```typescript
   // In JobsModule (recommended)
   @Module({
     providers: [MyQueueProcessor],
   })
   ```

4. **Enqueue jobs from any module**:
   ```typescript
   // In any service
   constructor(
     @InjectQueue('my-new-queue')
     private myQueue: Queue,
   ) {}
   ```

5. **Other modules should NOT register the processor**:
   ```typescript
   // WRONG:
   @Module({
     imports: [JobsModule],
     providers: [MyService, MyQueueProcessor],  // ← Remove this!
   })

   // CORRECT:
   @Module({
     imports: [JobsModule],
     providers: [MyService],
   })
   ```

### Common Pitfalls

1. **Registering processor in multiple modules** ← This bug
2. **Confusing queue registration with processor registration**
3. **Thinking the enqueueing module needs the processor**
4. **Not understanding that queue registration is idempotent but processor registration is not**

---

## Related Research

This research is self-contained and addresses the immediate architectural question. Related topics for future research:
- Bull queue monitoring and observability patterns in this codebase
- Job retry and error handling strategies
- Queue performance and Redis optimization

---

## Open Questions

None. The root cause is identified, and the fix is straightforward.
