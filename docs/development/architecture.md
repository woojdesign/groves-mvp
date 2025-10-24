# Grove MVP Architecture

## System Overview

Grove is an AI-powered connection platform that matches people based on niche interests using semantic similarity. The system consists of a React frontend, NestJS backend, and PostgreSQL database with pgvector for vector similarity search.

## High-Level Architecture

```
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│   Backend API    │─────▶│   PostgreSQL    │
│   (React/Vite)  │      │   (NestJS)       │      │   + pgvector    │
│   Port 5173     │      │   Port 4000      │      │   Port 5432     │
└─────────────────┘      └────────┬─────────┘      └─────────────────┘
                                  │
                                  ├─────────────────┐
                                  │                 │
                         ┌────────▼────────┐ ┌─────▼──────┐
                         │   Redis         │ │  OpenAI    │
                         │   (BullMQ)      │ │  API       │
                         │   Port 6379     │ │  (Cloud)   │
                         └─────────────────┘ └────────────┘
```

## Component Details

### Frontend (React + Vite)

**Technology**:
- React 18 with TypeScript
- Vite for build/dev tooling
- TailwindCSS for styling
- React Router for navigation

**Key Features**:
- Magic link authentication flow
- Profile onboarding wizard
- Match browsing and filtering
- Double opt-in introduction flow
- Post-intro feedback collection

**Structure**:
```
src/
├── components/        # Reusable UI components
├── pages/            # Route-level page components
├── contexts/         # React Context providers (auth, etc.)
├── hooks/            # Custom React hooks
├── services/         # API client services
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Backend (NestJS)

**Technology**:
- NestJS (Node.js framework)
- Prisma ORM
- PostgreSQL 14+ with pgvector extension
- Redis + BullMQ for job queues
- OpenAI API for embeddings
- Postmark for email delivery

**Key Services**:

1. **Auth Service** (`src/auth/`)
   - Magic link generation
   - Token verification
   - JWT token management

2. **Profiles Service** (`src/profiles/`)
   - Profile CRUD operations
   - Onboarding data capture
   - Interest management

3. **Embeddings Service** (`src/embeddings/`)
   - OpenAI API integration
   - Text vectorization (1536 dimensions)
   - Batch processing via BullMQ

4. **Matching Service** (`src/matching/`)
   - pgvector similarity search
   - Configurable matching algorithms
   - Match score calculation

5. **Intros Service** (`src/intros/`)
   - Double opt-in state machine
   - Intro request/accept/pass flow
   - Email notifications

6. **Feedback Service** (`src/feedback/`)
   - Post-intro feedback collection
   - Quality tracking

**Structure**:
```
grove-backend/src/
├── auth/              # Authentication module
├── users/             # User management
├── profiles/          # Profile CRUD
├── embeddings/        # Embedding generation
├── matching/          # Matching engine
├── intros/            # Double opt-in flow
├── feedback/          # Feedback collection
├── email/             # Email service
├── health/            # Health checks
├── prisma/            # Prisma service
├── config/            # Configuration
├── common/            # Shared utilities
├── app.module.ts      # Root module
└── main.ts            # Application entry
```

### Database (PostgreSQL + pgvector)

**Schema** (10 tables):

1. **orgs** - Organizations (multi-tenancy)
2. **users** - User accounts
3. **profiles** - Onboarding data (interests, projects, connection type)
4. **embeddings** - 1536-dimensional vectors
5. **matches** - Potential matches with scores
6. **intros** - Double opt-in state machine
7. **feedback** - Post-intro feedback
8. **safety_flags** - Safety reports
9. **events** - Audit log
10. **auth_tokens** - Magic link tokens

**Vector Search**:
- pgvector extension for cosine similarity
- HNSW index on embeddings table
- Optimized for <1ms query times

### Job Queue (Redis + BullMQ)

**Use Cases**:
- Asynchronous embedding generation
- Batch match regeneration
- Email sending
- Scheduled cleanup tasks

**Queues**:
- `embeddings` - Generate embeddings for new profiles
- `matching` - Regenerate matches periodically
- `email` - Send emails asynchronously

## Data Flow

### User Onboarding Flow

```
1. User enters email
   └─▶ POST /api/auth/magic-link
       └─▶ Generate token, send email

2. User clicks magic link
   └─▶ POST /api/auth/verify
       └─▶ Create session, return JWT

3. User completes profile
   └─▶ POST /api/profiles
       └─▶ Save profile data

4. System generates embeddings
   └─▶ Job added to BullMQ
       └─▶ Call OpenAI API
           └─▶ Store vector in embeddings table

5. System generates matches
   └─▶ pgvector similarity search
       └─▶ Create match records
```

### Matching Flow

```
1. User views matches
   └─▶ GET /api/matches
       └─▶ Query matches table

2. User requests intro
   └─▶ POST /api/intros
       └─▶ Create intro (status: PENDING)
           └─▶ Send email to match

3. Match accepts/passes
   └─▶ POST /api/intros/:id/accept
       └─▶ Update status to ACCEPTED
           └─▶ Send email to both users

4. Users provide feedback
   └─▶ POST /api/feedback
       └─▶ Store feedback record
```

## Security Architecture

### Authentication

- **Magic Links**: Passwordless authentication via email
- **JWT Tokens**: Stateless session management
- **Token Expiry**: Short-lived tokens (15 min magic link, 7 day JWT)

### Authorization

- **Row-Level Security**: Prisma middleware enforces org_id filtering
- **API Guards**: NestJS guards verify JWT on protected routes
- **Role-Based Access**: Admin vs user permissions

### Data Privacy

- **Multi-Tenancy**: Strict org_id isolation
- **PII Protection**: Minimal PII collection
- **Encryption**: TLS in transit, encrypted at rest (database level)

## Deployment Architecture

### Development

```
┌────────────────────────────────────────────┐
│   Docker Compose                           │
│                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │PostgreSQL│  │  Redis   │  │  Grove   ││
│  │Container │  │Container │  │  Backend ││
│  │Port 5432 │  │Port 6379 │  │  Port    ││
│  │          │  │          │  │  4000    ││
│  └──────────┘  └──────────┘  └──────────┘│
└────────────────────────────────────────────┘

Frontend runs on host (Vite dev server, port 5173)
```

### Production

```
┌─────────────────┐      ┌─────────────────┐
│   Vercel        │─────▶│   Railway       │
│   (Frontend)    │      │   (Backend)     │
│   - React build │      │   - NestJS      │
│   - CDN         │      │   - PostgreSQL  │
│   - Edge        │      │   - Redis       │
└─────────────────┘      └─────────────────┘
```

**Frontend (Vercel)**:
- Static build deployment
- Edge network CDN
- Environment variables for API URL

**Backend (Railway)**:
- Docker container deployment
- Managed PostgreSQL (with pgvector)
- Managed Redis
- Auto-scaling
- Health check monitoring

## Configuration Management

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:4000
VITE_ENV=development
```

**Backend** (`grove-backend/.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
OPENAI_API_KEY=...
POSTMARK_API_KEY=...
REDIS_HOST=localhost
PORT=4000
FRONTEND_URL=http://localhost:5173
```

### Configuration Files

- `vite.config.ts` - Vite build configuration
- `grove-backend/nest-cli.json` - NestJS CLI config
- `grove-backend/tsconfig.json` - TypeScript config
- `docker-compose.yml` - Local infrastructure orchestration

## Performance Considerations

### Database

- **Indexes**: HNSW index on embeddings for fast similarity search
- **Connection Pooling**: Prisma connection pool (default 10 connections)
- **Query Optimization**: Selective field queries, avoid N+1

### Caching

- **Redis**: Cache frequently accessed data (user sessions, match results)
- **Frontend**: React Query for client-side caching

### Scaling

- **Horizontal**: Stateless backend allows multiple instances
- **Vertical**: PostgreSQL can scale to handle millions of vectors
- **Job Queue**: BullMQ distributes async work across workers

## Monitoring & Observability

### Health Checks

- **Backend**: `/health` endpoint with database check
- **Database**: Prisma health indicator
- **Redis**: Connection status check

### Logging

- **Backend**: NestJS built-in logger
- **Database**: Query logging (development only)
- **Job Queue**: BullMQ job status tracking

### Metrics (Future)

- API response times
- Match generation performance
- Embedding generation throughput
- User engagement metrics

## Technology Decisions

### Why NestJS?

- TypeScript-first framework
- Excellent module system
- Built-in dependency injection
- Strong testing support
- Production-ready patterns

### Why pgvector?

- Native PostgreSQL extension
- Fast similarity search (HNSW index)
- No separate vector database needed
- Transactional consistency with relational data

### Why Prisma?

- Type-safe database client
- Excellent TypeScript integration
- Migration system
- Studio for database inspection

### Why BullMQ?

- Reliable Redis-based job queue
- Job retry and failure handling
- Queue prioritization
- Dashboard for monitoring

## Future Architecture Considerations

### Microservices (Phase 8+)

Potential split:
- Auth Service
- Matching Service
- Notification Service

### Real-Time Features

- WebSocket support for live match notifications
- Real-time chat (post-introduction)

### Analytics

- Data warehouse for analytics
- ETL pipelines
- Business intelligence dashboards

### Machine Learning

- Custom matching model training
- A/B testing framework
- Feedback loop for algorithm improvement

---

**Last Updated**: 2025-10-24
**Related Docs**: [API Specification](/docs/api/specification.md), [Matching Algorithm](/docs/features/matching-algorithm.md)
