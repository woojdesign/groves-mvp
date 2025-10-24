# Grove MVP Documentation

Welcome to the Grove MVP documentation. This guide helps you find the right documentation for your needs.

## 📖 Documentation Index

### For Developers

**Getting Started**:
- [Quickstart Guide](/QUICKSTART.md) - Integration testing and quick setup
- [Development with Docker](/docs/development/docker.md) - Docker development workflow
- [Acceptance Criteria](/docs/development/acceptance-criteria.md) - Comprehensive MVP test plan

**API & Integration**:
- [API Specification](/docs/api/specification.md) - Complete backend API reference
- [API Testing](/docs/api/testing.md) - Phase 2 API testing documentation

**Backend Development**:
- [Backend README](/grove-backend/README.md) - Backend-specific setup and architecture
- [Backend Setup](/grove-backend/SETUP.md) - Detailed backend configuration

**Features & Architecture**:
- [Matching Algorithm](/docs/features/matching-algorithm.md) - Detailed matching algorithm analysis
- [Matching Experimentation](/docs/features/matching-experimentation.md) - Experimentation strategy
- [Multi-Tenancy](/docs/features/multi-tenancy.md) - Multi-tenant architecture

### For DevOps & Operations

**Deployment**:
- [Deployment Quickstart](/docs/deployment/quickstart.md) - Fast deployment guide
- [Railway Backend Deployment](/docs/deployment/railway.md) - Backend deployment to Railway
- [Vercel Frontend Deployment](/docs/deployment/vercel.md) - Frontend deployment to Vercel
- [Security Checklist](/docs/deployment/security-checklist.md) - Pre-deployment security audit

**Operations**:
- [Docker Autonomous Guide](/docs/operations/docker-autonomous.md) - Universal Docker setup guide

### For Compliance & Legal

**Compliance Documentation**:
- [Enterprise Readiness Progress](/docs/compliance/enterprise-readiness.md) - SOC2 compliance tracking
- [Privacy Policy](/docs/compliance/privacy-policy.md) - Legal privacy policy
- [Terms of Service](/docs/compliance/terms-of-service.md) - Legal terms of service

### Historical Archive

**Archived Documents** (kept for reference):
- [Docker Setup (Legacy)](/docs/archive/docker-setup-legacy.md) - Superseded by Docker Autonomous Guide
- [Frontend-Backend Integration](/docs/archive/frontend-backend-integration.md) - Integration documentation
- [Integration Complete Report](/docs/archive/integration-complete.md) - Integration completion summary
- [MVP Progress Summary](/docs/archive/mvp-progress-summary.md) - Historical progress tracking
- [Phase 3 Summary](/docs/archive/phase-3-summary.md) - Phase 3 completion report

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                    # This file - documentation navigation
├── api/                         # API documentation
│   ├── specification.md         # Complete API reference
│   └── testing.md               # API testing guide
├── development/                 # Development guides
│   ├── acceptance-criteria.md   # MVP test plan
│   └── docker.md                # Docker development
├── deployment/                  # Deployment guides
│   ├── quickstart.md            # Quick deployment
│   ├── railway.md               # Railway backend
│   ├── vercel.md                # Vercel frontend
│   └── security-checklist.md    # Security audit
├── features/                    # Feature documentation
│   ├── matching-algorithm.md    # Algorithm details
│   ├── matching-experimentation.md  # Experimentation
│   └── multi-tenancy.md         # Multi-tenant architecture
├── operations/                  # Operations guides
│   └── docker-autonomous.md     # Universal Docker guide
├── compliance/                  # Compliance & legal
│   ├── enterprise-readiness.md  # SOC2 tracking
│   ├── privacy-policy.md        # Privacy policy
│   └── terms-of-service.md      # Terms of service
└── archive/                     # Historical documents
    ├── docker-setup-legacy.md
    ├── frontend-backend-integration.md
    ├── integration-complete.md
    ├── mvp-progress-summary.md
    └── phase-3-summary.md
```

---

## 🔍 Finding Documentation

### By Task

| I want to... | Read this |
|-------------|-----------|
| Set up the development environment | [Quickstart](/QUICKSTART.md), [Docker Development](/docs/development/docker.md) |
| Understand the API | [API Specification](/docs/api/specification.md) |
| Deploy to production | [Deployment Quickstart](/docs/deployment/quickstart.md) |
| Understand the matching algorithm | [Matching Algorithm](/docs/features/matching-algorithm.md) |
| Set up the backend | [Backend README](/grove-backend/README.md) |
| Review security checklist | [Security Checklist](/docs/deployment/security-checklist.md) |
| Check compliance status | [Enterprise Readiness](/docs/compliance/enterprise-readiness.md) |

### By Role

| Role | Key Documents |
|------|--------------|
| **New Developer** | [README](/README.md), [Quickstart](/QUICKSTART.md), [Backend README](/grove-backend/README.md) |
| **Backend Developer** | [API Specification](/docs/api/specification.md), [Backend Setup](/grove-backend/SETUP.md) |
| **Frontend Developer** | [API Specification](/docs/api/specification.md), [Quickstart](/QUICKSTART.md) |
| **DevOps Engineer** | [Docker Autonomous](/docs/operations/docker-autonomous.md), [Deployment guides](/docs/deployment/) |
| **Product Manager** | [Matching Algorithm](/docs/features/matching-algorithm.md), [Enterprise Readiness](/docs/compliance/enterprise-readiness.md) |
| **Security/Compliance** | [Enterprise Readiness](/docs/compliance/enterprise-readiness.md), [Security Checklist](/docs/deployment/security-checklist.md) |

---

## 📝 Documentation Standards

All documentation follows these standards:

1. **Markdown Format**: All docs use GitHub-flavored Markdown
2. **Relative Links**: Use relative paths for cross-references
3. **Code Examples**: Include runnable code snippets
4. **Verification Steps**: Include how to verify instructions worked
5. **Last Updated**: Note when document was last reviewed

---

## 🛠️ Development Workflow Documentation

This project uses Claude Code with structured thought documents in `/thoughts`:

- **Research**: `/thoughts/research/` - Codebase investigations
- **Plans**: `/thoughts/plans/` - Implementation plans
- **Implementation**: `/thoughts/implementation-details/` - Progress tracking
- **Reviews**: `/thoughts/reviews/` - Code reviews and retrospectives

All thought documents use standardized frontmatter. See `/hack/generate_frontmatter.sh` for the automated workflow.

---

## 🤝 Contributing to Documentation

When updating documentation:

1. **Keep it Current**: Update docs when code changes
2. **Test Examples**: Verify all code examples work
3. **Update Links**: Check all cross-references
4. **Archive, Don't Delete**: Move outdated docs to `/archive`
5. **Add Context**: Explain why, not just what

For questions or improvements, open an issue or update the relevant doc.

---

**Last Updated**: 2025-10-24
**Maintained By**: Sean Kim / Claude Code
