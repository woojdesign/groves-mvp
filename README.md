# Grove MVP - AI-Powered Connection Platform

Grove connects people within organizations based on their niche interests using AI-powered semantic matching. The platform facilitates meaningful 1:1 connections through intelligent matching and a double opt-in introduction flow.

## 🎯 Project Overview

Grove solves the problem of professional isolation within organizations by:

- **AI Matching**: Using OpenAI embeddings and pgvector for semantic similarity matching
- **Privacy-First**: Double opt-in system ensures both parties consent before introductions
- **Niche Interests**: Focuses on specialized interests beyond surface-level topics
- **Enterprise Ready**: SOC2-ready architecture with multi-tenancy support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (with pgvector extension)
- Redis 7+

### Development Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd grove-mvp

# 2. Start the entire development environment (frontend + backend + infrastructure)
./dev-start.sh

# OR use Docker Compose manually:
docker compose up -d
```

The all-in-one `dev-start.sh` script will:
- Start PostgreSQL and Redis containers
- Install dependencies
- Run database migrations
- Start backend API (port 4000)
- Start frontend dev server (port 5173)
- Manage logs in `/logs` directory

**Access Points**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Health Check: `http://localhost:4000/health`

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md).

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](/docs) directory:

- **[Development Guide](/docs/README.md)** - Getting started, architecture, testing
- **[API Documentation](/docs/api/specification.md)** - Complete API reference
- **[Deployment](/docs/deployment/)** - Railway, Vercel, security checklist
- **[Features](/docs/features/)** - Matching algorithm, multi-tenancy
- **[Operations](/docs/operations/)** - Docker autonomous guide
- **[Compliance](/docs/compliance/)** - Privacy policy, terms of service, enterprise readiness

## 🏗️ Architecture

### Tech Stack

**Frontend**:
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (navigation)

**Backend**:
- NestJS (Node.js framework)
- PostgreSQL 14+ with pgvector extension
- Prisma ORM
- OpenAI API (embeddings)
- BullMQ + Redis (job queues)
- Postmark (email delivery)

**Infrastructure**:
- Docker & Docker Compose (local development)
- Railway (backend deployment)
- Vercel (frontend deployment)

### System Components

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend  │─────▶│  Backend    │─────▶│  PostgreSQL  │
│   (React)   │      │  (NestJS)   │      │  + pgvector  │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     │  (BullMQ)   │
                     └─────────────┘
```

## 🔧 Project Structure

```
grove-mvp/
├── src/                      # Frontend React application
├── grove-backend/            # Backend NestJS API
├── docs/                     # Comprehensive documentation
├── thoughts/                 # Development research and plans
├── hack/                     # Utility scripts
├── docker-compose.yml        # Multi-container orchestration
├── dev-start.sh              # All-in-one development startup
└── QUICKSTART.md             # Quick integration guide
```

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd grove-backend
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
```

## 🚢 Deployment

See deployment guides:
- [Backend (Railway)](/docs/deployment/railway.md)
- [Frontend (Vercel)](/docs/deployment/vercel.md)
- [Security Checklist](/docs/deployment/security-checklist.md)

## 📖 Development Workflow

This project uses Claude Code with a structured workflow:

1. **Research**: Investigate in `/thoughts/research/`
2. **Planning**: Create implementation plans in `/thoughts/plans/`
3. **Implementation**: Track progress in `/thoughts/implementation-details/`
4. **Review**: Document outcomes in `/thoughts/reviews/`

All thought documents use standardized frontmatter generated via `/hack/generate_frontmatter.sh`.

## 🤝 Contributing

Contributions should follow the structured development workflow:

1. Research the feature/fix in a new research document
2. Create an implementation plan
3. Implement following the plan
4. Document the review

For detailed guidelines, see [CONTRIBUTING.md](/CONTRIBUTING.md) *(coming soon)*.

## 📝 Current Status

**MVP Status**: Phase 6 Complete (Double Opt-In Flow)

**Completed**:
- ✅ Phase 1: Database setup with pgvector
- ✅ Phase 2: Magic link authentication
- ✅ Phase 3: Profile onboarding
- ✅ Phase 4: Embedding generation
- ✅ Phase 5: Matching engine
- ✅ Phase 6: Double opt-in introductions

**In Progress**:
- 🔄 Enterprise readiness enhancements
- 🔄 Security hardening
- 🔄 Performance optimization

**Upcoming**:
- ⏳ Phase 7: Production deployment
- ⏳ Admin dashboard
- ⏳ Analytics and reporting

## 📄 License

Proprietary - Grove MVP Project

## 🆘 Support

For issues, questions, or contributions:
- Check the [documentation](/docs/README.md)
- Review existing [thought documents](/thoughts/)
- Open an issue with detailed context

---

**Built with ❤️ using Claude Code**
