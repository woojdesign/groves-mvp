---
doc_type: research
created_at: 2025-10-31T19:02:27Z
created_by: Claude Code
last_updated: 2025-10-31T19:02:27Z
last_updated_by: Claude Code
status: completed
git_commit: ce3dc9cfebae3f4788b1136a64b4b521417989ab
branch: feature/persona-diversity-improvements
research_question: "Why is the application still throwing 'column p.niche_interest does not exist' errors after database migration and code fixes?"
tags:
  - database
  - debugging
  - migration
  - node-process
  - stale-code
  - prisma
  - nestjs
related_docs:
  - thoughts/plans/2025-10-31-complete-field-rename-migration.md
---

# Research: Persistent niche_interest Column Error Investigation

**Date**: 2025-10-31T19:02:27Z
**Researcher**: Claude Code
**Git Commit**: ce3dc9cfebae3f4788b1136a64b4b521417989ab
**Branch**: feature/persona-diversity-improvements
**Repository**: grove-backend

## Research Question

Why is the application still throwing `column p.niche_interest does not exist` errors after the database migration has been executed and all code references have been updated to use `interests`?

## Summary

**ROOT CAUSE IDENTIFIED**: The Node.js backend process (PID 10814) is running **stale code from 6+ hours ago**, before the database migration and code fixes were applied. Despite using `nest start --watch` which should auto-reload on file changes, the process failed to restart and is still executing the old compiled JavaScript that references `p.niche_interest`.

**Key Finding**: The error is NOT caused by incorrect code in the repository - all source files and compiled dist/ files are correct and use `p.interests`. The issue is purely a **stale runtime environment**.

## Detailed Findings

### 1. Timeline Analysis

**Process Start Time** (from `ps -p 10814`):
- PID 10814 started: **Fri Oct 31 12:50:25 2025** (12:50 PM)

**File Modification Times**:
- Source file: `/workspace/grove-backend/src/dev/dev.service.ts` - **2025-10-31 18:56:38** (6:56 PM)
- Compiled file: `/workspace/grove-backend/dist/src/dev/dev.service.js` - **2025-10-31 18:56:40** (6:56 PM)

**Gap**: Process has been running for **6 hours and 12 minutes** without restarting, despite the watch mode configuration.

### 2. Code Verification - All Files Are Correct

#### Source Code (dev.service.ts:1033-1048)
The `previewMatches` function uses the correct column name:
```typescript
const matches = await this.prisma.$queryRaw<
  Array<{
    user_id: string;
    name: string;
    email: string;
    interests: string;  // ✅ CORRECT
    similarity_score: number;
  }>
>`
  SELECT
    u.id as user_id,
    u.name,
    u.email,
    p.interests,  // ✅ CORRECT - Line 1038
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
```

#### Compiled JavaScript (dev.service.js:678-693)
The compiled code also uses the correct column:
```javascript
const matches = await this.prisma.$queryRaw `
  SELECT
    u.id as user_id,
    u.name,
    u.email,
    p.interests,  // ✅ CORRECT - Line 683
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
```

### 3. Database Schema Verification

**Prisma Schema** (`prisma/schema.prisma:87`):
```prisma
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  interests      String   @map("interests") @db.Text  // ✅ CORRECT
  project        String   @db.Text
  connectionType String   @map("connection_type")
  deepDive       String?  @map("deep_dive") @db.Text
  // ...
}
```

**Actual Database Schema** (from `npx prisma db pull`):
```prisma
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  project        String
  connectionType String   @map("connection_type")
  preferences    String?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  isTestData     Boolean  @default(false) @map("is_test_data")
  deepDive       String?  @map("deep_dive")
  interests      String   @map("interests")  // ✅ Column exists in database
}
```

### 4. Comprehensive Search Results

**Search for `niche_interest` (case-insensitive)**:
- `/workspace/grove-backend/prisma/migrations/20251022_init/migration.sql:34` - Old initial migration (historical)
- `/workspace/grove-backend/prisma/migrations/20251031025811_rename_fields_interests_and_deep_dive/migration.sql` - Migration that renamed the column (historical)
- `/workspace/grove-backend/thoughts/plans/2025-10-31-complete-field-rename-migration.md` - Documentation only
- `/workspace/grove-backend/thoughts/research/2025-10-31-profile-model-multiple-interests-rearchitecture.md` - Documentation only

**Search for `nicheInterest` (camelCase)**:
- Only found in documentation files (`thoughts/` directory)

**NO active code files contain `niche_interest` or `nicheInterest`** ✅

### 5. Process Investigation

**Running Process**:
```
PID   PPID  STARTED                 CMD
10814 10813 Fri Oct 31 12:50:25 2025 node --enable-source-maps /workspace/grove-backend/dist/src/main
```

**Startup Script** (`dev-start.sh`):
```bash
# Start backend in background
echo -e "${BLUE}→${NC} Starting Backend (NestJS)..."
cd grove-backend
npm run start:dev > ../logs/backend.log 2>&1 &  # Uses watch mode
BACKEND_PID=$!
```

**Package.json Script** (`package.json:12`):
```json
"start:dev": "nest start --watch"
```

**Configuration**: The backend SHOULD auto-reload when files change (using `--watch` flag), but clearly didn't restart after the code changes at 6:56 PM.

### 6. Error Log Evidence

**Backend Log** (`logs/backend.log` at 7:00:28 PM):
```
[Nest] 10814  - 10/31/2025, 7:00:28 PM    LOG [DevService] Previewing matches for persona 4c4a66ac-6e5d-4b93-aec7-13d4a195d85d
[Nest] 10814  - 10/31/2025, 7:00:28 PM  ERROR [ExceptionFilter] GET /api/admin/dev/personas/4c4a66ac-6e5d-4b93-aec7-13d4a195d85d/matches?limit=10 - 500
[Nest] 10814  - 10/31/2025, 7:00:28 PM  ERROR [ExceptionFilter] PrismaClientKnownRequestError:
Invalid `prisma.$queryRaw()` invocation:

Raw query failed. Code: `42703`. Message: `column p.niche_interest does not exist`
    at async DevService.previewMatches (/workspace/grove-backend/src/dev/dev.service.ts:746:21)
```

**PostgreSQL Error Code `42703`**: "undefined_column" - column does not exist in the database.

The error trace points to line 746, but this is the **error reporting location** in the stack trace, not where the SQL is defined. The actual SQL query that's being executed by the running process still contains the old `p.niche_interest` reference from 6+ hours ago.

### 7. Files with Raw SQL Queries

**All files using `$queryRaw` or `$executeRaw`**:
- `/workspace/grove-backend/src/dev/dev.service.ts` - ✅ Uses `p.interests` (correct)
- `/workspace/grove-backend/src/matching/strategies/matching/vector-similarity.strategy.ts` - ✅ No profile column references
- `/workspace/grove-backend/src/embeddings/embeddings.service.ts` - ✅ No profile column references
- `/workspace/grove-backend/src/health/prisma.health.ts` - Health check only
- Utility scripts in root (`check-db-schema.ts`, `test-matching.ts`, etc.) - Not running in production

All active code files are correct and use the new column names.

## Architecture Context

### Process Management in Docker Development Environment

The Grove backend runs inside a Docker container with this process tree:
```
PID 10813 (parent shell) → PID 10814 (node process)
```

The `dev-start.sh` script:
1. Runs `npm run start:dev` in background
2. This executes `nest start --watch`
3. Nest CLI compiles TypeScript and runs with nodemon-like watch
4. SHOULD restart when `.ts` files change

**Problem**: The watch mechanism failed to restart the process after:
- Database migration at ~6:56 PM
- Code changes at ~6:56 PM
- New build at ~6:56 PM

### NestJS Watch Mode Behavior

From `package.json:12`:
```json
"start:dev": "nest start --watch"
```

The `--watch` flag should:
- Monitor source files for changes
- Recompile on change
- Restart the Node process

**Failure Mode**: Sometimes watch mode fails to detect changes or restart, especially with:
- Docker volume mounts (timing issues)
- Rapid successive changes
- Build errors that prevent restart

## Code References

### Primary Files Investigated

- `/workspace/grove-backend/src/dev/dev.service.ts:1007-1060` - previewMatches function (✅ correct)
- `/workspace/grove-backend/dist/src/dev/dev.service.js:666-704` - Compiled previewMatches (✅ correct)
- `/workspace/grove-backend/prisma/schema.prisma:84-99` - Profile model definition (✅ correct)
- `/workspace/grove-backend/package.json:8-23` - NPM scripts
- `/workspace/dev-start.sh` - Development startup script

### Migration Files

- `/workspace/grove-backend/prisma/migrations/20251031025811_rename_fields_interests_and_deep_dive/migration.sql` - Executed migration that renamed columns
- `/workspace/grove-backend/prisma/migrations/20251022_init/migration.sql:34` - Original schema with `niche_interest` (historical)

## Historical Context

### Related Documentation

From `thoughts/plans/2025-10-31-complete-field-rename-migration.md`:
- Documents the complete field rename from `niche_interest` → `interests`
- Shows the migration was successfully executed
- Lists all code locations that were updated

The plan document confirms that all code references were fixed, which our investigation validates - the source code IS correct.

## Conclusion

**The persistent error is caused by a stale Node.js process that has been running for 6+ hours without restarting.**

### Evidence Summary

1. ✅ **Database schema is correct** - `interests` column exists, `niche_interest` was dropped
2. ✅ **Source code is correct** - All `.ts` files use `p.interests`
3. ✅ **Compiled code is correct** - All `dist/*.js` files use `p.interests`
4. ❌ **Running process is stale** - PID 10814 started at 12:50 PM, still running old code from before 6:56 PM changes
5. ❌ **Watch mode failed** - `nest start --watch` did not restart despite file changes

### Why the Error Persists

The Node process (PID 10814) loaded the compiled JavaScript into memory at 12:50 PM. Even though the source files and compiled files on disk were updated at 6:56 PM, the **running process never reloaded** and continues executing the old code that queries for `p.niche_interest`.

This is a classic "turn it off and on again" scenario - the code is correct, but the runtime environment is stale.

## Exact Fix Required

**Single Action Required**: Restart the backend Node.js process.

### Option 1: Kill and Restart the Process
```bash
# Kill the stale process
kill 10814

# Restart the backend
cd /workspace/grove-backend
npm run start:dev > ../logs/backend.log 2>&1 &
```

### Option 2: Use the Restart Script
```bash
cd /workspace
./dev-start.sh restart
```

### Option 3: Full Environment Restart
```bash
# Kill all processes
pkill -f "node.*grove-backend"

# Restart everything
cd /workspace
./dev-start.sh
```

**Expected Result**: After restart, the new process will load the current compiled code from `dist/` which correctly uses `p.interests`, and the error will disappear.

## Prevention Recommendations

To prevent this issue in the future:

1. **Always verify process restart** after migrations:
   ```bash
   ps aux | grep "node.*grove-backend"
   # Check PID and start time
   ```

2. **Manual restart after migrations**:
   ```bash
   # After running migrations, explicitly restart:
   pkill -f "nest start"
   npm run start:dev
   ```

3. **Add health check** that includes process start time:
   ```typescript
   // In health check endpoint
   {
     status: 'ok',
     uptime: process.uptime(),
     started_at: new Date(Date.now() - process.uptime() * 1000)
   }
   ```

4. **Monitor watch mode** - If files change but watch doesn't restart, investigate:
   - Docker volume mount delays
   - File system event propagation
   - Build errors preventing restart

## Related Research

- `thoughts/plans/2025-10-31-complete-field-rename-migration.md` - The migration plan that was correctly executed
- `thoughts/research/2025-10-31-profile-model-multiple-interests-rearchitecture.md` - Future architecture for multiple interests

## Open Questions

None - issue is fully understood and resolution is clear.
