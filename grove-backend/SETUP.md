# Grove Backend - Setup Guide

Complete setup instructions for the Grove MVP backend.

## Prerequisites Check

Before starting, verify you have:

```bash
# Node.js 18+
node --version  # Should be v18.x or higher

# npm
npm --version   # Should be 9.x or higher

# Docker & Docker Compose
docker --version
docker compose version
```

## Step-by-Step Setup

### Step 1: Start PostgreSQL and Redis

The backend requires PostgreSQL (with pgvector) and Redis running. The easiest way is using Docker Compose:

```bash
# From the project root (/workspace)
docker compose up -d postgres redis

# Verify containers are running
docker compose ps

# You should see:
# - grove-postgres (healthy)
# - grove-redis (healthy)
```

**Troubleshooting**:
- If containers fail to start, check logs: `docker compose logs postgres`
- Ensure ports 5432 and 6379 are not already in use
- On first run, it may take 30-60 seconds for PostgreSQL to initialize

### Step 2: Install Dependencies

```bash
cd grove-backend
npm install
```

This installs all runtime and development dependencies including:
- NestJS framework
- Prisma ORM and Client
- PostgreSQL drivers
- Authentication libraries
- Testing utilities

### Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# The default .env file is already configured for Docker setup
# You only need to edit it if:
# - Using a different PostgreSQL setup
# - Ready to add API keys (OpenAI, Postmark)
```

**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection (pre-configured for Docker)
- `PORT`: API server port (default: 4000)
- `FRONTEND_URL`: CORS origin (default: http://localhost:3000)
- Other variables are placeholders for future phases

### Step 4: Run Database Migrations

This creates all database tables and enables the pgvector extension:

```bash
npx prisma migrate deploy
```

**What this does**:
1. Connects to PostgreSQL
2. Creates the `grove_mvp` database (if needed)
3. Enables `vector` extension for embeddings
4. Creates all 10 tables with indexes
5. Generates Prisma Client

**Expected output**:
```
1 migration found in prisma/migrations
Applying migration `20251022_init`
The following migration have been applied:
migrations/
  └─ 20251022_init/
    └─ migration.sql
```

**Troubleshooting**:
- If you get "Can't reach database": Ensure PostgreSQL container is running
- If you get permission errors: Check DATABASE_URL credentials
- To reset database: `npx prisma migrate reset` (⚠️ deletes all data)

### Step 5: Seed Development Data

Create sample data for testing:

```bash
npx prisma db seed
```

**What this creates**:
- 1 organization: "Example Company"
- 3 users: Alice, Bob, Carol
- 3 profiles with diverse interests

**Expected output**:
```
🌱 Seeding database...
✅ Created org: Example Company
✅ Created 3 users
✅ Created profiles for all users
✨ Seeding complete!
```

### Step 6: Verify Database Setup

Use Prisma Studio to view your data:

```bash
npx prisma studio
```

This opens a web UI at `http://localhost:5555` where you can:
- Browse all tables
- View seeded data
- Manually add/edit records

### Step 7: Start the Backend Server

```bash
# Development mode with hot reload (recommended)
npm run start:dev

# Or standard start
npm start
```

**Expected output**:
```
[Nest] INFO [NestApplication] Nest application successfully started
✅ Database connected
🚀 Grove Backend API running on http://localhost:4000
📊 Health check: http://localhost:4000/health
```

### Step 8: Test the Health Endpoint

In a new terminal:

```bash
curl http://localhost:4000/health
```

**Expected response**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

**Success!** Your Grove backend is now running.

---

## Verification Checklist

After setup, verify:

- [ ] PostgreSQL container is running and healthy
- [ ] Redis container is running and healthy
- [ ] All npm dependencies installed without errors
- [ ] Database migrations applied successfully
- [ ] Seed data created (visible in Prisma Studio)
- [ ] Backend server starts without errors
- [ ] Health endpoint returns `{ "status": "ok" }`
- [ ] Tests pass: `npm test`

---

## Common Issues

### Issue: "Can't reach database server"

**Cause**: PostgreSQL container not running or wrong hostname

**Solution**:
```bash
# Check container status
docker compose ps postgres

# If not running, start it
docker compose up -d postgres

# Wait for healthy status (check with docker compose ps)

# If using different setup, update .env DATABASE_URL
```

### Issue: "Port 4000 already in use"

**Cause**: Another process is using port 4000

**Solution**:
```bash
# Option 1: Kill the process
lsof -ti:4000 | xargs kill -9

# Option 2: Change the port in .env
echo "PORT=4001" >> .env
```

### Issue: "pgvector extension not found"

**Cause**: Using a PostgreSQL image without pgvector

**Solution**:
Ensure you're using the correct image in `docker-compose.yml`:
```yaml
postgres:
  image: ankane/pgvector:latest  # ← This image includes pgvector
```

### Issue: Prisma Client not generated

**Cause**: Migrations ran but Prisma Client wasn't generated

**Solution**:
```bash
npx prisma generate
```

---

## Development Workflow

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name <migration_name>`
3. Migration is auto-applied and Prisma Client regenerated

### Resetting Database

⚠️ **Warning**: This deletes ALL data

```bash
npx prisma migrate reset
# Then re-seed:
npx prisma db seed
```

### Running Tests

```bash
# All tests
npm test

# Watch mode during development
npm run test:watch

# With coverage
npm run test:cov
```

### Debugging

```bash
# Start in debug mode
npm run start:debug

# Then attach your debugger (VS Code, Chrome DevTools, etc.)
# Default debug port: 9229
```

---

## Next Steps

After Phase 1 setup is complete:

1. **Phase 2**: Implement authentication (magic link)
2. **Phase 3**: Build onboarding endpoints
3. **Phase 4**: Add embedding generation
4. **Phase 5**: Implement matching algorithm
5. **Phase 6**: Create double opt-in flow
6. **Phase 7**: Deploy to production

See the main implementation plan for details on each phase.

---

## Getting Help

- **Prisma Issues**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com
- **pgvector**: https://github.com/pgvector/pgvector
- **Project Documentation**: See `/workspace/thoughts/plans/`

---

**Setup Guide Version**: Phase 1 Complete (2025-10-22)
