---
doc_type: research
date: 2025-10-30T16:10:38+00:00
title: "Grove Development Environment Setup and Quickstart Guide"
research_question: "What are the complete prerequisites, setup steps, and configuration needed to run the Grove project development environment?"
researcher: Sean Kim

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-30
last_updated_by: Sean Kim

tags:
  - development
  - setup
  - quickstart
  - docker
  - environment
status: complete

related_docs:
  - /workspace/README.md
  - /workspace/QUICKSTART.md
  - /workspace/docs/README.md
---

# Research: Grove Development Environment Setup and Quickstart Guide

**Date**: 2025-10-30T16:10:38+00:00
**Researcher**: Sean Kim
**Git Commit**: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
**Branch**: main
**Repository**: workspace

## Research Question

What are the complete prerequisites, setup steps, and configuration needed to run the Grove project development environment locally, including all dependencies, environment variables, and services required for both frontend and backend?

## Summary

The Grove MVP is a full-stack AI-powered connection platform with a React/TypeScript frontend and NestJS backend. The development environment can be run in three ways:

1. **All-in-One Docker Compose** (Recommended): Uses `docker-compose.yml` to run PostgreSQL, Redis, and optionally the development container
2. **Automated Script** (`dev-start.sh`): Starts all services inside Docker container with automated dependency installation and database migrations
3. **Manual Setup**: Run backend and frontend separately in two terminals after installing dependencies

The stack includes:
- **Frontend**: React 18 + TypeScript + Vite (port 5173)
- **Backend**: NestJS + TypeScript (port 4000)
- **Database**: PostgreSQL 14+ with pgvector extension (port 5433)
- **Cache/Queue**: Redis 7+ (port 6379)
- **External APIs**: OpenAI API (embeddings), Postmark (emails - optional in dev)

## Detailed Findings

### 1. Prerequisites

#### Required Software

**Node.js and npm** ([package.json:1-68](/workspace/package.json))
- **Version**: Node.js 18+ (current: v20.19.5 in container)
- npm 8+ (current: v10.8.2)
- Location: Root package.json shows `"@types/node": "^20.10.0"`

**Docker and Docker Compose** ([docker-compose.yml:1-77](/workspace/docker-compose.yml))
- Docker Desktop or Docker Engine
- Docker Compose V2 (comes with Docker Desktop)
- Required to run PostgreSQL with pgvector extension and Redis

**PostgreSQL** (via Docker)
- Version: 14+ with pgvector extension
- Image: `ankane/pgvector:latest` ([docker-compose.yml:44](/workspace/docker-compose.yml))
- The pgvector extension is critical for AI similarity matching

**Redis** (via Docker)
- Version: 7+
- Image: `redis:7-alpine` ([docker-compose.yml:60](/workspace/docker-compose.yml))
- Used for BullMQ job queues

#### Optional Software

**OpenAI API Key**
- Required for production embedding generation
- Can be skipped in development for testing non-AI features
- Set in `grove-backend/.env` as `OPENAI_API_KEY`

**Postmark API Key**
- Required for sending emails (magic links)
- Optional in development - emails will be logged to console if not configured
- Set in `grove-backend/.env` as `POSTMARK_API_KEY`

### 2. Repository Structure

([README.md:100-113](/workspace/README.md))

```
grove-mvp/
├── src/                      # Frontend React application
│   ├── components/          # React components
│   ├── lib/                 # API client and services
│   ├── config/              # Environment configuration
│   └── main.tsx             # App entry point
├── grove-backend/            # Backend NestJS API
│   ├── src/                 # TypeScript source
│   │   └── main.ts          # Backend entry point
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Seed data script
│   │   └── migrations/      # Migration files
│   └── package.json         # Backend dependencies
├── docs/                     # Comprehensive documentation
├── docker-compose.yml        # Multi-container orchestration
├── dev-start.sh              # All-in-one startup script
├── package.json              # Frontend dependencies
└── vite.config.ts            # Frontend build config
```

### 3. Initial Setup Steps

#### Option A: All-in-One Docker Compose (Recommended)

([README.md:24-43](/workspace/README.md))

```bash
# 1. Clone the repository
git clone <repository-url>
cd grove-mvp

# 2. Start all services with Docker Compose
docker compose up -d

# This starts:
# - PostgreSQL with pgvector (port 5433)
# - Redis (port 6379)
# - Optional: grove-dev container
```

The `docker-compose.yml` defines three services ([docker-compose.yml:1-77](/workspace/docker-compose.yml)):

1. **grove-dev**: Development container with Node.js 20, git, PostgreSQL client, Redis tools
2. **postgres**: PostgreSQL 14+ with pgvector extension
3. **redis**: Redis 7 for job queues

#### Option B: Using dev-start.sh Script

([dev-start.sh:1-152](/workspace/dev-start.sh))

The `dev-start.sh` script is designed to run **inside the Docker container** and automates:

1. Checking PostgreSQL and Redis availability
2. Installing npm dependencies (frontend and backend)
3. Running Prisma migrations
4. Starting backend on port 4000
5. Starting frontend on port 5173
6. Managing logs in `/logs` directory

**Usage** (inside container):
```bash
# Inside the grove-dev container
./dev-start.sh
```

The script includes:
- Health checks for PostgreSQL and Redis ([dev-start.sh:34-47](/workspace/dev-start.sh))
- Automatic dependency installation ([dev-start.sh:54-62](/workspace/dev-start.sh))
- Database migration execution ([dev-start.sh:65-70](/workspace/dev-start.sh))
- Background process management ([dev-start.sh:82-109](/workspace/dev-start.sh))
- Graceful shutdown handling ([dev-start.sh:137-143](/workspace/dev-start.sh))

#### Option C: Manual Setup (Without Docker)

([QUICKSTART.md:1-126](/workspace/QUICKSTART.md))

**Prerequisites**: You must have PostgreSQL 14+ and Redis 7+ running locally.

```bash
# Terminal 1: Start Backend
cd grove-backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev

# Terminal 2: Start Frontend
cd /workspace
npm install
npm run dev
```

### 4. Environment Configuration

#### Frontend Environment Variables

File: `/workspace/.env` (copy from `.env.example`)

([.env.example:1-11](/workspace/.env.example))

```bash
# API Base URL (backend)
# Development: http://localhost:4000/api
# Production: https://api.commonplace.app/api
VITE_API_BASE_URL=http://localhost:4000/api

# Sentry DSN for error tracking (optional, only in production)
VITE_SENTRY_DSN=your-sentry-frontend-dsn-here
```

**Configuration Usage** ([src/config/env.ts:1-15](/workspace/src/config/env.ts)):
```typescript
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  apiTimeout: 30000,
  tokenRefreshThreshold: 60 * 1000,
} as const;
```

#### Backend Environment Variables

File: `/workspace/grove-backend/.env` (copy from `.env.example`)

([grove-backend/.env.example:1-60](/workspace/grove-backend/.env.example))

**Critical Variables**:

```bash
# Database
DATABASE_URL="postgresql://CHANGE_USER:CHANGE_PASS@localhost:5432/grove_mvp?schema=public&sslmode=prefer"

# JWT Authentication
JWT_SECRET="CHANGE_ME_min_32_chars_use_openssl_rand_base64_32"
JWT_EXPIRATION="7d"

# Magic Link
MAGIC_LINK_EXPIRATION="15m"
MAGIC_LINK_BASE_URL="http://localhost:5173"

# OpenAI (required for embeddings)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="text-embedding-3-small"

# Postmark (optional in dev)
POSTMARK_API_KEY="your-key-here"  # Optional - logs to console if missing
POSTMARK_FROM_EMAIL="hello@commonplace.app"

# Redis (for BullMQ)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Application
NODE_ENV="development"
PORT="4000"
API_PREFIX="api"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# Field-Level Encryption
ENCRYPTION_KEY="CHANGE_ME_use_openssl_rand_base64_32_for_production_deployment"

# Sentry (optional)
SENTRY_DSN=your-sentry-backend-dsn-here
```

**Docker-Specific Database URL**:
When running inside Docker, use the service names:
```bash
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/grove_mvp?schema=public&sslmode=prefer"
REDIS_HOST="redis"
```

**Key Security Notes**:
1. `JWT_SECRET`: Must be at least 32 characters (generate with `openssl rand -base64 32`)
2. `ENCRYPTION_KEY`: Used for field-level encryption (generate with `openssl rand -base64 32`)
3. Never commit actual secrets to version control

### 5. Database Setup

#### Prisma Schema

([grove-backend/prisma/schema.prisma:1-262](/workspace/grove-backend/prisma/schema.prisma))

The database has 11 tables:
1. **Org** (Organizations) - Multi-tenancy support
2. **User** - User accounts with SSO support
3. **Profile** - User profiles with interests
4. **Embedding** - AI embeddings for matching (with pgvector)
5. **Match** - Match records between users
6. **Intro** - Double opt-in introduction state machine
7. **Feedback** - User feedback on introductions
8. **SafetyFlag** - Reports and moderation
9. **Event** - Audit log
10. **AuthToken** - Magic link tokens
11. **AdminAction** - Admin audit trail

**pgvector Extension**:
The `Embedding` model includes a vector column for semantic similarity search:
```prisma
model Embedding {
  id            String   @id @default(uuid())
  userId        String   @unique @map("user_id")
  interestsText String   @map("interests_text") @db.Text
  // Vector column added via raw SQL migration
  // embedding vector(1536)
}
```

#### Running Migrations

**Automatic** (via dev-start.sh):
```bash
cd grove-backend
npx prisma generate    # Generate Prisma Client
npx prisma migrate deploy  # Run migrations
```

**Checking Migration Status**:
```bash
cd grove-backend
npx prisma migrate status
```

**Existing Migrations** ([grove-backend/prisma/migrations/](/workspace/grove-backend/prisma/migrations)):
- `20251022_init/migration.sql` - Initial schema
- `20251023095925_init/migration.sql` - Schema updates
- `20251023112358_add_sso_rbac_multi_tenant/migration.sql` - SSO, RBAC, multi-tenancy

#### Seeding Test Data

([grove-backend/prisma/seed.ts:1-114](/workspace/grove-backend/prisma/seed.ts))

The seed script creates:
- 1 organization (Example Company, domain: example.com)
- 3 test users (alice@example.com, bob@example.com, carol@example.com) with default `user` role
- 3 profiles with diverse interests (synthesizers, sourdough, urban gardening)

**Note**: No admin users are created by default. See "Creating Admin Users" section below to create super admin users for accessing the admin panel.

**Running the seed**:
```bash
cd grove-backend
npm run prisma:seed
# Or directly:
npx prisma db seed
```

#### Creating Admin Users

**Important**: The default seed script creates only regular users. To access the admin panel at `/admin`, you need to create a super admin user manually.

([grove-backend/src/common/enums/role.enum.ts:1-5](/workspace/grove-backend/src/common/enums/role.enum.ts))

The application supports three roles:
- `user` - Regular user (default)
- `org_admin` - Organization administrator
- `super_admin` - Super administrator with full access

**Method 1: Update Seed Script** (Recommended for development)

Add an admin user to the seed script ([grove-backend/prisma/seed.ts:22-53](/workspace/grove-backend/prisma/seed.ts)):

```typescript
// After creating the org, add this to the users array:
prisma.user.upsert({
  where: { email: 'admin@example.com' },
  update: {},
  create: {
    email: 'admin@example.com',
    name: 'Super Admin',
    orgId: org.id,
    role: 'super_admin',  // Set admin role
    status: 'active',
  },
}),
```

Then run the seed again:
```bash
cd grove-backend
npx prisma db seed
```

**Method 2: Using Prisma Studio** (GUI)

```bash
cd grove-backend
npx prisma studio
# Opens in browser at http://localhost:5555
# 1. Click on "User" model
# 2. Find the user you want to promote
# 3. Change "role" field from "user" to "super_admin"
# 4. Click "Save 1 change"
```

**Method 3: Direct Database Update** (SQL)

```bash
# Connect to database
psql -h localhost -p 5433 -U postgres -d grove_mvp

# Promote existing user to super admin
UPDATE "User" SET role = 'super_admin' WHERE email = 'alice@example.com';

# Or create new super admin user (requires org ID)
INSERT INTO "User" (id, email, name, "orgId", role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Super Admin',
  (SELECT id FROM "Org" LIMIT 1),
  'super_admin',
  'active',
  NOW(),
  NOW()
);
```

**Verification**:
After creating an admin user, you can verify by:
1. Logging in with the admin email
2. Completing onboarding if needed
3. Navigating to `/admin` - should have full access
4. The AuthCallback component checks for admin roles and routes accordingly ([src/components/AuthCallback.tsx](/workspace/src/components/AuthCallback.tsx))

### 6. Starting the Backend Service

#### Development Mode

([grove-backend/package.json:12](/workspace/grove-backend/package.json))

```bash
cd grove-backend
npm run start:dev
```

This runs: `nest start --watch` (auto-reload on file changes)

#### Backend Entry Point

([grove-backend/src/main.ts:1-97](/workspace/grove-backend/src/main.ts))

The backend initializes with:

1. **Sentry** (production only) - Error tracking ([main.ts:16-22](/workspace/grove-backend/src/main.ts))
2. **CORS** - Configured for frontend communication ([main.ts:28-52](/workspace/grove-backend/src/main.ts))
   - Allowed origins from `ALLOWED_ORIGINS` env var
   - Credentials enabled (for JWT cookies)
3. **Cookie Parser** - Critical for JWT authentication ([main.ts:55](/workspace/grove-backend/src/main.ts))
4. **Security Middleware** ([main.ts:58-64](/workspace/grove-backend/src/main.ts)):
   - Security headers
   - Request logging
   - Tenant context (multi-tenancy)
5. **Validation Pipe** - Global DTO validation ([main.ts:67-72](/workspace/grove-backend/src/main.ts))
6. **Exception Filters** - Prisma and global error handling ([main.ts:75-78](/workspace/grove-backend/src/main.ts))
7. **Global Guards** - JWT and CSRF protection ([main.ts:82](/workspace/grove-backend/src/main.ts))
8. **API Prefix** - `/api` for all routes ([main.ts:88](/workspace/grove-backend/src/main.ts))

**Server starts on**:
- Host: `0.0.0.0` (all interfaces - required for Docker)
- Port: `4000` (from `PORT` env var)
- API prefix: `/api`

**Endpoints**:
- Health check: `http://localhost:4000/api/health`
- API base: `http://localhost:4000/api/`

#### Backend Scripts

([grove-backend/package.json:8-21](/workspace/grove-backend/package.json))

```bash
npm run build          # Build for production
npm run start          # Start production build
npm run start:dev      # Start with watch mode
npm run start:debug    # Start with debugger
npm run start:prod     # Start production server
npm run lint           # ESLint
npm run format         # Prettier
npm test               # Jest unit tests
npm run test:watch     # Jest watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests
```

### 7. Starting the Frontend Application

#### Development Mode

([package.json:64-66](/workspace/package.json))

```bash
# From project root
npm run dev
```

This runs: `vite` (Vite dev server with hot module replacement)

#### Vite Configuration

([vite.config.ts:1-74](/workspace/vite.config.ts))

Key settings:
- **Plugin**: `@vitejs/plugin-react-swc` (Fast Refresh with SWC compiler)
- **Port**: 5173
- **Host**: `0.0.0.0` (required for Docker)
- **Auto-open**: Disabled (for container usage)
- **Path alias**: `@/` maps to `./src/`
- **Extensions**: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`

**Extensive Radix UI aliases** for shadcn/ui components ([vite.config.ts:18-59](/workspace/vite.config.ts))

#### Frontend Scripts

([package.json:63-66](/workspace/package.json))

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Build for production
```

#### Frontend Entry Point

([src/main.tsx](/workspace/src/main.tsx))

The application uses:
- React 18 with `createRoot`
- React Router for navigation
- Protected routes with authentication
- Main routes:
  - `/` - Welcome page (email entry)
  - `/auth/verify` - Magic link verification
  - `/onboarding` - 5-step onboarding
  - `/dashboard` - Matching dashboard (protected)
  - `/admin` - Admin panel (protected)

### 8. Verifying Everything is Running

#### Health Checks

**Backend Health Check** ([QUICKSTART.md:60-65](/workspace/QUICKSTART.md)):
```bash
curl http://localhost:4000/api/health
# Should return: {"status":"ok"}
```

**PostgreSQL Check**:
```bash
# From host (port 5433)
psql -h localhost -p 5433 -U postgres -d grove_mvp

# Inside container or with local PostgreSQL
pg_isready -h localhost -U postgres
```

**Redis Check**:
```bash
# From host
redis-cli -h localhost -p 6379 ping
# Should return: PONG
```

#### Access Points

([README.md:45-49](/workspace/README.md))

**From Host Machine**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Health Check: `http://localhost:4000/api/health`
- PostgreSQL: `localhost:5433` (user: postgres, password: postgres, db: grove_mvp)
- Redis: `localhost:6379`

**Inside Docker Container**:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api`
- PostgreSQL: `postgres:5432` (using service name)
- Redis: `redis:6379` (using service name)

#### Testing the Application Flow

([QUICKSTART.md:30-53](/workspace/QUICKSTART.md))

**1. Magic Link Flow**:
```
1. Navigate to http://localhost:5173
2. Enter email and name on welcome screen
3. Click "Join commonplace"
4. Check backend console logs for magic link URL
5. Copy the token from the magic link
6. Navigate to: http://localhost:5173/auth/verify?token=YOUR_TOKEN
7. Should redirect to onboarding
```

**2. Onboarding**:
```
1. Complete all 5 steps:
   - Niche interest
   - Project
   - Connection type
   - Rabbit hole (optional)
   - Preferences (optional)
2. Click "Complete" on final step
3. Should see matching animation
4. Should redirect to dashboard
```

**3. Matching**:
```
1. Dashboard loads potential matches
2. Click "I'd love to connect" to accept
3. Click "Maybe later" to pass
4. Should see next match
```

### 9. Troubleshooting Common Issues

#### Backend Not Responding

([QUICKSTART.md:58-65](/workspace/QUICKSTART.md))

```bash
# Check if backend is running
curl http://localhost:4000/api/health
# Should return: {"status":"ok"}

# Check backend logs
tail -f logs/backend.log  # If using dev-start.sh
```

**Common causes**:
- PostgreSQL not ready
- Redis not connected
- Missing environment variables
- Port 4000 already in use

#### CORS Errors

([QUICKSTART.md:67-75](/workspace/QUICKSTART.md))

The backend CORS is configured in `main.ts` ([grove-backend/src/main.ts:28-52](/workspace/grove-backend/src/main.ts)):

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
});
```

**Solution**: Ensure `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL.

#### Magic Link Not Working

([QUICKSTART.md:77-79](/workspace/QUICKSTART.md))

In development without Postmark configured:
1. Check backend logs for email service output
2. Extract the token from the logs
3. Manually construct the URL: `http://localhost:5173/auth/verify?token=YOUR_TOKEN`

**Email configuration**:
- Production: Set `POSTMARK_API_KEY` in backend `.env`
- Development: Leave empty - emails logged to console

#### Authentication Errors

([QUICKSTART.md:81-89](/workspace/QUICKSTART.md))

```javascript
// Clear localStorage in browser console
localStorage.clear()
location.reload()
```

**Common causes**:
- Expired JWT token
- Missing cookie-parser middleware (fixed in main.ts)
- CORS credentials not enabled

#### Database Connection Issues

**Check DATABASE_URL format**:
```bash
# Host machine (using port 5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grove_mvp?schema=public&sslmode=prefer"

# Docker container (using service name and port 5432)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/grove_mvp?schema=public&sslmode=prefer"
```

**Check PostgreSQL is running**:
```bash
docker compose ps
# Should show postgres as "Up"
```

#### Port Conflicts

If ports are already in use:

**Change frontend port** (vite.config.ts):
```typescript
server: {
  port: 3000,  // Change from 5173
}
```

**Change backend port** (.env):
```bash
PORT="3001"  # Change from 4000
```

**Change PostgreSQL port** (docker-compose.yml):
```yaml
ports:
  - "5434:5432"  # Change host port from 5433
```

#### Node Module Issues

```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd grove-backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate  # Regenerate Prisma Client
```

### 10. Docker Development Container

#### Dockerfile Configuration

([Dockerfile.dev:1-47](/workspace/Dockerfile.dev))

The development Dockerfile:
1. Uses `node:20-bookworm` base image
2. Installs Claude Code CLI: `npm install -g @anthropic-ai/claude-code`
3. Installs dev tools: git, PostgreSQL client, Redis tools, netcat
4. Sets working directory to `/workspace`
5. Runs as non-root `node` user (UID 1000)
6. Exposes port 3000 (note: Vite uses 5173, this may be outdated)

#### Docker Compose Configuration

([docker-compose.yml:1-77](/workspace/docker-compose.yml))

**grove-dev service**:
- Builds from `Dockerfile.dev`
- Mounts project directory to `/workspace`
- Excludes `node_modules` (prevents host/container conflicts)
- Persists Claude home directory via named volume
- Ports: 5173 (frontend), 4000 (backend)
- Resource limits: 2 CPUs, 4GB memory
- Depends on PostgreSQL and Redis

**postgres service**:
- Image: `ankane/pgvector:latest`
- Credentials: postgres/postgres
- Database: grove_mvp
- Port: 5433 (host) → 5432 (container)
- Volume: `postgres_data` (persisted)
- Health check: `pg_isready`

**redis service**:
- Image: `redis:7-alpine`
- Port: 6379 (same on host and container)
- Volume: `redis_data` (persisted)
- Health check: `redis-cli ping`

**Named volumes**:
- `postgres_data`: Database persistence
- `redis_data`: Redis persistence
- `claude-home`: Claude Code authentication and config

### 11. Development Workflow Scripts

#### dev-start.sh

([dev-start.sh:1-152](/workspace/dev-start.sh))

**Purpose**: All-in-one startup script for container environment

**Features**:
1. Environment detection (checks for Docker)
2. Health checks for PostgreSQL and Redis
3. Dependency installation (if needed)
4. Prisma migrations
5. Background process management
6. Log aggregation to `/logs` directory
7. Graceful shutdown (Ctrl+C handler)

**Log locations**:
- Backend: `/workspace/logs/backend.log`
- Frontend: `/workspace/logs/frontend.log`

**Viewing logs**:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
# Or both:
tail -f logs/*.log
```

#### Other Utility Scripts

([hack/](/workspace/hack))

- `generate_frontmatter.sh`: Generate YAML frontmatter for documentation
- `update_changelog.sh`: Update changelog
- `spec_metadata.sh`: Extract specification metadata

## Code References

### Configuration Files

- `/workspace/package.json` - Frontend dependencies and scripts
- `/workspace/grove-backend/package.json` - Backend dependencies and scripts
- `/workspace/vite.config.ts` - Vite build configuration
- `/workspace/grove-backend/tsconfig.json` - TypeScript compiler options
- `/workspace/docker-compose.yml` - Multi-container orchestration
- `/workspace/Dockerfile.dev` - Development container definition
- `/workspace/.env.example` - Frontend environment template
- `/workspace/grove-backend/.env.example` - Backend environment template

### Application Entry Points

- `/workspace/src/main.tsx` - Frontend React application entry
- `/workspace/src/config/env.ts` - Frontend configuration
- `/workspace/grove-backend/src/main.ts:24-96` - Backend NestJS bootstrap

### Database

- `/workspace/grove-backend/prisma/schema.prisma` - Complete database schema (11 tables)
- `/workspace/grove-backend/prisma/seed.ts` - Seed data script
- `/workspace/grove-backend/prisma/migrations/` - Migration history

### Setup Scripts

- `/workspace/dev-start.sh` - All-in-one development startup
- `/workspace/hack/generate_frontmatter.sh` - Documentation frontmatter generator

### Documentation

- `/workspace/README.md` - Project overview and quick start
- `/workspace/QUICKSTART.md` - Integration testing guide
- `/workspace/docs/README.md` - Comprehensive documentation index
- `/workspace/docs/development/architecture.md` - System architecture
- `/workspace/docs/api/specification.md` - API reference

## Architecture Summary

### Technology Stack

**Frontend**:
- React 18 with TypeScript
- Vite (build tool with HMR)
- TailwindCSS (styling)
- Radix UI + shadcn/ui (components)
- React Router (navigation)
- Axios (HTTP client)

**Backend**:
- NestJS (Node.js framework)
- TypeScript
- Prisma ORM
- PostgreSQL 14+ with pgvector extension
- Redis 7+ (BullMQ job queues)
- OpenAI API (text-embedding-3-small)
- Postmark (email delivery)
- Passport.js (authentication)

**Infrastructure**:
- Docker & Docker Compose
- Node.js 20

### System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend      │────▶│    Backend       │────▶│   PostgreSQL     │
│   React/Vite    │     │    NestJS        │     │   + pgvector     │
│   Port 5173     │     │    Port 4000     │     │   Port 5432      │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                               │
                               │
                               ▼
                        ┌──────────────┐
                        │    Redis     │
                        │    BullMQ    │
                        │  Port 6379   │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  OpenAI API  │
                        │  Embeddings  │
                        └──────────────┘
```

### Port Mapping

| Service     | Container Port | Host Port | Description                    |
|-------------|----------------|-----------|--------------------------------|
| Frontend    | 5173          | 5173      | Vite dev server               |
| Backend     | 4000          | 4000      | NestJS API                    |
| PostgreSQL  | 5432          | 5433      | Database with pgvector        |
| Redis       | 6379          | 6379      | Job queue                     |

## Open Questions

1. **Docker installation not available in current environment**: The research was conducted inside a Docker container where Docker CLI is not available. The Docker-related instructions are based on the configuration files and cannot be tested live.

2. **Dockerfile.dev port mismatch**: The Dockerfile exposes port 3000 but Vite is configured to use port 5173. This may be a documentation artifact or intended for a different service.

3. **Postmark email templates**: The research doesn't cover where email templates are defined or how to customize them for development.

4. **OpenAI API fallback**: What happens when OpenAI API is unavailable? Is there a fallback or graceful degradation?

5. **Multi-tenancy testing**: How to test the multi-tenancy features with multiple organizations in development?

## Summary: Quick Start Commands

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd grove-mvp

# Copy environment files
cp .env.example .env
cp grove-backend/.env.example grove-backend/.env

# Edit grove-backend/.env:
# - Set DATABASE_URL with postgres:5432 (container service name)
# - Set REDIS_HOST=redis
# - Generate JWT_SECRET: openssl rand -base64 32
# - Generate ENCRYPTION_KEY: openssl rand -base64 32
# - Add OPENAI_API_KEY (optional for dev)
# - Add POSTMARK_API_KEY (optional for dev)

# Start services
docker compose up -d

# Run inside container (if using grove-dev service)
docker exec -it grove-mvp-dev bash
./dev-start.sh
```

### Option 2: Manual Setup (Local)

```bash
# Prerequisites: PostgreSQL 14+ and Redis 7+ running locally

# Clone repository
git clone <repository-url>
cd grove-mvp

# Copy environment files
cp .env.example .env
cp grove-backend/.env.example grove-backend/.env

# Edit grove-backend/.env:
# - Set DATABASE_URL with localhost:5432
# - Set REDIS_HOST=localhost
# - Generate secrets as above

# Terminal 1: Backend
cd grove-backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed  # Optional: seed test data
npm run start:dev

# Terminal 2: Frontend
npm install
npm run dev

# Optional: Create super admin user
cd grove-backend
npx prisma studio
# Or update directly via SQL:
# psql -h localhost -p 5433 -U postgres -d grove_mvp
# UPDATE "User" SET role = 'super_admin' WHERE email = 'alice@example.com';
```

### Verify Setup

```bash
# Backend health
curl http://localhost:4000/api/health

# PostgreSQL
psql -h localhost -p 5433 -U postgres -d grove_mvp

# Redis
redis-cli -h localhost -p 6379 ping

# Frontend: Open browser
open http://localhost:5173
```

This research provides a complete reference for setting up and running the Grove MVP development environment with all necessary context and troubleshooting guidance.
