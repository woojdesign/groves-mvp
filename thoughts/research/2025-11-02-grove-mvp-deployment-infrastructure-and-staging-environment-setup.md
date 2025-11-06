---
doc_type: research
date: 2025-11-02T15:50:15+00:00
title: "Grove MVP Deployment Infrastructure and Staging Environment Setup"
research_question: "What is the current Grove MVP deployment setup and infrastructure, including environment configuration, external dependencies, build processes, and deployment strategy?"
researcher: Sean Kim

git_commit: ce3dc9cfebae3f4788b1136a64b4b521417989ab
branch: feature/persona-diversity-improvements
repository: workspace

created_by: Sean Kim
last_updated: 2025-11-02
last_updated_by: Sean Kim

tags:
  - deployment
  - infrastructure
  - staging
  - environment
  - docker
  - railway
  - vercel
status: complete

related_docs:
  - /docs/deployment/railway.md
  - /docs/deployment/vercel.md
  - /docs/deployment/security-checklist.md
  - /README.md
  - /QUICKSTART.md
---

# Research: Grove MVP Deployment Infrastructure and Staging Environment Setup

**Date**: 2025-11-02T15:50:15+00:00
**Researcher**: Sean Kim
**Git Commit**: ce3dc9cfebae3f4788b1136a64b4b521417989ab
**Branch**: feature/persona-diversity-improvements
**Repository**: workspace

## Research Question

What is the current Grove MVP deployment setup and infrastructure, including environment configuration, external dependencies, build processes, and deployment strategy?

## Summary

Grove MVP is a monorepo application with a React frontend and NestJS backend, currently configured for local development via Docker Compose. The project has comprehensive deployment documentation for Railway (backend) and Vercel (frontend) but **lacks containerized deployment configurations** (no production Dockerfile or docker-compose.production.yml). The codebase uses environment-based configuration management through NestJS ConfigModule and Vite env variables, with all required environment variables documented in `.env.example`.

**Key Finding**: The project is **deployment-ready for Railway + Vercel** but would need additional Docker configuration files for a containerized staging environment deployment.

## Detailed Findings

### 1. Current Infrastructure Setup

#### Docker Development Environment

**Location**: `/workspace/docker-compose.yml` and `/workspace/Dockerfile.dev`

The project uses Docker Compose for local development with three services:

1. **grove-dev** (main development container)
   - Base image: `node:20-bookworm`
   - Installs Claude Code CLI globally
   - Mounts entire workspace for live code sync
   - Exposes ports 5173 (frontend) and 4000 (backend)
   - Resource limits: 2 CPUs, 4GB memory
   - Location: `/workspace/Dockerfile.dev:1-47`

2. **postgres** (database)
   - Image: `ankane/pgvector:latest`
   - Exposed on host port 5433 (internal 5432)
   - Includes pgvector extension for vector embeddings
   - Named volume: `postgres_data`
   - Location: `/workspace/docker-compose.yml:43-58`

3. **redis** (job queue)
   - Image: `redis:7-alpine`
   - Exposed on host port 6379
   - Named volume: `redis_data`
   - Location: `/workspace/docker-compose.yml:60-71`

#### Development Startup Script

**Location**: `/workspace/dev-start.sh`

Automated startup script that:
- Verifies PostgreSQL and Redis availability
- Installs dependencies if needed
- Runs Prisma migrations (`npx prisma migrate deploy`)
- Starts backend on port 4000
- Starts frontend on port 5173
- Manages logs in `/logs` directory
- Provides cleanup on Ctrl+C
- Location: `/workspace/dev-start.sh:1-152`

**No Production Deployment Containers Found**: The project does not have:
- `Dockerfile` for production backend
- `docker-compose.production.yml` for staging/production
- `.dockerignore` file (only found in node_modules)

### 2. Environment Configuration

#### Backend Environment Variables

**Location**: `/workspace/grove-backend/.env.example`

The backend requires the following environment variables:

**Database** (Required in all environments):
```bash
DATABASE_URL="postgresql://USER:PASS@HOST:5432/grove_mvp?schema=public&sslmode=prefer"
# Production should use sslmode=require
```

**Authentication** (Required):
```bash
JWT_SECRET="min_32_chars_use_openssl_rand_base64_32"
JWT_EXPIRATION="7d"
MAGIC_LINK_EXPIRATION="15m"
MAGIC_LINK_BASE_URL="http://localhost:5173"  # Frontend URL
ENCRYPTION_KEY="use_openssl_rand_base64_32_for_production"  # Field-level encryption
```

**OpenAI Integration** (Required for embeddings):
```bash
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="text-embedding-3-small"
```

**Email Service** (Optional - falls back to logging):
```bash
POSTMARK_API_KEY="your-key-here"
POSTMARK_FROM_EMAIL="hello@commonplace.app"
```

**Redis** (Required for BullMQ job queues):
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

**Application Settings**:
```bash
NODE_ENV="development"  # development | production | staging
PORT="4000"
API_PREFIX="api"
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"  # Comma-separated CORS
AWS_REGION="us-east-1"
```

**Enterprise SSO** (Optional):
```bash
# SAML Configuration
SAML_ENTRY_POINT="https://login.microsoftonline.com/tenant-id/saml2"
SAML_ISSUER="grove-mvp"
SAML_CALLBACK_URL="http://localhost:4000/api/auth/saml/callback"
SAML_CERT="-----BEGIN CERTIFICATE-----..."

# OIDC Configuration
OIDC_ISSUER="https://login.microsoftonline.com/tenant-id/v2.0"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
OIDC_CALLBACK_URL="http://localhost:4000/api/auth/oidc/callback"
OIDC_SCOPE="openid profile email"
```

**Monitoring** (Optional):
```bash
SENTRY_DSN="your-sentry-backend-dsn-here"
```

Location: `/workspace/grove-backend/.env.example:1-60`

#### Frontend Environment Variables

**Location**: Frontend root (no `.env.example` found, but documented in deployment docs)

```bash
VITE_API_URL="http://localhost:4000/api"  # Backend API endpoint
VITE_SENTRY_DSN="your-sentry-frontend-dsn"  # Optional monitoring
```

Note: Vite requires `VITE_` prefix for environment variables to be exposed to the client.

#### Configuration Management Implementation

**Backend**: Uses NestJS `ConfigModule` for centralized configuration
- Global configuration module: `/workspace/grove-backend/src/app.module.ts:26-28`
- ConfigService injected throughout the application
- Examples:
  - Auth configuration: `/workspace/grove-backend/src/auth/auth.module.ts:52-73`
  - Email configuration: `/workspace/grove-backend/src/email/email.service.ts:15-22`
  - Encryption configuration: `/workspace/grove-backend/src/encryption/encryption.service.ts:26-46`
  - Jobs/Redis configuration: `/workspace/grove-backend/src/jobs/jobs.module.ts:12-19`

**Security Validations** (enforced at startup):
- JWT_SECRET must be >= 32 characters
- JWT_SECRET cannot contain "CHANGE_ME" or "your-super-secret"
- ENCRYPTION_KEY must be >= 32 characters for production
- Location: `/workspace/grove-backend/src/auth/auth.module.ts:56-66`

**Frontend**: Uses Vite's `import.meta.env` for environment variables
- Variables must be prefixed with `VITE_`
- Build-time environment variable injection
- Location: `/workspace/vite.config.ts:7-74`

### 3. Database Setup

#### Database Stack

**Primary Database**: PostgreSQL 14+ with pgvector extension
- Docker image: `ankane/pgvector:latest`
- Provides native vector similarity search
- Required for AI-powered matching using OpenAI embeddings
- Location: `/workspace/docker-compose.yml:43-58`

#### Database Schema

**ORM**: Prisma 6.18.0
- Schema location: `/workspace/grove-backend/prisma/schema.prisma`
- 11 tables defined:
  1. `orgs` - Organizations (multi-tenancy)
  2. `users` - User accounts with SSO support
  3. `profiles` - Onboarding data (interests, projects)
  4. `embeddings` - OpenAI vector embeddings (1536 dimensions)
  5. `matches` - Potential matches with similarity scores
  6. `intros` - Double opt-in introduction state machine
  7. `feedback` - Post-intro feedback
  8. `safety_flags` - Reports and moderation
  9. `events` - Audit log
  10. `auth_tokens` - Magic link tokens
  11. `admin_actions` - Admin audit log
- Location: `/workspace/grove-backend/prisma/schema.prisma:1-271`

**Key Schema Features**:
- Multi-tenancy via `orgId` foreign keys
- Soft deletes via `status` fields
- SSO metadata (SAML/OIDC) in `orgs` and `users` tables
- Test data isolation via `isTestData` flags
- Encrypted fields support (for PII compliance)

#### Migration Strategy

**Development**:
```bash
npx prisma migrate dev --name <migration_name>
```
- Creates new migration files
- Applies to local database
- Regenerates Prisma Client

**Production**:
```bash
npx prisma migrate deploy
```
- Applies pending migrations
- No interactive prompts (CI/CD safe)
- Used in Railway deployment
- Location: Documented in `/workspace/grove-backend/README.md:149-164`

**Automated Migration in Production** (Railway recommendation):
```json
// package.json
{
  "scripts": {
    "build": "nest build && npx prisma generate",
    "start:prod": "npx prisma migrate deploy && node dist/main"
  }
}
```
- Runs migrations before starting server
- Deployment fails if migration fails (safe)
- Location: Documented in `/workspace/docs/deployment/railway.md:209-218`

**Migration Management Commands**:
```bash
npx prisma migrate status     # Check migration status
npx prisma migrate reset       # Reset database (deletes all data)
npx prisma generate            # Regenerate Prisma Client
npx prisma studio              # Visual database browser
```

#### Seed Data

**Seed Script**: `/workspace/grove-backend/prisma/seed.ts`
- Creates 1 example organization
- Creates 3 test users with profiles
- Sample interests for testing
- Invoked via: `npm run prisma:seed` or `npx prisma db seed`
- Configuration: `/workspace/grove-backend/package.json:92-94`

#### Staging Environment Considerations

For a staging environment, the deployment plan should address:

1. **Database Provisioning**:
   - Use managed PostgreSQL with pgvector (Railway provides this)
   - Enable SSL connections (`sslmode=require`)
   - Separate database instance from production
   - Connection pooling for performance

2. **Migration Strategy**:
   - Automated migrations on deploy (recommended)
   - OR manual via Railway CLI: `railway run npx prisma migrate deploy`
   - Rollback plan for failed migrations

3. **Seed Data**:
   - Optional staging seed data for testing
   - Mark as test data via `isTestData` flag
   - Regular cleanup of test data

4. **Backup Strategy**:
   - Railway provides automated daily backups
   - Point-in-time recovery available
   - Document restoration procedure

### 4. External Dependencies

#### OpenAI API (Required for Core Functionality)

**Purpose**: Generate semantic embeddings for matching algorithm
- Model: `text-embedding-3-small` (1536 dimensions)
- Configuration: `OPENAI_API_KEY` environment variable
- Usage: Embedding generation job queue
- Cost: ~$0.00002 per 1K tokens
- Service implementation: `/workspace/grove-backend/src/openai/openai.service.ts`

**Staging Environment Notes**:
- Use separate OpenAI API key for staging
- Set usage limits to prevent cost overruns
- Monitor token consumption

#### Postmark Email Service (Optional - Graceful Fallback)

**Purpose**: Transactional email delivery (magic links, match notifications, intros)
- Configuration: `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL`
- Fallback: Logs emails to console if not configured
- Service implementation: `/workspace/grove-backend/src/email/email.service.ts:1-165`

**Email Templates** (Handlebars):
- Magic link authentication
- Match notifications
- Mutual introductions
- Template location: `/workspace/grove-backend/src/email/templates/*.hbs`

**Staging Environment Notes**:
- Use separate Postmark server for staging
- Configure DMARC/SPF/DKIM for staging domain
- Test email delivery end-to-end
- Consider using Postmark's sandbox mode

#### Redis (Required for Job Queues)

**Purpose**: BullMQ job queue for background processing
- Configuration: `REDIS_HOST`, `REDIS_PORT`
- Docker image: `redis:7-alpine`
- Job queues:
  - `embedding-generation` - Process profile embeddings asynchronously
- Configuration: `/workspace/grove-backend/src/jobs/jobs.module.ts:11-20`

**Staging Environment Notes**:
- Railway provides managed Redis
- Use separate Redis instance from production
- Monitor queue depth and processing times
- Set up job failure alerts

#### Sentry Error Tracking (Optional)

**Purpose**: Application monitoring and error tracking
- Configuration: `SENTRY_DSN` (separate for frontend and backend)
- Initialization: `/workspace/grove-backend/src/main.ts:14-20`
- Frontend integration: `@sentry/react` package

**Staging Environment Notes**:
- Create separate Sentry projects for staging
- Lower alert thresholds for staging
- Use Sentry releases for deployment tracking

#### Identity Providers (Optional - Enterprise SSO)

**SAML Support**:
- Strategy: `/workspace/grove-backend/src/auth/strategies/saml.strategy.ts`
- Service: `/workspace/grove-backend/src/auth/saml/saml.service.ts`
- Conditional loading: `/workspace/grove-backend/src/auth/auth.module.ts:29-34`

**OIDC Support**:
- Strategy: `/workspace/grove-backend/src/auth/strategies/oidc.strategy.ts`
- Service: `/workspace/grove-backend/src/auth/oidc/oidc.service.ts`
- Conditional loading: `/workspace/grove-backend/src/auth/auth.module.ts:38-44`

**Staging Environment Notes**:
- Configure test IdP credentials
- Test SSO flow with staging callback URLs
- Document SSO setup for each provider

### 5. Build & Deployment Process

#### Backend Build Process (NestJS)

**Build Command**: `npm run build`
- Framework: NestJS 11.0.1
- Build tool: Nest CLI with TypeScript compiler
- Source: `/workspace/grove-backend/src/`
- Output: `/workspace/grove-backend/dist/`
- Entry point after build: `dist/src/main.js`

**Build Configuration**:
```json
// package.json scripts
{
  "build": "nest build",
  "start:prod": "node dist/src/main"
}
```
Location: `/workspace/grove-backend/package.json:9,14`

**Build includes**:
- TypeScript compilation to JavaScript
- Source maps generation
- Prisma Client generation
- No bundling (uses Node.js module resolution)

**Production Start Command**:
```bash
npm run start:prod  # Runs: node dist/src/main
```
- Listens on `0.0.0.0:${PORT}` (required for containerization)
- Location: `/workspace/grove-backend/src/main.ts:86`

#### Frontend Build Process (Vite)

**Build Command**: `npm run build`
- Framework: React 18.3.1
- Build tool: Vite 6.4.1 with SWC plugin
- Source: `/workspace/src/`
- Output: `/workspace/dist/`
- Configuration: `/workspace/vite.config.ts`

**Build Configuration**:
```json
// package.json scripts
{
  "dev": "vite",
  "build": "vite build"
}
```
Location: `/workspace/package.json:64-65`

**Vite Configuration Highlights**:
- Target: `esnext` (modern browsers)
- Output directory: `dist/`
- Dev server: `0.0.0.0:5173` (Docker compatible)
- Path aliases for imports (e.g., `@/components`)
- Location: `/workspace/vite.config.ts:7-74`

**Production Serving**:
- Static files served from `dist/`
- Requires HTTP server (Vercel handles this automatically)
- SPA routing via `index.html` fallback

#### Current Deployment Architecture (Documented but Not Containerized)

**Frontend Deployment Target**: Vercel
- Deployment guide: `/workspace/docs/deployment/vercel.md`
- Auto-detected framework: Vite
- Build command: `npm run build`
- Output directory: `dist/`
- Environment variables: `VITE_API_URL`, `VITE_SENTRY_DSN`
- Automatic HTTPS and CDN distribution
- Preview deployments for PRs

**Backend Deployment Target**: Railway
- Deployment guide: `/workspace/docs/deployment/railway.md`
- Root directory: `grove-backend/`
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Managed PostgreSQL with pgvector
- Managed Redis
- Automatic HTTPS
- Environment variable management
- CLI available: `@railway/cli`

**Separation of Concerns**:
- Frontend and backend deployed independently
- CORS configuration required (ALLOWED_ORIGINS)
- Stateless backend (scales horizontally)
- CDN-distributed frontend (low latency)

#### No Containerized Production Deployment Found

**Key Gap**: The project does NOT have:
1. Production `Dockerfile` for backend
2. Multi-stage Docker build configuration
3. `docker-compose.production.yml` for orchestration
4. `.dockerignore` for build optimization
5. Container registry configuration

**Implication for Staging Environment**:
- If staging requires containerized deployment, these files need to be created
- Railway deployment does NOT require containers (uses buildpacks)
- Docker-based staging would need:
  - Multi-stage Dockerfile (build + runtime)
  - docker-compose with production settings
  - Secrets management strategy
  - Health check configuration

### 6. Development Setup (Current State)

#### All-in-One Development Script

**Location**: `/workspace/dev-start.sh`

The `dev-start.sh` script provides a turnkey development environment:

1. **Dependency Check**: Verifies PostgreSQL and Redis are ready
2. **Installation**: Installs npm dependencies if missing
3. **Database Setup**: Runs `npx prisma migrate deploy`
4. **Backend Startup**: Launches NestJS in watch mode (port 4000)
5. **Frontend Startup**: Launches Vite dev server (port 5173)
6. **Log Management**: Writes to `/logs/backend.log` and `/logs/frontend.log`
7. **Process Management**: Cleanup on Ctrl+C

**Usage**:
```bash
# Start everything
./dev-start.sh

# Access logs
tail -f logs/backend.log
tail -f logs/frontend.log

# Stop (Ctrl+C in script terminal)
```

Location: `/workspace/dev-start.sh:1-152`

#### Docker Compose Development Environment

**Services**:
- `grove-dev`: Development container with Claude Code CLI
- `postgres`: PostgreSQL 14+ with pgvector
- `redis`: Redis 7 for job queues

**Key Features**:
- Live code sync via volume mounts
- Separate node_modules for container (Linux binaries)
- Named volumes for data persistence
- Resource limits (2 CPU, 4GB memory)
- Health checks for dependencies

**Usage**:
```bash
# Start infrastructure only
docker compose up -d postgres redis

# Start full dev environment
docker compose up -d

# Enter dev container
docker exec -it grove-mvp-dev bash

# Run dev-start.sh inside container
./dev-start.sh
```

Location: `/workspace/docker-compose.yml:1-77`

#### Manual Development Setup (Alternative)

**Prerequisites**:
- Node.js 18+
- PostgreSQL 14+ with pgvector
- Redis 7+

**Backend Setup**:
```bash
cd grove-backend
npm install
cp .env.example .env
# Edit .env with real credentials
npx prisma migrate deploy
npx prisma db seed  # Optional
npm run start:dev
```

**Frontend Setup**:
```bash
npm install
npm run dev
```

**Access Points**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

Location: Documented in `/workspace/QUICKSTART.md:1-126`

### 7. Existing Deployment Documentation

The project has comprehensive deployment documentation in `/workspace/docs/deployment/`:

#### Railway Backend Deployment Guide

**File**: `/workspace/docs/deployment/railway.md`
**Length**: 608 lines
**Coverage**:
- Step-by-step Railway setup
- PostgreSQL provisioning with pgvector
- Redis setup
- Environment variable configuration
- Database migration strategies (3 options)
- Custom domain configuration
- Monitoring and logging
- Troubleshooting guide
- Cost estimates
- Production checklist

**Key Insights**:
- Railway auto-detects monorepo structure (set root to `grove-backend/`)
- Migrations can run automatically on deploy or via Railway CLI
- Railway CLI command `railway run <cmd>` runs locally with Railway env
- Railway CLI command `railway ssh` opens shell in container
- Free tier: $5/month credit (~500 hours)

#### Vercel Frontend Deployment Guide

**File**: `/workspace/docs/deployment/vercel.md`
**Length**: 288 lines
**Coverage**:
- GitHub integration setup
- Build configuration (auto-detected)
- Environment variable setup
- Custom domain configuration
- Preview deployments for PRs
- CORS troubleshooting
- Cost considerations
- Production checklist

**Key Insights**:
- Vercel auto-detects Vite configuration
- Preview deployments automatic for PRs
- Free tier sufficient for MVP (100GB bandwidth)
- Frontend and backend CORS must be aligned

#### Security Checklist

**File**: `/workspace/docs/deployment/security-checklist.md`
**Length**: 422 lines
**Coverage**:
- Environment variable security requirements
- Secret generation commands
- Pre-deployment validation script
- Post-deployment verification
- Secret rotation procedures
- Incident response plan
- Compliance requirements (SOC2, GDPR)

**Critical Security Requirements**:
1. JWT_SECRET must be >= 32 characters (enforced at startup)
2. DATABASE_URL must use `sslmode=require` in production
3. ENCRYPTION_KEY must be >= 32 characters
4. All secrets must be generated via `openssl rand -base64 32`
5. No default values allowed (e.g., "CHANGE_ME")

**Validation Script**: Provided bash script to check all security requirements before deployment (lines 130-243)

#### Additional Documentation

**Deployment Quickstart**: `/workspace/docs/deployment/quickstart.md`
**Vercel Config Explained**: `/workspace/docs/deployment/vercel-config-explained.md`

## Code References

### Configuration Files
- **Docker Compose**: `/workspace/docker-compose.yml` - Development environment orchestration
- **Development Dockerfile**: `/workspace/Dockerfile.dev:1-47` - Claude Code development container
- **Vite Config**: `/workspace/vite.config.ts:7-74` - Frontend build configuration
- **Backend Package**: `/workspace/grove-backend/package.json:1-113` - Build scripts and dependencies
- **Frontend Package**: `/workspace/package.json:1-67` - Frontend dependencies
- **Prisma Schema**: `/workspace/grove-backend/prisma/schema.prisma:1-271` - Database schema with 11 tables

### Environment Configuration
- **Backend Env Example**: `/workspace/grove-backend/.env.example:1-60` - Complete environment variable documentation
- **Config Module Setup**: `/workspace/grove-backend/src/app.module.ts:26-28` - Global configuration
- **Auth Config**: `/workspace/grove-backend/src/auth/auth.module.ts:52-73` - JWT secret validation
- **Encryption Config**: `/workspace/grove-backend/src/encryption/encryption.service.ts:26-46` - Field-level encryption setup

### Application Entry Points
- **Backend Main**: `/workspace/grove-backend/src/main.ts:1-92` - NestJS bootstrap with CORS, security headers
- **Frontend Main**: `/workspace/src/main.tsx` - React app entry point
- **Dev Startup**: `/workspace/dev-start.sh:1-152` - Development environment automation

### External Service Integration
- **OpenAI Service**: `/workspace/grove-backend/src/openai/openai.service.ts` - Embedding generation
- **Email Service**: `/workspace/grove-backend/src/email/email.service.ts:1-165` - Postmark integration
- **Jobs Module**: `/workspace/grove-backend/src/jobs/jobs.module.ts:11-20` - BullMQ Redis configuration
- **SAML Strategy**: `/workspace/grove-backend/src/auth/strategies/saml.strategy.ts` - Enterprise SSO
- **OIDC Strategy**: `/workspace/grove-backend/src/auth/strategies/oidc.strategy.ts` - Enterprise SSO

### Deployment Documentation
- **Railway Guide**: `/workspace/docs/deployment/railway.md:1-608` - Backend deployment
- **Vercel Guide**: `/workspace/docs/deployment/vercel.md:1-288` - Frontend deployment
- **Security Checklist**: `/workspace/docs/deployment/security-checklist.md:1-422` - Security requirements
- **Main README**: `/workspace/README.md:1-193` - Project overview and quick start

## Architecture Documentation

### Current Deployment Architecture (Railway + Vercel)

```
┌─────────────────┐
│   Vercel CDN    │ ← Frontend (React + Vite)
│  Static Hosting │    Build: npm run build
└────────┬────────┘    Output: dist/
         │
         │ HTTPS API Calls
         │ CORS: ALLOWED_ORIGINS
         ▼
┌─────────────────────┐
│  Railway Container  │ ← Backend (NestJS)
│   NestJS Runtime    │    Build: npm run build
│   Port: 4000        │    Start: node dist/src/main
└─────────┬───────────┘
          │
          ├─────────► PostgreSQL + pgvector (Railway managed)
          │           - Port: 5432
          │           - SSL: required
          │           - Backups: automatic
          │
          └─────────► Redis (Railway managed)
                      - Port: 6379
                      - Persistence: RDB
```

**External Services**:
- OpenAI API: Embedding generation
- Postmark: Email delivery
- Sentry: Error tracking (optional)

**Key Characteristics**:
1. **Frontend-Backend Separation**: Independent deployments, no shared infrastructure
2. **Stateless Backend**: Horizontally scalable, session stored in JWT
3. **Managed Services**: Database and Redis fully managed by Railway
4. **CDN Distribution**: Frontend served globally via Vercel CDN
5. **Auto-HTTPS**: Both Railway and Vercel provide SSL certificates
6. **Environment Isolation**: Separate instances for staging/production

### Development Architecture (Docker Compose)

```
┌─────────────────────────────────────┐
│      grove-dev Container            │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  Frontend   │  │   Backend    │ │
│  │  Port: 5173 │  │  Port: 4000  │ │
│  └─────────────┘  └──────┬───────┘ │
└─────────────────────────┼──────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │               │
    ┌──────▼──────┐  ┌───▼─────┐  ┌─────▼─────┐
    │  PostgreSQL │  │  Redis  │  │  Volumes  │
    │  Port: 5433 │  │ Port:   │  │  - postgres│
    │  (pgvector) │  │  6379   │  │  - redis  │
    └─────────────┘  └─────────┘  └───────────┘
```

**Characteristics**:
1. **Single Container**: Both frontend and backend in one dev container
2. **Live Reload**: File changes synced immediately
3. **Data Persistence**: Named volumes for database and Redis
4. **Resource Limits**: 2 CPUs, 4GB memory
5. **Log Aggregation**: Centralized in /logs directory

### Recommended Staging Architecture (Needs Implementation)

For a containerized staging environment, the recommended architecture would be:

```
┌─────────────────────────────────────┐
│     Frontend Container (Nginx)      │ ← Static files from Vite build
│     Port: 80                        │    Multi-stage build: node + nginx
└────────────┬────────────────────────┘
             │
             │ Internal network
             │ No CORS needed (same domain)
             ▼
┌─────────────────────────────────────┐
│      Backend Container (Node)       │ ← NestJS runtime
│     Port: 4000                      │    Multi-stage build: node build + slim runtime
└─────────┬───────────────────────────┘
          │
          ├─────────► PostgreSQL Container (pgvector)
          │           - Port: 5432 (internal)
          │           - Named volume: staging_postgres_data
          │
          └─────────► Redis Container
                      - Port: 6379 (internal)
                      - Named volume: staging_redis_data
```

**Required Files** (not currently present):
1. `Dockerfile.production` for backend (multi-stage build)
2. `frontend.Dockerfile` for frontend (nginx serving)
3. `docker-compose.staging.yml` for orchestration
4. `.dockerignore` to optimize build context
5. Nginx configuration for SPA routing

## Historical Context

No previous deployment research documents found in `/workspace/thoughts/` directory. This is the first comprehensive deployment infrastructure analysis.

**Related Research**:
- **Authentication**: `/workspace/thoughts/research/2025-10-24-authentication-authorization-and-security-implementation.md` - Security implementation details
- **Architecture**: `/workspace/thoughts/research/2025-10-24-grove-mvp-architecture-and-core-infrastructure.md` - System architecture overview
- **Development Setup**: `/workspace/thoughts/research/2025-10-30-grove-development-environment-setup-and-quickstart-guide.md` - Local dev environment

## Recommended Deployment Approach for Staging

Based on the existing infrastructure and documentation, here are the recommended approaches for staging deployment:

### Option 1: Railway + Vercel (Recommended - Matches Production)

**Pros**:
- Matches production architecture (staging = prod clone)
- No additional Docker configuration needed
- Managed services (PostgreSQL, Redis)
- Free tier sufficient for staging
- Existing documentation fully applies
- Railway CLI for easy management

**Cons**:
- Requires Railway account
- Two separate deployment pipelines

**Setup Steps**:
1. Create new Railway project for staging
2. Deploy backend from `grove-backend/` directory
3. Add PostgreSQL and Redis services
4. Install pgvector extension
5. Configure environment variables (staging values)
6. Run migrations: `railway run npx prisma migrate deploy`
7. Create Vercel project for staging frontend
8. Configure `VITE_API_URL` to point to Railway staging backend
9. Update backend `ALLOWED_ORIGINS` to include Vercel staging domain

**Cost**: ~$5-10/month (within Railway free tier)

### Option 2: Docker Compose Staging (Requires New Configuration)

**Pros**:
- Full containerization
- Easy to tear down and recreate
- Can run on any Docker host
- Single deployment unit
- Good for testing deployment changes

**Cons**:
- Requires creating production Docker configuration (not present)
- Manual SSL certificate management
- Need to manage host infrastructure
- No automatic scaling

**Required New Files**:
1. **Backend Dockerfile**:
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["npx", "prisma", "migrate", "deploy", "&&", "node", "dist/src/main"]
```

2. **Frontend Dockerfile**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

3. **docker-compose.staging.yml**:
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: frontend.Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:4000/api
    depends_on:
      - backend

  backend:
    build:
      context: ./grove-backend
      dockerfile: ../Dockerfile.production
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/grove_staging
      - REDIS_HOST=redis
      - NODE_ENV=staging
      # ... other env vars from .env.staging
    depends_on:
      - postgres
      - redis

  postgres:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: grove_staging
    volumes:
      - staging_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - staging_redis_data:/data

volumes:
  staging_postgres_data:
  staging_redis_data:
```

4. **nginx.conf** (for SPA routing):
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

5. **.dockerignore**:
```
node_modules
dist
.env
.env.*
logs
*.log
.git
.github
thoughts
docs
README.md
```

**Setup Steps**:
1. Create all required Docker configuration files
2. Create `.env.staging` with staging credentials
3. Build: `docker compose -f docker-compose.staging.yml build`
4. Start: `docker compose -f docker-compose.staging.yml up -d`
5. Check health: `curl http://localhost:4000/api/health`
6. Access frontend: `http://localhost`

**Cost**: $0 (runs on existing infrastructure)

### Option 3: Hybrid Approach

**Configuration**:
- Backend: Railway (managed services)
- Frontend: Docker on staging server (custom builds)

**Pros**:
- Backend benefits from managed services
- Frontend has full Docker control
- Isolated backend testing

**Cons**:
- Split deployment complexity
- Need to manage frontend server

## Open Questions

1. **Staging Environment Target**:
   - Where will staging be hosted? (Railway, AWS, on-premises Docker host?)
   - What are the infrastructure constraints?

2. **Staging Data Strategy**:
   - Should staging have production data snapshot?
   - How to handle seed data and test users?
   - Data refresh frequency?

3. **Deployment Pipeline**:
   - Manual deployments or CI/CD automation?
   - Which git branch triggers staging deployments?
   - Approval process for staging releases?

4. **SSL/TLS Requirements**:
   - Custom domain for staging? (e.g., `staging.grove.com`)
   - Let's Encrypt or purchased certificate?
   - Certificate management strategy?

5. **Cost Constraints**:
   - Budget for staging infrastructure?
   - Should staging share resources with production?
   - Acceptable downtime for staging?

6. **Monitoring and Observability**:
   - Separate Sentry project for staging?
   - Log aggregation solution?
   - Alerting for staging errors?

7. **Access Control**:
   - Who should have access to staging environment?
   - How to secure staging from public access?
   - VPN or IP whitelist required?

8. **Container Registry**:
   - If using Docker, where to store images? (Docker Hub, AWS ECR, GitHub Registry?)
   - Private or public registry?
   - Image versioning strategy?

## Next Steps for Staging Deployment

Based on the research findings, recommended next steps:

1. **Decision Phase**:
   - Choose deployment approach (Railway+Vercel vs Docker Compose vs Hybrid)
   - Define staging infrastructure requirements
   - Determine budget and hosting constraints

2. **If Railway + Vercel (Recommended)**:
   - Create Railway staging project
   - Follow existing deployment documentation
   - Configure staging-specific environment variables
   - Set up preview deployments for testing

3. **If Docker Compose**:
   - Create production Dockerfile for backend
   - Create frontend Dockerfile with nginx
   - Create docker-compose.staging.yml
   - Create .dockerignore for build optimization
   - Test build process locally
   - Document deployment procedure

4. **Common Tasks**:
   - Generate strong secrets for staging (JWT_SECRET, ENCRYPTION_KEY)
   - Create staging OpenAI API key with usage limits
   - Set up Postmark staging server
   - Create Sentry staging projects
   - Configure staging database seed data
   - Document staging access procedures
   - Set up monitoring and alerting
   - Create staging deployment runbook

5. **Testing**:
   - Verify all environment variables are set
   - Test database migrations
   - Test Redis job queues
   - Test email delivery
   - Test SSO flows (if applicable)
   - Load test with realistic traffic
   - Document any deployment issues

## Conclusion

Grove MVP has a well-documented and production-ready deployment strategy for Railway (backend) and Vercel (frontend), but lacks containerized deployment configuration for staging environments. The codebase is structured for easy deployment with comprehensive environment variable management and automated migration strategies.

**For staging deployment**, the recommended approach is to **replicate the production architecture** using Railway + Vercel, as this provides managed services, matches production behavior, and requires no additional Docker configuration. This approach is covered by existing documentation and has a clear path to production parity.

**Alternative Docker-based staging** would require creating production Dockerfiles, docker-compose configuration, and nginx setup, which are not currently present in the codebase but would follow standard Node.js and Vite best practices.

All environment variables are documented, external dependencies are clearly identified, and the build processes are straightforward, making Grove MVP ready for staging deployment once the infrastructure decision is made.
