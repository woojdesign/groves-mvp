# Grove MVP - Backend API

NestJS-based backend API for the Grove MVP matching platform.

## Overview

Grove connects people within organizations based on their niche interests using AI-powered semantic matching. This backend provides:

- **Authentication**: Magic link email authentication
- **Onboarding**: Profile creation and interest capture
- **Embeddings**: OpenAI-powered semantic vectorization
- **Matching**: pgvector-based similarity matching with configurable algorithms
- **Double Opt-In**: Intro flow with mutual consent
- **Feedback**: Post-intro feedback collection

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 14+ with pgvector extension
- **ORM**: Prisma
- **Embeddings**: OpenAI text-embedding-ada-002
- **Email**: Postmark
- **Jobs**: BullMQ with Redis

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with pgvector extension
- Redis 7+ (for job queues)
- Docker & Docker Compose (recommended for local dev)

## Quick Start

### 1. Start Infrastructure (PostgreSQL + Redis)

From the project root:

```bash
# Start PostgreSQL and Redis containers
docker compose up -d postgres redis

# Verify containers are running
docker compose ps
```

### 2. Install Dependencies

```bash
cd grove-backend
npm install
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and update values:
# - DATABASE_URL (should work as-is for Docker setup)
# - Add your OpenAI API key when ready for Phase 4
# - Add your Postmark API key when ready for Phase 2
```

### 4. Run Database Migrations

```bash
# Apply migrations to create all tables
npx prisma migrate deploy

# OR for development (creates migration if needed)
npx prisma migrate dev
```

This will:
- Create the `grove_mvp` database
- Enable the pgvector extension
- Create all 10 tables (orgs, users, profiles, embeddings, matches, intros, feedback, safety_flags, events, auth_tokens)
- Add vector index for similarity search

### 5. Seed Development Data

```bash
npm run prisma:seed
# OR
npx prisma db seed
```

This creates:
- 1 example organization
- 3 test users with profiles
- Sample interests for testing

### 6. Start the Server

```bash
# Development mode with hot reload
npm run start:dev

# OR standard start
npm start
```

The API will be available at:
- **Base URL**: `http://localhost:4000`
- **API Prefix**: `/api`
- **Health Check**: `http://localhost:4000/health`

### 7. Verify Setup

```bash
# Test health endpoint
curl http://localhost:4000/health

# Expected response:
# {
#   "status": "ok",
#   "info": {
#     "database": {
#       "status": "up"
#     }
#   },
#   "error": {},
#   "details": {
#     "database": {
#       "status": "up"
#     }
#   }
# }
```

## Database Schema

### Tables (10 total)

1. **orgs** - Organizations
2. **users** - User accounts
3. **profiles** - User onboarding data (interests, projects, connection type)
4. **embeddings** - OpenAI vector embeddings (1536 dimensions)
5. **matches** - Potential matches with similarity scores
6. **intros** - Double opt-in introduction state machine
7. **feedback** - Post-intro feedback
8. **safety_flags** - Safety reports and moderation
9. **events** - Audit log
10. **auth_tokens** - Magic link tokens

### Prisma Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

## Development

### Project Structure

```
grove-backend/
├── src/
│   ├── auth/              # Authentication (Phase 2)
│   ├── users/             # User management
│   ├── profiles/          # Profile CRUD (Phase 3)
│   ├── embeddings/        # Embedding generation (Phase 4)
│   ├── matching/          # Matching engine (Phase 5)
│   ├── intros/            # Double opt-in flow (Phase 6)
│   ├── feedback/          # Feedback collection
│   ├── email/             # Email service
│   ├── health/            # Health checks
│   ├── prisma/            # Prisma service
│   ├── config/            # Configuration
│   ├── common/            # Shared utilities
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration files
│   └── seed.ts            # Seed script
├── test/                  # E2E tests
├── .env                   # Environment variables
├── .env.example           # Environment template
└── package.json
```

### Available Scripts

```bash
# Development
npm run start              # Start server
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger

# Build
npm run build              # Build for production

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests

# Linting & Formatting
npm run lint               # Lint code
npm run format             # Format code with Prettier
```

### Testing

Tests are written using Jest. Each module should have:
- Unit tests (`*.spec.ts`) - Test individual functions and methods
- E2E tests (`test/*.e2e-spec.ts`) - Test complete API flows

```bash
# Run all tests
npm test

# Watch mode during development
npm run test:watch

# Generate coverage report
npm run test:cov
```

## API Documentation

### Current Endpoints (Phase 1)

#### GET /health
Health check endpoint with database status.

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  }
}
```

### Upcoming Endpoints

- **Phase 2**: `POST /api/auth/magic-link`, `POST /api/auth/verify`
- **Phase 3**: `POST /api/profiles`, `GET /api/profiles/me`
- **Phase 4**: `POST /api/embeddings/generate`
- **Phase 5**: `GET /api/matches`, `POST /api/matches/generate`
- **Phase 6**: `POST /api/intros/:id/accept`, `POST /api/intros/:id/pass`

Full API documentation will be added as endpoints are implemented.

## Environment Variables

See `.env.example` for all required variables:

| Variable | Description | Required Phase |
|----------|-------------|----------------|
| `DATABASE_URL` | PostgreSQL connection string | Phase 1 |
| `JWT_SECRET` | Secret for JWT tokens | Phase 2 |
| `OPENAI_API_KEY` | OpenAI API key | Phase 4 |
| `POSTMARK_API_KEY` | Postmark email service key | Phase 2 |
| `REDIS_HOST` | Redis hostname | Phase 4 |
| `PORT` | Server port (default 4000) | Phase 1 |
| `FRONTEND_URL` | Frontend URL for CORS | Phase 1 |

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL container is running
docker compose ps

# Start PostgreSQL if not running
docker compose up -d postgres

# Check logs
docker compose logs postgres

# Test direct connection
docker compose exec postgres psql -U postgres -d grove_mvp -c "SELECT 1;"
```

### Migration Issues

```bash
# If migrations fail, check Prisma status
npx prisma migrate status

# Reset and reapply migrations (⚠️ deletes all data)
npx prisma migrate reset

# Force apply migrations
npx prisma migrate deploy --force
```

### Port Already in Use

```bash
# Change PORT in .env file
PORT=4001

# Or kill process using port 4000
lsof -ti:4000 | xargs kill -9
```

## Production Deployment

Production deployment is covered in **Phase 7**. Key considerations:

- Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Enable SSL for database connections
- Use environment-specific configuration
- Set up proper monitoring and logging
- Configure rate limiting and security headers

## Contributing

This is part of the Grove MVP implementation. See the main project documentation for:

- Implementation plan
- Phase tracking
- Architecture decisions
- Code review guidelines

## Phase 1 Status

✅ **Complete**
- NestJS project initialized
- All 10 database tables created
- pgvector extension enabled
- Prisma ORM configured
- Health check endpoint working
- Seed data script ready
- Development environment documented

**Next Phase**: Phase 2 - Authentication (Magic Link)

## License

Proprietary - Grove MVP Project
