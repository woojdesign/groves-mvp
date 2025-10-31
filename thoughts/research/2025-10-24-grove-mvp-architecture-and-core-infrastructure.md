---
doc_type: research
date: 2025-10-24T21:24:00+00:00
title: "Grove MVP Architecture and Core Infrastructure"
research_question: "What is the overall architecture and core infrastructure of this codebase?"
researcher: Sean Kim

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-24
last_updated_by: Sean Kim

tags:
  - architecture
  - infrastructure
  - nestjs
  - react
  - prisma
  - postgresql
  - docker
  - technology-stack
status: complete

related_docs: []
---

# Research: Grove MVP Architecture and Core Infrastructure

**Date**: October 24, 2025 21:24 UTC
**Researcher**: Sean Kim
**Git Commit**: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
**Branch**: main
**Repository**: workspace

## Research Question

What is the overall architecture and core infrastructure of this codebase? Specifically:
1. Project structure and technology stack
2. Application architecture patterns
3. Infrastructure and deployment setup
4. Database layer and data access patterns

## Summary

Grove MVP is a **full-stack TypeScript application** built for connecting people within organizations based on niche interests using AI-powered semantic matching. The architecture follows a **modern microservices-ready pattern** with clear separation between frontend (React + Vite), backend (NestJS), and infrastructure (PostgreSQL with pgvector + Redis).

**Key Architectural Characteristics**:
- **Frontend**: React 18 + TypeScript, Vite build tool, React Router, TailwindCSS + Radix UI components
- **Backend**: NestJS (Node.js framework), modular architecture with 14 feature modules
- **Database**: PostgreSQL 14+ with pgvector extension for vector similarity search, Prisma ORM
- **Infrastructure**: Docker Compose for local development, containerized services
- **Security**: Multi-layered security with JWT auth, CSRF protection, rate limiting, field-level encryption
- **Enterprise Features**: Multi-tenancy, SSO support (SAML + OIDC), RBAC, GDPR compliance

The application is designed to be **SOC2-ready** with comprehensive audit logging, tenant isolation, and privacy-first architecture.

## Detailed Findings

### 1. Project Structure & Technology Stack

#### Root Directory Structure

```
grove-mvp/
├── src/                      # Frontend React application
├── grove-backend/            # Backend NestJS API
├── docs/                     # Comprehensive documentation
├── thoughts/                 # Development research and plans
├── hack/                     # Utility scripts
├── docker-compose.yml        # Multi-container orchestration
├── dev-start.sh              # All-in-one development startup
├── package.json              # Frontend dependencies
└── vite.config.ts            # Frontend build configuration
```

#### Frontend Technology Stack

**Core Framework** (`/workspace/package.json:1-67`):
- **React 18.3.1** with TypeScript
- **Vite 6.4.1** as build tool with SWC plugin for Fast Refresh
- **React Router 7.9.4** for client-side routing
- **Axios 1.12.2** for HTTP requests with CSRF protection

**UI Framework** (`/workspace/package.json:6-53`):
- **Radix UI** - 26 primitive components for accessible UI (accordion, dialog, dropdown, etc.)
- **TailwindCSS 3.4.18** for utility-first styling
- **shadcn/ui** pattern (component library built on Radix)
- **Lucide React 0.487.0** for icons
- **next-themes 0.4.6** for theme management
- **Sonner 2.0.3** for toast notifications

**State & Forms**:
- **React Hook Form 7.55.0** for form validation
- **class-variance-authority 0.7.1** for component variants

**Error Tracking**:
- **Sentry React 10.21.0** for production error monitoring (`/workspace/src/main.tsx:25-38`)

**Build Configuration** (`/workspace/vite.config.ts:1-74`):
- Port 5173 for dev server, binds to 0.0.0.0 for Docker compatibility
- Absolute imports using `@/` prefix
- ESNext target for modern browsers
- Extensive Radix UI package aliases for version resolution

#### Backend Technology Stack

**Core Framework** (`/workspace/grove-backend/package.json:22-56`):
- **NestJS 11.0.1** - Enterprise Node.js framework
- **TypeScript 5.7.3** with decorators enabled
- **Node 20-bookworm** runtime (from Dockerfile.dev)

**Database & ORM**:
- **Prisma 6.18.0** - Type-safe ORM with schema-first approach
- **PostgreSQL 14+** with **pgvector** extension for vector similarity
- **bcrypt 6.0.0** for password hashing

**Authentication & Security**:
- **@nestjs/passport 11.0.5** + **passport 0.7.0** for auth strategies
- **@nestjs/jwt 11.0.1** + **passport-jwt 4.0.1** for JWT tokens
- **passport-saml 3.2.4** for SAML SSO
- **passport-openidconnect 0.1.2** + **openid-client 6.8.1** for OIDC SSO
- **@nestjs/throttler 6.4.0** for rate limiting

**Background Jobs & Queue**:
- **BullMQ 5.61.0** + **@nestjs/bull 11.0.4** for job queues
- **ioredis 5.8.2** for Redis client
- **Redis 7** for queue storage

**AI & Embeddings**:
- **openai 6.6.0** for generating text embeddings (text-embedding-3-small model)

**Email**:
- **postmark 4.0.5** for transactional email delivery
- **handlebars 4.7.8** for email templates

**Monitoring**:
- **@nestjs/terminus 11.0.0** for health checks
- **@sentry/node 10.21.0** for error tracking

**Validation**:
- **class-validator 0.14.2** + **class-transformer 0.5.1** for DTO validation

### 2. Application Architecture

#### Frontend Architecture

**Entry Point** (`/workspace/src/main.tsx:1-100`):
- React 18 with `createRoot` API
- Sentry initialization for production error tracking (lines 25-38)
- CSRF token initialization before app render (line 41)
- React Router with BrowserRouter for routing

**Routing Structure** (`/workspace/src/main.tsx:44-94`):
- **Public Routes**: `/` (Welcome), `/auth/verify` (AuthCallback)
- **Protected Routes**: `/onboarding`, `/matching`, `/dashboard` (wrapped in ProtectedRoute)
- **Admin Routes**: `/admin/*` (nested routes with AdminLayout and AdminRoute guard)
- **Showcase Routes**: `/showcase/listen`, `/showcase/learn`, `/showcase/connect`
- **Legacy Route**: `/dev` (backward compatibility)

**Component Organization** (`/workspace/src`):
- `/admin/*` - Admin dashboard components and pages (6 subdirectories)
- `/components/*` - Main UI components (13 subdirectories including ui/ for shadcn components)
- `/lib/*` - Utility functions and API client
  - `api.ts` - Axios instance with CSRF protection and auth interceptors
  - `apiService.ts` - High-level API methods
  - `utils.ts` - Utility functions
  - `animations.ts` - Animation helpers
- `/config/*` - Environment configuration
- `/types/*` - TypeScript type definitions
- `/styles/*` - CSS modules and global styles

**API Client Architecture** (`/workspace/src/lib/api.ts:1-109`):
- Axios instance with `withCredentials: true` for httpOnly cookies (line 18)
- CSRF token management (lines 32-48): fetched on init, stored in memory, added to non-GET requests
- Request interceptor adds `X-CSRF-Token` header (lines 54-68)
- Response interceptor handles 401 (redirect to login) and 403 (CSRF retry) (lines 74-102)
- Base URL from environment config: `http://localhost:4000/api`

#### Backend Architecture

**Bootstrap & Configuration** (`/workspace/grove-backend/src/main.ts:1-93`):
- **Port**: 4000, binds to 0.0.0.0 for Docker (line 87)
- **API Prefix**: `/api` (default) (line 84)
- **Sentry**: Initialized for production error tracking (lines 15-21)

**Security Middleware Stack** (`/workspace/grove-backend/src/main.ts:26-82`):
- **CORS**: Strict origin validation with credentials support (lines 26-51)
- **Security Headers**: Applied via SecurityHeadersMiddleware (line 54)
- **Request Logging**: RequestLoggerMiddleware for audit trail (line 57)
- **Tenant Context**: TenantContextMiddleware for multi-tenancy (line 60)
- **Validation**: Global ValidationPipe with whitelist and transform (lines 63-68)
- **Exception Filters**: PrismaExceptionFilter → GlobalExceptionFilter (lines 71-74)
- **Global Guards**: JwtAuthGuard → CsrfGuard (line 78)
- **Global Interceptors**: OrgFilterInterceptor for tenant isolation (line 81)

**Module Organization** (`/workspace/grove-backend/src/app.module.ts:1-58`):

The application follows a **modular monolith** architecture with 14 feature modules:

1. **ConfigModule** - Global environment configuration (lines 22-25)
2. **EncryptionModule** - Field-level encryption for sensitive data (line 26)
3. **ThrottlerModule** - Rate limiting (100 req/min) (lines 27-32)
4. **PrismaModule** - Database connection and ORM (line 33)
5. **HealthModule** - Health check endpoints (line 34)
6. **AuthModule** - Authentication (magic link, JWT, SSO) (line 35)
7. **EmailModule** - Transactional email delivery (line 36)
8. **JobsModule** - Background job processing with BullMQ (line 37)
9. **ProfilesModule** - User profile management (line 38)
10. **MatchingModule** - AI-powered matching engine (line 39)
11. **IntrosModule** - Double opt-in introduction flow (line 40)
12. **AdminModule** - Admin dashboard and management (line 41)
13. **GdprModule** - Data privacy and compliance (line 42)
14. **OpenAIModule** - (not imported but exists) AI integration

**Global Providers** (`/workspace/grove-backend/src/app.module.ts:45-54`):
- **ThrottlerGuard** - Applied to all routes (lines 47-50)
- **RolesGuard** - RBAC enforcement (lines 51-54)

**Architectural Patterns**:
- **Dependency Injection**: NestJS DI container manages all services
- **Modular Design**: Each feature is self-contained with module, controller, service, DTOs
- **Guards**: JwtAuthGuard, CsrfGuard, RolesGuard for security
- **Interceptors**: OrgFilterInterceptor for automatic tenant filtering
- **Filters**: Custom exception filters for error handling
- **Middleware**: Request logging, security headers, tenant context

### 3. Infrastructure & Deployment

#### Docker Configuration

**Multi-Container Setup** (`/workspace/docker-compose.yml:1-77`):

**Service 1: grove-dev** (lines 2-41)
- Base image: Custom Dockerfile.dev with Node 20 + Claude Code CLI
- Ports: 5173 (frontend), 4000 (backend)
- Volumes:
  - Project directory mounted at `/workspace`
  - `node_modules` excluded to preserve container's native modules
  - Named volume `claude-home` for Claude auth persistence
- Resource limits: 2 CPUs, 4GB RAM
- Depends on: postgres, redis

**Service 2: postgres** (lines 43-58)
- Image: `ankane/pgvector:latest` (PostgreSQL with pgvector extension)
- Port: 5433 (host) → 5432 (container)
- Database: `grove_mvp`, user: `postgres`, password: `postgres`
- Volume: `postgres_data` for data persistence
- Health check: `pg_isready` every 10s

**Service 3: redis** (lines 60-71)
- Image: `redis:7-alpine`
- Port: 6379 (exposed to host)
- Volume: `redis_data` for persistence
- Health check: `redis-cli ping` every 10s

**Development Container** (`/workspace/Dockerfile.dev:1-47`):
- Base: `node:20-bookworm` (line 4)
- Installs: Claude Code CLI, git, postgresql-client, redis-tools, netcat (lines 7-17)
- Working directory: `/workspace` (line 20)
- Runs as: `node` user (UID 1000) for security (line 36)
- Exposes: Port 3000 (Vite) (line 42)

**Development Startup Script** (`/workspace/dev-start.sh:1-152`):
- **Health Checks**: Waits for PostgreSQL and Redis readiness (lines 34-47)
- **Dependency Installation**: npm install for frontend and backend if needed (lines 54-62)
- **Database Migrations**: `prisma generate` + `prisma migrate deploy` (lines 65-70)
- **Backend Startup**: `npm run start:dev` on port 4000, logs to `logs/backend.log` (lines 82-95)
- **Frontend Startup**: `npm run dev` on port 5173, logs to `logs/frontend.log` (lines 98-109)
- **Process Management**: Trap Ctrl+C for graceful shutdown (lines 137-143)
- **Log Streaming**: Tails both frontend and backend logs (line 148)

#### Environment Configuration

**Frontend Environment** (`/workspace/.env.example:1-11`):
- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:4000/api`)
- `VITE_SENTRY_DSN`: Sentry error tracking DSN (optional, production only)

**Backend Environment** (`/workspace/grove-backend/.env.example:1-60`):

**Database** (line 2):
- `DATABASE_URL`: PostgreSQL connection string with pgvector support

**Authentication** (lines 4-10):
- `JWT_SECRET`: 32+ character secret for token signing
- `JWT_EXPIRATION`: Token lifetime (default: 7 days)
- `MAGIC_LINK_EXPIRATION`: Magic link validity (default: 15 minutes)
- `MAGIC_LINK_BASE_URL`: Frontend URL for magic links

**AI Integration** (lines 12-14):
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `OPENAI_MODEL`: Embedding model (default: text-embedding-3-small)

**Email** (lines 16-18):
- `POSTMARK_API_KEY`: Postmark API key (optional in dev)
- `POSTMARK_FROM_EMAIL`: Sender email address

**Queue & Cache** (lines 20-22):
- `REDIS_HOST`: Redis hostname (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)

**Application** (lines 24-27):
- `NODE_ENV`: Environment (development/production)
- `PORT`: Backend API port (default: 4000)
- `API_PREFIX`: API route prefix (default: api)

**CORS** (lines 29-33):
- `FRONTEND_URL`: Primary frontend URL
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

**Enterprise SSO** (lines 38-49):
- SAML configuration (lines 38-42): Entry point, issuer, callback URL, certificate
- OIDC configuration (lines 44-49): Issuer, client credentials, callback URL, scope

**Security** (lines 51-55):
- `ENCRYPTION_KEY`: Field-level encryption key (32+ characters)
- `SENTRY_DSN`: Sentry error tracking DSN (optional, production only)

#### Build Processes

**Frontend Build** (`/workspace/package.json:63-66`):
- `npm run dev`: Vite dev server with HMR
- `npm run build`: Production build to `/dist`

**Backend Build** (`/workspace/grove-backend/package.json:8-20`):
- `npm run build`: NestJS compilation to `/dist`
- `npm run start:dev`: Watch mode with auto-reload
- `npm run start:prod`: Production mode (runs compiled JS)

**TypeScript Configuration** (`/workspace/grove-backend/tsconfig.json:1-26`):
- Module: nodenext (ESM + CJS interop)
- Target: ES2023
- Decorators: Enabled (required for NestJS)
- Output: `./dist`

### 4. Database Layer

#### Prisma Schema Overview

**Configuration** (`/workspace/grove-backend/prisma/schema.prisma:4-11`):
- Generator: `prisma-client-js` for type-safe database client
- Datasource: PostgreSQL with connection from `DATABASE_URL`

**Database Models** (11 total tables):

**1. Org (Organizations)** (`/workspace/grove-backend/prisma/schema.prisma:16-38`):
- Multi-tenancy foundation: `domain` is unique identifier
- SSO configuration: SAML and OIDC settings (lines 23-30)
- Fields: id, name, domain, status, ssoEnabled, ssoProvider, samlMetadataUrl, samlEntityId, oidcIssuer, oidcClientId, oidcClientSecret (encrypted), ssoMetadata
- Relations: One-to-many with Users

**2. User** (`/workspace/grove-backend/prisma/schema.prisma:43-75`):
- Core identity: email (unique), name, orgId (foreign key)
- Status tracking: status (active/paused/deleted), role (user/org_admin/super_admin)
- SSO fields: ssoProvider, ssoSubject (IdP user ID), ssoMetadata
- Relations: Belongs to Org, has Profile, Embedding, Matches, Feedback, SafetyFlags, Events
- Indexes: orgId, email, status, (ssoProvider, ssoSubject) for query performance

**3. Profile** (`/workspace/grove-backend/prisma/schema.prisma:80-94`):
- Onboarding data: nicheInterest (Text), project (Text), connectionType, rabbitHole (Text), preferences (Text)
- One-to-one with User via userId (unique)

**4. Embedding** (`/workspace/grove-backend/prisma/schema.prisma:99-112`):
- AI vector storage: userId (unique), interestsText (Text)
- Vector column added via raw SQL migration (line 109): `embedding vector(1536)` for pgvector
- One-to-one with User

**5. Match** (`/workspace/grove-backend/prisma/schema.prisma:117-138`):
- Matching results: userAId, userBId, similarityScore (Float), sharedInterest, context (Text)
- Status: pending/accepted/rejected/expired
- Expiration: expiresAt (DateTime)
- Relations: Two Users (userA, userB), one Intro
- Indexes: userAId, userBId, status
- Unique constraint: (userAId, userBId) to prevent duplicate matches

**6. Intro (Double Opt-In State Machine)** (`/workspace/grove-backend/prisma/schema.prisma:143-158`):
- State tracking: userAStatus, userBStatus (pending/accepted/passed), status (pending/accepted_by_a/accepted_by_b/mutual/rejected/expired)
- One-to-one with Match via matchId (unique)
- Relations: Has Feedback
- Index: status for filtering

**7. Feedback** (`/workspace/grove-backend/prisma/schema.prisma:163-178`):
- Post-intro feedback: introId, userId, didMeet (yes/scheduled/no), helpful (Boolean), note (Text)
- Relations: Belongs to Intro and User
- Indexes: introId, userId

**8. SafetyFlag (Reports & Moderation)** (`/workspace/grove-backend/prisma/schema.prisma:183-202`):
- Reporting: reporterId, reportedId, matchId (optional), reason, comment (Text)
- Moderation: status (pending/reviewed/actioned/dismissed), actionTaken (warning/strike/ban/none)
- Audit: reviewedAt, reviewedBy
- Relations: Reporter and Reported users
- Indexes: reportedId, status

**9. Event (Audit Log)** (`/workspace/grove-backend/prisma/schema.prisma:207-222`):
- Event tracking: userId (optional), eventType, metadata (JSON)
- Security: ipAddress, userAgent (Text)
- Relations: Belongs to User (optional, cascades to SetNull)
- Indexes: userId, eventType, createdAt for analytics

**10. AuthToken (Magic Links)** (`/workspace/grove-backend/prisma/schema.prisma:227-239`):
- Magic link tokens: email, token (unique), expiresAt, used (Boolean)
- Indexes: token, email, expiresAt for fast lookup

**11. AdminAction (RBAC & Audit)** (`/workspace/grove-backend/prisma/schema.prisma:244-261`):
- Admin audit trail: adminId, action, targetType, targetId, orgId
- Metadata: JSON for flexible data storage
- Security: ipAddress, userAgent (Text)
- Indexes: adminId, orgId, action, createdAt

**Key Database Features**:
- **pgvector Extension**: Enables vector similarity search for AI matching
- **Multi-Tenancy**: Organization isolation via orgId foreign keys
- **Audit Trail**: Events and AdminActions for compliance
- **Soft Deletes**: User status field instead of hard deletes
- **Cascade Deletes**: Proper cleanup of related records
- **Indexes**: Strategic indexes for query performance
- **JSON Fields**: Flexible metadata storage (ssoMetadata, metadata)

#### Prisma Service

**Module Structure** (`/workspace/grove-backend/src/prisma`):
- `prisma.module.ts` - Exports PrismaService globally
- `prisma.service.ts` - Database connection lifecycle management
- `prisma.config.ts.backup` - Legacy configuration

**Migrations** (`/workspace/grove-backend/prisma/migrations`):
- Migration history stored in directory (6 subdirectories based on ls output)
- Migrations managed via `npx prisma migrate deploy`
- Seed data available in `seed.ts` (3192 bytes)

**Data Access Patterns**:
- **Type-Safe Queries**: Prisma Client generates types from schema
- **Relation Loading**: Automatic joins for related data
- **Transaction Support**: Prisma transactions for atomic operations
- **Connection Pooling**: Managed by Prisma Client
- **Query Optimization**: Generated queries optimized for PostgreSQL

### 5. Authentication & Security Architecture

**Auth Module Structure** (`/workspace/grove-backend/src/auth`):
- `auth.controller.ts` - Auth endpoints (login, callback, CSRF token)
- `auth.service.ts` - Auth business logic (7300 bytes)
- `auth.config.ts` - Auth configuration
- `dto/` - Data transfer objects for validation (5 subdirectories)
- `guards/` - Auth guards (JwtAuthGuard, etc.)
- `strategies/` - Passport strategies (5 subdirectories: JWT, magic link, SAML, OIDC)
- `saml/` - SAML SSO implementation (4 subdirectories)
- `oidc/` - OIDC SSO implementation (4 subdirectories)

**Authentication Flows**:
1. **Magic Link**: Email-based passwordless auth with time-limited tokens
2. **JWT**: Token-based session management with httpOnly cookies
3. **SAML**: Enterprise SSO for organizations (Azure AD, Okta, etc.)
4. **OIDC**: OpenID Connect for modern identity providers

**Security Layers**:

**Layer 1: CORS** (`/workspace/grove-backend/src/main.ts:26-51`):
- Strict origin validation against ALLOWED_ORIGINS
- Credentials enabled for cookies
- Specific methods and headers allowed

**Layer 2: Security Headers** (`/workspace/grove-backend/src/main.ts:54`):
- Applied via SecurityHeadersMiddleware
- Protects against XSS, clickjacking, etc.

**Layer 3: Request Logging** (`/workspace/grove-backend/src/main.ts:57`):
- RequestLoggerMiddleware logs all requests for audit trail

**Layer 4: Tenant Context** (`/workspace/grove-backend/src/main.ts:60`):
- TenantContextMiddleware extracts and validates orgId from JWT
- Enables automatic tenant isolation

**Layer 5: Rate Limiting** (`/workspace/grove-backend/src/app.module.ts:27-32`):
- ThrottlerModule: 100 requests per 60 seconds per IP
- Applied globally via APP_GUARD

**Layer 6: Input Validation** (`/workspace/grove-backend/src/main.ts:63-68`):
- ValidationPipe validates all DTOs using class-validator
- Whitelist mode strips unknown properties
- Transform mode converts types automatically

**Layer 7: Authentication** (`/workspace/grove-backend/src/main.ts:78`):
- JwtAuthGuard enforces JWT token presence on protected routes
- Uses @Public() decorator to opt-out

**Layer 8: CSRF Protection** (`/workspace/grove-backend/src/main.ts:78`):
- CsrfGuard validates CSRF token on state-changing requests
- Token fetched via `/auth/csrf-token` and stored in frontend

**Layer 9: Authorization** (`/workspace/grove-backend/src/app.module.ts:51-54`):
- RolesGuard enforces RBAC (user/org_admin/super_admin)
- Uses @Roles() decorator for role requirements

**Layer 10: Tenant Filtering** (`/workspace/grove-backend/src/main.ts:81`):
- OrgFilterInterceptor automatically filters queries by orgId
- Prevents data leakage across organizations

**Encryption Module** (`/workspace/grove-backend/src/encryption`):
- Field-level encryption for sensitive data (SSO secrets, etc.)
- Uses AES-256-GCM encryption
- Key managed via ENCRYPTION_KEY environment variable

### 6. Core Features Implementation

#### Matching Engine

**Module Structure** (`/workspace/grove-backend/src/matching`):
- `matching.controller.ts` - Match endpoints (2128 bytes)
- `matching.service.ts` - Matching business logic (11510 bytes - main orchestration)
- `matching.module.ts` - Module configuration (2213 bytes)
- `dto/` - Request/response DTOs (5 subdirectories)
- `engines/` - Matching engine implementations (5 subdirectories)
- `strategies/` - Matching strategies (6 subdirectories)
- `interfaces/` - TypeScript interfaces (7 subdirectories)
- `__tests__/` - Test suite (7 subdirectories)

**Matching Algorithm**:
1. **Profile Embedding**: Generate vector embedding from user's niche interest + project + preferences
2. **Vector Search**: Query pgvector for similar users using cosine similarity
3. **Filtering**: Exclude same-org constraints, previous matches, blocked users
4. **Scoring**: Combine similarity score with additional factors (shared interests, connection type alignment)
5. **Ranking**: Sort by final score and select top N matches
6. **Context Generation**: Use AI to generate introduction context explaining the match

#### Embeddings Generation

**Module Structure** (`/workspace/grove-backend/src/embeddings`):
- `embeddings.service.ts` - Embedding generation logic (3377 bytes)
- `embeddings.module.ts` - Module configuration (295 bytes)
- `embeddings.service.spec.ts` - Test suite (4384 bytes)

**OpenAI Integration** (`/workspace/grove-backend/src/openai`):
- OpenAI client wrapper for API calls
- Uses `text-embedding-3-small` model (1536 dimensions)
- Generates semantic embeddings from text input

**Embedding Flow**:
1. **Profile Complete**: User completes onboarding form
2. **Text Concatenation**: Combine nicheInterest + project + rabbitHole + preferences
3. **API Call**: Send to OpenAI embeddings API
4. **Vector Storage**: Store 1536-dimension vector in `embeddings.embedding` column (pgvector)
5. **Index Creation**: pgvector creates index for fast similarity search

#### Double Opt-In Introduction Flow

**Module Structure** (`/workspace/grove-backend/src/intros`):
- `intros.controller.ts` - Intro endpoints (931 bytes)
- `intros.service.ts` - Introduction business logic (4977 bytes)
- `intros.module.ts` - Module configuration (432 bytes)
- `dto/` - Request/response DTOs (5 subdirectories)
- `intros.service.spec.ts` - Test suite (4680 bytes)

**State Machine**:
1. **Match Created**: Match status = "pending", Intro created with both users "pending"
2. **User A Accepts**: userAStatus = "accepted", status = "accepted_by_a"
3. **User B Accepts**: userBStatus = "accepted", status = "mutual" → **Introduction Made**
4. **User A/B Passes**: userAStatus/userBStatus = "passed", status = "rejected"
5. **Expiration**: If no action within expiration window, status = "expired"

**Introduction Flow**:
1. User receives match notification (email)
2. User views match details in dashboard
3. User clicks "Connect" or "Pass"
4. If both users click "Connect" → Email sent with contact info
5. Users meet and provide feedback

#### Profile Onboarding

**Module Structure** (`/workspace/grove-backend/src/profiles`):
- User profile CRUD operations
- Validation of profile data
- Integration with embeddings generation
- Profile update triggers re-matching

#### Job Queues & Background Processing

**Module Structure** (`/workspace/grove-backend/src/jobs`):
- BullMQ integration for async job processing
- Redis as queue storage
- Job types:
  - Embedding generation (async after profile save)
  - Match computation (scheduled or triggered)
  - Email sending (async to prevent blocking)
  - Periodic cleanup (expired tokens, matches)

**Queue Configuration**:
- Redis connection via `REDIS_HOST` and `REDIS_PORT`
- Retry logic for failed jobs
- Job status tracking
- Graceful shutdown handling

#### Email Notifications

**Module Structure** (`/workspace/grove-backend/src/email`):
- `email.module.ts` - Email service configuration (7 subdirectories in module)
- Postmark integration for transactional emails
- Handlebars templates for email content
- Email types:
  - Magic link authentication
  - Match notification
  - Introduction confirmation
  - Feedback request

#### Admin Capabilities

**Module Structure** (`/workspace/grove-backend/src/admin`):
- `admin.module.ts` - Admin module configuration (7 subdirectories)
- RBAC enforcement (org_admin, super_admin roles)
- Admin actions:
  - User management (CRUD)
  - Organization settings
  - Safety flag review and moderation
  - Audit log viewing
  - Match management

**Frontend Admin** (`/workspace/src/admin`):
- `AdminRoute.tsx` - Route guard for admin access (6 subdirectories)
- `AdminLayout.tsx` - Admin UI layout with navigation
- Admin pages:
  - Dashboard with metrics (AdminDashboardPage.tsx)
  - User management (UsersPage.tsx)
  - Audit logs (AuditLogsPage.tsx)
  - Settings (SettingsPage.tsx)

#### GDPR Compliance

**Module Structure** (`/workspace/grove-backend/src/gdpr`):
- Data export: User can download all their data
- Data deletion: User can request account deletion
- Privacy controls: User can manage preferences
- Audit logging: All data access tracked

### 7. Documentation Structure

**Documentation Organization** (`/workspace/docs`):
- `README.md` - Documentation navigation hub
- `/development/*` - Architecture, Docker setup, acceptance criteria
- `/api/*` - API specification and endpoint documentation
- `/deployment/*` - Railway (backend), Vercel (frontend), security checklist
- `/features/*` - Matching algorithm, multi-tenancy, experimentation
- `/operations/*` - Docker autonomous guide
- `/compliance/*` - Privacy policy, terms of service, enterprise readiness
- `/archive/*` - Historical documentation and migration notes

## Code References

### Project Configuration
- `/workspace/package.json:1-67` - Frontend dependencies and scripts
- `/workspace/vite.config.ts:1-74` - Vite build configuration
- `/workspace/grove-backend/package.json:1-107` - Backend dependencies and scripts
- `/workspace/grove-backend/tsconfig.json:1-26` - TypeScript configuration
- `/workspace/grove-backend/nest-cli.json:1-9` - NestJS CLI configuration

### Infrastructure
- `/workspace/docker-compose.yml:1-77` - Multi-container orchestration
- `/workspace/Dockerfile.dev:1-47` - Development container setup
- `/workspace/dev-start.sh:1-152` - Development startup automation
- `/workspace/.env.example:1-11` - Frontend environment variables
- `/workspace/grove-backend/.env.example:1-60` - Backend environment variables

### Frontend Core
- `/workspace/src/main.tsx:1-100` - React app entry point and routing
- `/workspace/src/App.tsx:1-138` - Legacy app component (dev mode)
- `/workspace/src/lib/api.ts:1-109` - API client with CSRF protection

### Backend Core
- `/workspace/grove-backend/src/main.ts:1-93` - NestJS bootstrap and security setup
- `/workspace/grove-backend/src/app.module.ts:1-58` - Root module with all imports
- `/workspace/grove-backend/prisma/schema.prisma:1-262` - Complete database schema

### Feature Modules
- `/workspace/grove-backend/src/auth` - Authentication module (13 subdirectories)
- `/workspace/grove-backend/src/matching` - Matching engine (10 subdirectories)
- `/workspace/grove-backend/src/intros` - Introduction flow (8 subdirectories)
- `/workspace/grove-backend/src/embeddings` - AI embeddings (5 subdirectories)
- `/workspace/grove-backend/src/profiles` - Profile management (8 subdirectories)
- `/workspace/grove-backend/src/admin` - Admin dashboard (7 subdirectories)
- `/workspace/grove-backend/src/gdpr` - GDPR compliance (6 subdirectories)

## Architecture Documentation

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│  React 18 + TypeScript + TailwindCSS + Radix UI             │
│  React Router | Axios (CSRF) | Sentry                       │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTP/HTTPS (CORS)
                │ JWT in httpOnly Cookie
                │ CSRF Token in X-CSRF-Token Header
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    NESTJS BACKEND API                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Security Middleware Stack                           │   │
│  │  CORS → Security Headers → Request Logging →         │   │
│  │  Tenant Context → Validation → Exception Filters     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Guard Stack                                         │   │
│  │  Rate Limiting → JWT Auth → CSRF → RBAC            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Feature Modules (14 total)                         │   │
│  │  Auth | Profiles | Matching | Intros | Admin |      │   │
│  │  Email | Embeddings | GDPR | Encryption | ...       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Interceptors                                        │   │
│  │  OrgFilterInterceptor (Multi-Tenancy)               │   │
│  └─────────────────────────────────────────────────────┘   │
└────┬──────────────────┬──────────────────┬──────────────────┘
     │                  │                  │
     │ Prisma           │ BullMQ           │ HTTP
     │ Client           │ Jobs             │ API
     ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Redis     │  │  OpenAI API │
│ + pgvector  │  │  (Queue)    │  │ (Embeddings)│
│             │  │             │  └─────────────┘
│ 11 Tables   │  │  Job Queue  │  ┌─────────────┐
│ Vector      │  │  Background │  │  Postmark   │
│ Similarity  │  │  Processing │  │   (Email)   │
│             │  │             │  └─────────────┘
└─────────────┘  └─────────────┘
```

### Data Flow: User Onboarding & Matching

```
1. User Login (Magic Link)
   ├─ POST /api/auth/magic-link → Send email with token
   ├─ GET /api/auth/verify?token=xxx → Validate token
   └─ Response: JWT in httpOnly cookie

2. Profile Onboarding
   ├─ GET /api/profiles/me → Check if profile exists
   ├─ POST /api/profiles → Create profile
   │   ├─ Validate input (ValidationPipe)
   │   ├─ Save to profiles table
   │   └─ Trigger: Embedding generation job
   └─ Job: Generate embeddings
       ├─ Concatenate profile fields
       ├─ Call OpenAI API (text-embedding-3-small)
       └─ Store vector in embeddings table (pgvector)

3. Matching
   ├─ POST /api/matching/run → Trigger matching algorithm
   ├─ Service: MatchingService.findMatches()
   │   ├─ Get user's embedding vector
   │   ├─ Query pgvector: SELECT ... ORDER BY embedding <=> $1
   │   ├─ Filter: Same org, previous matches, blocked users
   │   ├─ Score: Combine similarity + other factors
   │   └─ Create Match records in database
   └─ Response: Match suggestions

4. Double Opt-In Introduction
   ├─ GET /api/matches → View my matches
   ├─ POST /api/intros/respond → Accept or Pass
   │   ├─ Update Intro record (userAStatus or userBStatus)
   │   ├─ Check: If both accepted → status = "mutual"
   │   └─ If mutual: Trigger email with contact info
   └─ Email: Introduction sent to both users

5. Feedback
   ├─ GET /api/intros/mutual → View completed intros
   ├─ POST /api/feedback → Submit feedback
   └─ Store in feedback table for analytics
```

### Multi-Tenancy Architecture

**Tenant Isolation Strategy**: Organization-based with strict data separation

**Implementation**:
1. **Database Level**: `orgId` foreign key on User table cascades to all related tables
2. **Middleware Level**: `TenantContextMiddleware` extracts orgId from JWT and stores in request context
3. **Interceptor Level**: `OrgFilterInterceptor` automatically adds `WHERE orgId = $1` to all queries
4. **Guard Level**: `RolesGuard` enforces org_admin can only manage users in their org
5. **Service Level**: All service methods receive orgId from request context

**Benefits**:
- Prevents data leakage across organizations
- Simplifies service code (no manual orgId filtering)
- Enforces tenant isolation at framework level
- Supports white-label deployments

### Security Architecture

**Defense in Depth**: 10 security layers applied to every request

**Security Features**:
1. **Authentication**: Magic link (passwordless) + JWT + SSO (SAML/OIDC)
2. **Authorization**: RBAC with 3 roles (user, org_admin, super_admin)
3. **CSRF Protection**: Token-based validation on state-changing requests
4. **Rate Limiting**: 100 req/min per IP via Throttler
5. **CORS**: Strict origin validation
6. **Input Validation**: Class-validator on all DTOs
7. **SQL Injection Protection**: Prisma ORM with parameterized queries
8. **XSS Protection**: Security headers middleware
9. **Data Encryption**: Field-level encryption for sensitive data (SSO secrets)
10. **Audit Logging**: Events and AdminActions for compliance

**Compliance**:
- **GDPR**: Data export, deletion, privacy controls
- **SOC2**: Audit logs, access controls, encryption at rest and in transit
- **HIPAA-ready**: Field-level encryption, audit trails, tenant isolation

## Historical Context

This research provides a comprehensive snapshot of the Grove MVP architecture as of October 24, 2025. The codebase has evolved through 6 completed phases:

**Phase 1-2**: Database setup with pgvector + Magic link authentication
**Phase 3**: Profile onboarding with validation
**Phase 4**: AI embedding generation with OpenAI integration
**Phase 5**: Vector-based matching engine
**Phase 6**: Double opt-in introduction flow

**Current State**: The application is feature-complete for MVP with enterprise-ready architecture. Additional work is ongoing for production deployment, performance optimization, and security hardening.

## Related Research

- `/workspace/docs/development/architecture.md` - Detailed architecture documentation
- `/workspace/docs/features/matching-algorithm.md` - Matching engine deep dive
- `/workspace/docs/features/multi-tenancy.md` - Multi-tenancy implementation details
- `/workspace/docs/compliance/enterprise-readiness.md` - Enterprise features and SOC2 readiness

## Open Questions

None. This research successfully documented the complete architecture and core infrastructure of the Grove MVP codebase with specific file references and line numbers.
