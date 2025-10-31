# Grove MVP: Comprehensive Technical & Product Documentation

**Document Version**: 1.0
**Date**: October 24, 2025
**Git Commit**: e4f4da7
**Status**: Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quick Start Guide](#quick-start-guide)
3. [Product Overview](#product-overview)
4. [Technical Architecture](#technical-architecture)
5. [Core Features](#core-features)
6. [User Workflows](#user-workflows)
7. [Security & Compliance](#security--compliance)
8. [Deployment & Operations](#deployment--operations)
9. [API Reference](#api-reference)
10. [Database Schema](#database-schema)
11. [Code Organization](#code-organization)
12. [Future Roadmap](#future-roadmap)

---

## Executive Summary

### What is Grove?

**Grove** is an AI-powered connection platform that facilitates meaningful 1:1 professional connections within organizations based on niche interests using semantic matching technology. Think of it as "Tinder for professional connections based on hobbies" - connecting employees who share specialized interests beyond surface-level topics.

### Who is This Document For?

This comprehensive documentation serves two primary audiences:

**For Product Managers**:
- Understand what Grove does and why it matters
- Learn about key features and business value
- Review user workflows and customer-facing capabilities
- Assess enterprise readiness and compliance

**For Technical Leads**:
- Understand the complete technical architecture
- Review implementation details and design patterns
- Evaluate security measures and data protection
- Plan integrations and deployment strategies

### Key Statistics

- **Technology Stack**: NestJS backend + React frontend + PostgreSQL + Redis
- **Database**: 11 tables with pgvector for AI matching
- **Security**: 10-layer defense-in-depth architecture
- **Authentication**: 4 methods (Magic Link, JWT, SAML, OIDC)
- **Current Status**: Phase 6 Complete - Production-ready MVP

---

## Quick Start Guide

### For Product Managers: 5-Minute Overview

**What Grove Does**:
1. Users complete a 5-question onboarding about their niche interests
2. AI generates semantic embeddings of their profile
3. Matching algorithm finds colleagues with similar interests
4. Both users must accept before introductions are made (double opt-in)
5. Email introductions sent when both accept
6. Feedback collected to measure success

**Key Value Propositions**:
- **Reduces Isolation**: Connects people who would never meet otherwise
- **Privacy-First**: No directory browsing, no forced introductions
- **AI-Powered**: Finds connections humans would miss
- **Enterprise-Ready**: Multi-tenant, SSO, RBAC, GDPR compliant

### For Technical Leads: 5-Minute Overview

**Architecture**:
```
React Frontend (Vite + TailwindCSS)
         ↓ HTTP/HTTPS
NestJS Backend (Node.js)
         ↓ Prisma ORM
PostgreSQL + pgvector
         ↓ Background Jobs
Redis (BullMQ)
         ↓ AI Embeddings
OpenAI API
```

**Key Technical Characteristics**:
- **Modular monolith** with 14 feature modules
- **Type-safe** throughout (TypeScript + Prisma)
- **10-layer security** stack (CORS → Headers → Auth → RBAC → Tenant filtering)
- **Multi-tenancy** via explicit orgId filtering
- **SOC2-ready** with comprehensive audit logging

---

## Product Overview

### Primary Purpose

Grove solves **professional isolation** in organizations by connecting employees based on niche interests that rarely come up in work conversations.

**Example Use Cases**:
- "I'm into urban foraging" → matched with colleague who loves wild mushroom identification
- "Learning about vintage synthesizers" → matched with engineer building modular synths
- "Exploring regenerative agriculture" → matched with product manager starting a backyard farm

### Business Value Proposition

#### 1. For Employees
- **Find Hidden Connections**: Discover colleagues with shared niche interests
- **Reduce Isolation**: Combat remote work loneliness and professional isolation
- **Build Relationships**: Form meaningful connections beyond job titles
- **Privacy Protected**: Control when your information is shared

#### 2. For Organizations
- **Increase Engagement**: Strengthen company culture and employee connection
- **Retention**: Employees with workplace friendships are 50% more likely to stay
- **Cross-Department Collaboration**: Break down silos through organic connections
- **Diversity of Thought**: Connect people from different departments and backgrounds

#### 3. For HR & People Teams
- **Measurable Impact**: Track match rates, connection success, feedback scores
- **Low Touch**: Automated matching requires minimal admin overhead
- **Enterprise Integration**: SSO support for seamless onboarding
- **Compliance Ready**: GDPR, SOC2, audit trails built-in

### Target Market

**Primary**: Mid-to-large enterprises (500+ employees)
- Knowledge worker organizations
- Remote or hybrid teams
- Companies prioritizing culture and DEI

**Deployment Model**: Multi-tenant SaaS
- Each organization gets isolated data space
- Domain-based automatic user assignment
- Organization-level configuration and branding

---

## Technical Architecture

### Technology Stack

#### Frontend
```
Framework:     React 18.3.1 + TypeScript
Build Tool:    Vite 6.4.1 with SWC
Routing:       React Router 7.9.4
UI Framework:  Radix UI (26 components) + TailwindCSS 3.4.18
Forms:         React Hook Form 7.55.0
HTTP Client:   Axios 1.12.2 (with CSRF protection)
Icons:         Lucide React 0.487.0
Monitoring:    Sentry React 10.21.0
```

#### Backend
```
Framework:     NestJS 11.0.1 (Node.js)
Runtime:       Node 20
Language:      TypeScript 5.7.3
ORM:           Prisma 6.18.0
Database:      PostgreSQL 14+ with pgvector extension
Cache/Queue:   Redis 7 + BullMQ 5.61.0
AI:            OpenAI 6.6.0 (text-embedding-3-small)
Email:         Postmark 4.0.5 + Handlebars 4.7.8
Auth:          Passport 0.7.0 (JWT, SAML, OIDC)
Security:      @nestjs/throttler 6.4.0, bcrypt 6.0.0
Monitoring:    Sentry Node 10.21.0, @nestjs/terminus 11.0.0
```

#### Infrastructure
```
Development:   Docker Compose (3 services)
Database:      ankane/pgvector:latest
Cache:         Redis 7 Alpine
Backend Host:  Railway (planned)
Frontend Host: Vercel (planned)
```

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
│  │  CORS → Headers → Logging → Tenant Context →        │   │
│  │  Validation → Exception Filters                      │   │
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

### Architectural Patterns

#### 1. Modular Monolith
- **14 feature modules** with clear boundaries
- Each module is self-contained: controller, service, DTOs, tests
- Can be split into microservices if needed
- Dependency injection for loose coupling

**Module List**:
1. `AuthModule` - Authentication (magic link, JWT, SSO)
2. `ProfilesModule` - User profile management
3. `EmbeddingsModule` - OpenAI embedding generation
4. `MatchingModule` - AI-powered matching engine
5. `IntrosModule` - Double opt-in introduction flow
6. `AdminModule` - RBAC admin dashboard
7. `GdprModule` - GDPR compliance (export, delete)
8. `EncryptionModule` - Field-level encryption
9. `EmailModule` - Transactional emails
10. `JobsModule` - Background job processing
11. `ConfigModule` - Environment configuration
12. `ThrottlerModule` - Rate limiting
13. `PrismaModule` - Database connection
14. `HealthModule` - Health check endpoints

#### 2. Defense-in-Depth Security

**10-Layer Security Stack**:
1. **CORS**: Strict origin validation
2. **Security Headers**: CSP, HSTS, X-Frame-Options
3. **Request Logging**: Audit trail for all requests
4. **Tenant Context**: Extract orgId from JWT
5. **Rate Limiting**: 100 req/min per IP
6. **Validation**: Input validation with class-validator
7. **Authentication**: JWT token validation
8. **CSRF Protection**: Double-submit cookie pattern
9. **Authorization**: RBAC (user/org_admin/super_admin)
10. **Tenant Filtering**: Automatic orgId filtering on queries

#### 3. Multi-Tenancy via Explicit Filtering

**Not using**: AsyncLocalStorage or Row-Level Security (RLS)

**Using**: Explicit service-layer filtering
- Every Prisma query includes `where: { orgId }` explicitly
- `TenantContextMiddleware` extracts `orgId` from JWT → `request.orgId`
- Services use `request.orgId` for filtering
- More auditable and transparent than automatic filtering

**Example**:
```typescript
// grove-backend/src/profiles/profiles.service.ts
async getProfile(userId: string, orgId: string) {
  return this.prisma.profile.findUnique({
    where: {
      userId,
      user: { orgId }  // Explicit org filter
    },
  });
}
```

#### 4. Strategy Pattern for Matching

**Pluggable Matching Strategies**:
- `VectorSimilarityStrategy` - Current: Cosine similarity with pgvector
- `CollaborativeFilteringStrategy` - Future: User-based recommendations
- `GraphBasedStrategy` - Future: Network analysis
- `HybridStrategy` - Future: Combine multiple signals

**Enables**:
- A/B testing different algorithms
- Easy algorithm upgrades without breaking changes
- Mix-and-match strategies

---

## Core Features

### 1. Authentication & Security

#### 1.1 Magic Link Authentication (Passwordless)

**User Flow**:
```
1. User enters email → System sends magic link
2. User clicks link → System verifies token
3. System issues JWT → User authenticated for 15 minutes
4. Frontend auto-refreshes using 7-day refresh token
```

**Security Features**:
- **64-byte random tokens** (128 hex characters)
- **15-minute expiration** for magic links
- **One-time use only** (marked as used after verification)
- **Email enumeration prevention** (same response for valid/invalid emails)
- **Rate limiting**: 3 requests per 10 minutes

**Code Reference**: `grove-backend/src/auth/auth.service.ts:27-270`

#### 1.2 JWT Token Authentication

**Token Types**:
- **Access Token**: 15-minute expiration, used for API requests
- **Refresh Token**: 7-day expiration, used to get new access tokens

**Storage**: httpOnly cookies (NOT localStorage)
- `accessToken` cookie: httpOnly, secure, sameSite=strict
- `refreshToken` cookie: httpOnly, secure, sameSite=strict

**Security Benefits**:
- **XSS Protection**: Tokens cannot be accessed by JavaScript
- **Short Expiration**: 15-minute access tokens limit exposure
- **Active Validation**: User re-validated on every request
- **Automatic Refresh**: Frontend transparently refreshes tokens

**Code Reference**: `grove-backend/src/auth/strategies/jwt.strategy.ts:1-48`

#### 1.3 Enterprise SSO

**SAML 2.0 Support**:
- Azure AD, Okta, OneLogin, etc.
- Just-in-time (JIT) user provisioning
- Automatic organization creation
- Metadata storage for audit trail

**OIDC/OAuth 2.0 Support**:
- Google Workspace, Microsoft 365, Auth0, etc.
- Authorization Code flow with PKCE
- Standard scopes: openid, profile, email
- JIT provisioning

**Configuration**: Conditionally enabled via environment variables

**Code References**:
- SAML: `grove-backend/src/auth/saml/`
- OIDC: `grove-backend/src/auth/oidc/`

#### 1.4 Role-Based Access Control (RBAC)

**Roles**:
```typescript
enum Role {
  USER = 'user',             // Standard end user
  ORG_ADMIN = 'org_admin',   // Organization administrator
  SUPER_ADMIN = 'super_admin' // Platform super administrator
}
```

**Permissions**:
- `user`: Can manage own profile, matches, intros
- `org_admin`: Can manage all users in their organization
- `super_admin`: Can manage all organizations

**Implementation**: Guards + Decorators
```typescript
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Get('admin/users')
getUsers(@CurrentUser() user: User) {
  return this.adminService.getUsers(user.orgId);
}
```

**Code Reference**: `grove-backend/src/common/guards/roles.guard.ts:1-43`

#### 1.5 CSRF Protection

**Method**: Double-submit cookie pattern
1. Backend generates CSRF token: `GET /api/auth/csrf-token`
2. Frontend receives token in response body AND cookie
3. Frontend includes token in `X-CSRF-Token` header on POST/PUT/DELETE
4. Backend validates header matches cookie

**Protection Against**: Cross-Site Request Forgery attacks

**Code Reference**: `grove-backend/src/common/guards/csrf.guard.ts:1-45`

#### 1.6 Field-Level Encryption

**Algorithm**: AES-256-GCM
- 32-byte key from `ENCRYPTION_KEY` env var
- 16-byte random IV (unique per encryption)
- 16-byte authentication tag for integrity
- Format: `<iv>:<authTag>:<encryptedData>` (hex-encoded)

**Use Cases**:
- SSO client secrets (`oidcClientSecret`)
- Sensitive user PII fields
- Metadata requiring encryption

**Code Reference**: `grove-backend/src/encryption/encryption.service.ts:1-134`

---

### 2. Profile & Onboarding

#### 2.1 5-Question Onboarding

**Questions**:
1. "What's a niche interest you could talk about for an hour?"
2. "What's a project or topic you're excited to explore this year?"
3. "What kind of connection are you open to right now?" (friendship, collaboration, mentorship, knowledge exchange)
4. "Optional: a recent rabbit hole or obsession"
5. "Anything that would make a first chat easier?" (timezone, preferences)

**Data Captured**:
```prisma
model Profile {
  nicheInterest  String   @db.Text
  project        String   @db.Text
  connectionType String
  rabbitHole     String?  @db.Text
  preferences    String?  @db.Text
}
```

**Code References**:
- Frontend: `src/components/Onboarding.tsx:18-56`
- Backend: `grove-backend/src/profiles/profiles.controller.ts:1-52`
- Database: `grove-backend/prisma/schema.prisma:80-94`

#### 2.2 Profile Updates

**Capabilities**:
- Update any profile field
- Re-triggers embedding generation
- Queues background job for OpenAI API call
- Updates matching pool automatically

**Endpoint**: `PATCH /api/profiles`

---

### 3. AI Embeddings & Matching

#### 3.1 Embedding Generation

**Technology**: OpenAI text-embedding-3-small model
- **Dimensions**: 1536
- **Cost**: ~$0.00002 per profile
- **Speed**: ~200-500ms per embedding

**Process**:
```
Profile Creation
    ↓
Concatenate: nicheInterest + project + rabbitHole + preferences
    ↓
Queue Background Job (BullMQ)
    ↓
Call OpenAI API
    ↓
Store 1536-dimension vector in PostgreSQL (pgvector)
    ↓
Index with pgvector for cosine similarity search
```

**Code Reference**: `grove-backend/src/jobs/embedding-generation.processor.ts`

#### 3.2 Semantic Matching Algorithm

**8-Step Pipeline**:
```
Step 1: Candidate Pool       → Get top 100 active users with embeddings
Step 2: Filtering             → Remove prior matches, blocked users, same org
Step 3: Similarity Scoring    → Compute cosine similarity using pgvector
Step 4: Threshold Filtering   → Keep only scores > 0.7 (configurable)
Step 5: Diversity Ranking     → Re-rank for variety (different orgs, connection types)
Step 6: Reason Generation     → Extract shared topics, explain match
Step 7: Storage               → Save matches to database (7-day expiration)
Step 8: Notification          → Send match notification emails to both users
```

**Vector Similarity Query**:
```sql
SELECT u.id, u.name, e.embedding <=> $sourceVector AS distance
FROM users u
JOIN embeddings e ON u.id = e.user_id
WHERE u.org_id = $orgId
  AND u.id != $sourceUserId
  AND u.status = 'active'
ORDER BY e.embedding <=> $sourceVector
LIMIT 100
```

**Diversity Ranking Formula**:
```
finalScore = (0.7 × similarity) + (0.3 × diversity)

diversity = 0
IF different org:              diversity += 0.4
IF different connection type:  diversity += 0.3
IF different domain:           diversity += 0.3
```

**Explainability**: Extracts shared keywords and generates human-readable reasons
- "You both mentioned ceramics"
- "Both seeking collaboration"
- "Both exploring sustainable design"

**Code References**:
- Engine: `grove-backend/src/matching/engines/vector-matching.engine.ts:1-150`
- Similarity: `grove-backend/src/matching/strategies/matching/vector-similarity.strategy.ts`
- Diversity: `grove-backend/src/matching/strategies/ranking/diversity-ranking.strategy.ts`

#### 3.3 Match Expiration

**Lifecycle**:
- Matches created with 7-day expiration
- Users must respond within 7 days
- Expired matches hidden automatically
- Can be renewed if both users active

---

### 4. Double Opt-In Introductions

#### 4.1 State Machine

**States**:
```
Match Created (status: pending)
    ↓
User A Accepts → (status: accepted_by_a)
    ↓
User B Accepts → (status: mutual) → Create Intro → Send Email
    ↓
Both users receive contact info

Alternative paths:
- Either user passes → (status: rejected)
- 7 days elapse → (status: expired)
```

**Intro Statuses**:
- `pending`: Both users need to respond
- `accepted_by_a`: User A accepted, waiting for User B
- `accepted_by_b`: User B accepted, waiting for User A
- `mutual`: Both accepted → intro email sent
- `rejected`: One or both passed
- `expired`: 7 days elapsed without mutual acceptance

**Code Reference**: `grove-backend/src/intros/intros.service.ts:22-97`

#### 4.2 Privacy Protection

**Key Principles**:
- **No directory browsing**: Cannot search for users
- **No email disclosure**: Email addresses ONLY revealed on mutual acceptance
- **Silent passing**: Can decline without explanation
- **Automatic expiration**: Ignored matches disappear after 7 days

#### 4.3 Mutual Introduction Email

**Sent when**: Both users accept the match

**Contains**:
- Both users' names and email addresses
- Shared interests and connection context
- Suggested icebreaker prompts
- Link to provide feedback after meeting

**Code Reference**: `grove-backend/src/intros/intros.service.ts:100-120`

---

### 5. Feedback & Analytics

#### 5.1 Feedback Collection

**Timing**: 7 days after mutual introduction

**Questions**:
1. "Did you meet?" (yes / scheduled / no)
2. "Was the introduction helpful?" (thumbs up/down)
3. Optional feedback note (open text)

**Code Reference**: `src/components/Feedback.tsx`

#### 5.2 Success Metrics

**Tracked Metrics**:
- **Match Acceptance Rate**: % of matches that receive at least one accept
- **Mutual Acceptance Rate**: % of matches where both users accept
- **Meeting Rate**: % of mutual intros where users actually meet
- **Helpfulness Score**: % of users who found intro helpful
- **Time to Meet**: Average days from intro to first meeting

**Admin Dashboard**: Org-level analytics for org_admin role

---

### 6. Multi-Tenancy & Organization Management

#### 6.1 Data Isolation Architecture

**Strategy**: Explicit service-layer filtering (not AsyncLocalStorage or RLS)

**How It Works**:
```typescript
// 1. TenantContextMiddleware extracts orgId from JWT
req.orgId = user.orgId;

// 2. Controllers pass orgId to services
const users = await this.profilesService.getProfiles(req.orgId);

// 3. Services explicitly filter by orgId
async getProfiles(orgId: string) {
  return this.prisma.profile.findMany({
    where: { user: { orgId } },  // Explicit filter
  });
}
```

**Benefits**:
- **Auditable**: Easy to verify org filtering in code
- **Transparent**: No hidden magic with AsyncLocalStorage
- **Testable**: Can test with explicit orgId values
- **Debuggable**: Clear where org filtering happens

**Code Reference**: `docs/features/multi-tenancy.md:100-114`

#### 6.2 Organization Schema

```prisma
model Org {
  id              String   @id @default(uuid())
  name            String
  domain          String   @unique  // e.g., "acme.com"
  status          String   @default("active")

  // SSO configuration
  ssoEnabled      Boolean  @default(false)
  ssoProvider     String?  // "saml" | "oidc"
  samlMetadataUrl String?
  samlEntityId    String?
  oidcIssuer      String?
  oidcClientId    String?
  oidcClientSecret String? // Encrypted
}
```

**Code Reference**: `grove-backend/prisma/schema.prisma:16-38`

#### 6.3 Domain-Based User Assignment

**Automatic Org Assignment**:
1. User enters email: `user@acme.com`
2. System extracts domain: `acme.com`
3. Looks up org by domain
4. If org exists, creates user in that org
5. If org doesn't exist, shows "Contact admin" message

**Code Reference**: `grove-backend/src/auth/auth.service.ts:34-47`

---

### 7. Admin Dashboard & Operations

#### 7.1 Admin Capabilities

**User Management** (org_admin):
- View all users in organization
- Create new users
- Update user profiles
- Suspend users
- Delete users

**Organization Settings** (org_admin):
- Update org name and domain
- Configure SSO (SAML/OIDC)
- Set matching frequency
- Customize email templates

**Safety Moderation** (org_admin):
- Review safety flags (user reports)
- Take actions: warning, strike, ban
- View moderation history

**Audit Logs** (org_admin):
- View all admin actions
- Filter by action type, date, admin user

**Platform Administration** (super_admin):
- Manage all organizations
- Cross-org analytics
- System-wide settings

**Code Reference**: `grove-backend/src/admin/admin.controller.ts:1-100`

#### 7.2 Admin Action Audit Trail

**Logged Actions**:
```prisma
model AdminAction {
  id         String   @id @default(uuid())
  adminId    String
  action     String   // create_user, delete_user, update_org, etc.
  targetType String   // user, org, match, etc.
  targetId   String?
  orgId      String?
  metadata   Json?
  ipAddress  String
  userAgent  String
  createdAt  DateTime @default(now())
}
```

**Purpose**: SOC2 compliance, forensics, accountability

**Code Reference**: `grove-backend/prisma/schema.prisma:244-261`

---

### 8. GDPR Compliance

#### 8.1 Right to Access (Article 15)

**Endpoint**: `GET /api/users/me/export`

**Returns**: Complete JSON export of all user data
- Profile information
- Match history
- Introduction records
- Feedback submissions
- Event audit log

**Format**: JSON (immediate download)

**Code Reference**: `grove-backend/src/gdpr/gdpr.controller.ts:27-31`

#### 8.2 Right to Erasure (Article 17)

**Endpoint**: `DELETE /api/users/me`

**Action**: Hard delete of user account and all associated data

**Cascading Deletes**:
- User → Profile → Embedding → Matches → Intros → Feedback → Events

**Warning**: Irreversible action (requires confirmation)

**Code Reference**: `grove-backend/src/gdpr/gdpr.controller.ts:38-41`

#### 8.3 Consent Management

**Endpoint**: `POST /api/users/me/consent`

**Tracks**:
- Consent for privacy policy
- Consent for terms of service
- Consent version (e.g., "v1.0", "v2.0")
- Timestamp of consent

**Code Reference**: `grove-backend/src/gdpr/gdpr.controller.ts:48-55`

---

### 9. Background Jobs & Email

#### 9.1 Job Queue System

**Technology**: BullMQ + Redis

**Job Types**:

1. **Embedding Generation**
   - Trigger: Profile creation, profile update
   - Processing: Concatenate text → OpenAI API → Store vector
   - Duration: ~200-500ms
   - Retry: 3 attempts with exponential backoff

2. **Batch Matching** (Nightly Cron)
   - Trigger: Scheduled daily at 2 AM
   - Processing: Generate matches for all active users
   - Duration: ~10-30 minutes for 1000 users

3. **Email Sending**
   - Types: Magic links, match notifications, mutual intros, feedback requests
   - Service: Postmark API
   - Retry: 5 attempts for critical emails

4. **Feedback Reminders**
   - Trigger: 7 days after intro sent
   - Processing: Check if feedback submitted → send reminder

**Monitoring**: Bull Board UI in admin dashboard

**Code Reference**: `grove-backend/src/jobs/`

#### 9.2 Email Templates

**Email Service**: Postmark

**Template Engine**: Handlebars

**Email Types**:
- Magic link authentication
- Match notification
- Mutual introduction
- Feedback request
- Admin notifications

**Code Reference**: `grove-backend/src/email/`

---

## User Workflows

### Complete User Journey (End-to-End)

```
┌───────────────────────────────────────────────────────────────┐
│                   USER JOURNEY FLOWCHART                      │
└───────────────────────────────────────────────────────────────┘

1. DISCOVERY & SIGNUP
   User visits landing page → Enters email + name
       ↓
   System checks org domain (e.g., @acme.com)
       ↓
   IF domain exists: Send magic link email
   ELSE: Show "Contact admin to add your organization"

2. AUTHENTICATION
   User clicks magic link in email
       ↓
   System verifies token (not expired, not used)
       ↓
   IF valid: Create/login user → Issue JWT → Redirect to app
   ELSE: Show "Link expired, request new one"

3. ONBOARDING
   User answers 5-question survey:
       - Niche interest (e.g., "vintage synthesizers")
       - Current project (e.g., "building a modular synth")
       - Connection type (collaboration, mentorship, etc.)
       - Rabbit hole (optional)
       - Preferences (optional)
       ↓
   System stores profile → Queues embedding generation job
       ↓
   Background job: Calls OpenAI API → Stores vector embedding
       ↓
   User sees "Finding your matches..." animation

4. MATCHING
   Nightly batch job (OR on-demand when user logs in):
       ↓
   System runs matching algorithm:
       - Get candidate pool (top 100 users with embeddings)
       - Filter out prior matches, blocked users
       - Compute vector similarity (cosine distance)
       - Re-rank for diversity
       - Generate 3-5 match recommendations
       - Store matches in database (7-day expiration)
       ↓
   System sends match notification email to user

5. DISCOVERY & DECISION
   User logs in → Sees match cards on dashboard
       ↓
   For each match:
       - Views shared interests, connection context
       - Reads reason for match ("You both mentioned ceramics")
       ↓
   User decides:
       OPTION A: Click "Accept" (express interest)
       OPTION B: Click "Pass" (decline, no explanation needed)

6. DOUBLE OPT-IN
   IF User A accepts:
       ↓
   System updates match status → "accepted_by_a"
       ↓
   System notifies User B via email: "Someone is interested in connecting!"
       ↓
   IF User B also accepts:
       ↓
   System detects mutual acceptance → Creates intro record
       ↓
   System sends mutual introduction email TO BOTH USERS:
       - "Sam Rivera (sam@acme.com) ↔ Jordan Lee (jordan@acme.com)"
       - "Shared interest: vintage synthesizers"
       - "Context: Both exploring modular synthesis"
       - Suggested icebreaker prompts
       ↓
   ELSE (User B passes):
       Match status → "rejected" (hidden from both)

7. CONNECTION
   Both users receive email with contact info
       ↓
   Users connect outside the platform (email, Slack, coffee chat)
       ↓
   Platform does NOT facilitate conversation (privacy)

8. FEEDBACK
   7 days after intro sent:
       ↓
   System sends feedback request email to both users
       ↓
   Users optionally submit feedback:
       - "Did you meet?" (yes / scheduled / no)
       - "Was it helpful?" (thumbs up/down)
       - Optional note
       ↓
   System stores feedback → Updates analytics dashboard

9. ONGOING USE
   User can:
       - View new matches (replenished weekly)
       - Update profile (triggers re-embedding)
       - Pause matching (status: paused)
       - Export data (GDPR)
       - Delete account (GDPR)
```

---

## Security & Compliance

### Security Architecture Summary

#### Defense-in-Depth: 10 Security Layers

1. **Network Layer**
   - CORS restrictions (whitelist-based)
   - HTTPS enforcement (production)
   - Rate limiting (100 req/min global, 3 req/10min for magic links)

2. **Transport Layer**
   - httpOnly cookies (prevents XSS token theft)
   - Secure flag (HTTPS-only in production)
   - SameSite=strict (CSRF protection)

3. **Application Layer - Middleware**
   - Security headers (CSP, HSTS, X-Frame-Options, etc.)
   - Request logging (audit trail)
   - Tenant context extraction

4. **Application Layer - Guards**
   - JWT authentication (validates token on every request)
   - CSRF protection (double-submit cookie)
   - Role-based authorization (RBAC)

5. **Application Layer - Validation**
   - Input validation (class-validator on all DTOs)
   - DTO whitelisting (strips unknown properties)
   - Type coercion (automatic type conversion)

6. **Data Layer**
   - Multi-tenant isolation (explicit orgId filtering)
   - Field-level encryption (AES-256-GCM for PII)
   - Soft deletes (status field, not hard deletes)

7. **Audit Layer**
   - Event logging (all auth events with IP/user-agent)
   - Admin action tracking (all admin operations)
   - Immutable logs (create-only, no updates/deletes)

8. **Secrets Management**
   - Environment variables (not hardcoded)
   - Secret validation (32+ character minimums)
   - Production recommendations (AWS KMS, Azure Key Vault)

9. **Error Handling**
   - Sanitized database errors (no schema leakage)
   - Generic auth error messages (prevent enumeration)
   - No stack traces in production

10. **Monitoring**
    - Sentry error tracking (production only)
    - Health check endpoints
    - Performance monitoring (10% trace sampling)

### Compliance Readiness

#### SOC 2 Type II Readiness

**Access Controls**:
- ✅ Role-based access control (3 roles)
- ✅ Multi-factor authentication (SSO support)
- ✅ Session management (15-min access tokens)
- ✅ User status tracking (active/paused/deleted)

**Audit Logging**:
- ✅ All authentication events logged (login, logout, failed attempts)
- ✅ All admin actions logged (user management, org settings)
- ✅ IP address and user-agent captured
- ✅ Immutable audit trail (create-only)

**Encryption**:
- ✅ Data in transit (HTTPS/TLS)
- ✅ Data at rest (field-level encryption for PII)
- ✅ Token security (httpOnly cookies, short expiration)

**Security Monitoring**:
- ✅ Error tracking (Sentry)
- ✅ Rate limiting (prevents abuse)
- ✅ Health checks (uptime monitoring)

#### GDPR Compliance

**Right to Access (Article 15)**:
- ✅ Data export API (`GET /api/users/me/export`)
- ✅ Complete JSON export (profile, matches, feedback, events)
- ✅ Immediate delivery

**Right to Erasure (Article 17)**:
- ✅ Account deletion API (`DELETE /api/users/me`)
- ✅ Cascading deletes (all related data removed)
- ✅ Irreversible (with confirmation)

**Consent Management**:
- ✅ Consent recording (privacy policy, terms of service)
- ✅ Consent versioning (tracks which version user agreed to)
- ✅ Timestamp of consent

**Privacy by Design**:
- ✅ No directory browsing (cannot search for users)
- ✅ Double opt-in (both users must accept)
- ✅ Email disclosure only on mutual acceptance
- ✅ Can decline without explanation

**Data Minimization**:
- ✅ Only collects necessary data (profile, matches, feedback)
- ✅ Match expiration (7 days if ignored)
- ✅ Soft deletes (can recover if needed)

---

## Deployment & Operations

### Docker Development Environment

#### Services

**1. grove-dev** (Main application container)
- Base image: Node 20 Bookworm
- Ports: 5173 (frontend), 4000 (backend)
- Includes: Claude Code CLI, git, postgresql-client, redis-tools
- Volumes: Project directory, node_modules exclusion
- Resource limits: 2 CPUs, 4GB RAM

**2. postgres** (Database)
- Image: ankane/pgvector:latest
- Port: 5433 (host) → 5432 (container)
- Database: grove_mvp
- Volume: postgres_data (persistent)
- Health check: pg_isready

**3. redis** (Job queue)
- Image: redis:7-alpine
- Port: 6379
- Volume: redis_data (persistent)
- Health check: redis-cli ping

**Code Reference**: `docker-compose.yml:1-77`

#### Development Startup Script

**Script**: `dev-start.sh`

**Steps**:
1. Wait for PostgreSQL health check
2. Wait for Redis health check
3. Install npm dependencies (frontend + backend)
4. Run Prisma migrations (`prisma migrate deploy`)
5. Generate Prisma client (`prisma generate`)
6. Start backend (`npm run start:dev`) → port 4000
7. Start frontend (`npm run dev`) → port 5173
8. Tail logs from both services
9. Graceful shutdown on Ctrl+C

**Logs**: Saved to `logs/backend.log` and `logs/frontend.log`

**Code Reference**: `dev-start.sh:1-152`

### Environment Configuration

#### Frontend Environment Variables

```bash
# .env (frontend root)
VITE_API_BASE_URL="http://localhost:4000/api"
VITE_SENTRY_DSN="your-sentry-frontend-dsn-here"  # Optional
```

**Code Reference**: `.env.example:1-11`

#### Backend Environment Variables

**Database**:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/grove_mvp?schema=public&sslmode=disable"
```

**Authentication**:
```bash
JWT_SECRET="CHANGE_ME_min_32_chars_use_openssl_rand_base64_32"
JWT_EXPIRATION="7d"
MAGIC_LINK_EXPIRATION="15m"
MAGIC_LINK_BASE_URL="http://localhost:5173"
```

**AI Integration**:
```bash
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="text-embedding-3-small"
```

**Email**:
```bash
POSTMARK_API_KEY="your-postmark-api-key"
POSTMARK_FROM_EMAIL="noreply@yourcompany.com"
```

**Queue & Cache**:
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

**Application**:
```bash
NODE_ENV="development"
PORT="4000"
API_PREFIX="api"
```

**CORS**:
```bash
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

**Enterprise SSO** (Optional):
```bash
# SAML
SAML_ENTRY_POINT="https://login.microsoftonline.com/your-tenant-id/saml2"
SAML_ISSUER="grove-mvp"
SAML_CALLBACK_URL="http://localhost:4000/api/auth/saml/callback"
SAML_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"

# OIDC
OIDC_ISSUER="https://login.microsoftonline.com/your-tenant-id/v2.0"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
OIDC_CALLBACK_URL="http://localhost:4000/api/auth/oidc/callback"
OIDC_SCOPE="openid profile email"
```

**Security**:
```bash
ENCRYPTION_KEY="CHANGE_ME_use_openssl_rand_base64_32_for_production"
SENTRY_DSN="your-sentry-backend-dsn-here"  # Optional
```

**Code Reference**: `grove-backend/.env.example:1-60`

### Build Processes

#### Frontend Build
```bash
npm run dev      # Development server with HMR (port 5173)
npm run build    # Production build to /dist
npm run preview  # Preview production build
```

**Output**: `dist/` directory with static assets

**Code Reference**: `package.json:63-66`

#### Backend Build
```bash
npm run build       # Compile TypeScript to /dist
npm run start:dev   # Development with watch mode
npm run start:prod  # Production from compiled JS
```

**Output**: `dist/` directory with compiled JavaScript

**Code Reference**: `grove-backend/package.json:8-20`

### Health Checks

**Endpoint**: `GET /api/health`

**Checks**:
- Database connectivity (Prisma)
- Redis connectivity (BullMQ)
- OpenAI API availability
- Memory usage
- Uptime

**Code Reference**: `grove-backend/src/health/`

### Monitoring & Observability

#### Sentry Error Tracking

**Frontend**:
- Captures unhandled errors and promise rejections
- Records user actions leading to errors
- Source maps for readable stack traces

**Backend**:
- Captures uncaught exceptions
- Records request context
- 10% performance trace sampling

**Configuration**: `SENTRY_DSN` environment variable

**Code References**:
- Frontend: `src/main.tsx:25-38`
- Backend: `grove-backend/src/main.ts:15-21`

#### Application Logs

**Winston Logger** (Backend):
- Structured JSON logs
- Log levels: error, warn, info, debug
- Request/response logging
- Database query logging (dev only)

**Console Logs** (Frontend):
- Development: Verbose
- Production: Errors only

---

## API Reference

### Authentication Endpoints

```
POST   /api/auth/magic-link          Request magic link (public)
POST   /api/auth/verify               Verify token and login (public)
POST   /api/auth/refresh              Refresh access token (public)
POST   /api/auth/logout               Logout and clear cookies
GET    /api/auth/csrf-token           Get CSRF token (public)
GET    /api/auth/saml/login           Initiate SAML authentication (public)
POST   /api/auth/saml/callback        SAML callback (public)
GET    /api/auth/oidc/login           Initiate OIDC authentication (public)
GET    /api/auth/oidc/callback        OIDC callback (public)
```

### Profile Endpoints

```
POST   /api/profiles                  Create profile (onboarding)
GET    /api/profiles/me               Get current user's profile
PATCH  /api/profiles                  Update profile
GET    /api/profiles/embedding-status Check embedding generation status
```

### Matching Endpoints

```
GET    /api/matches                   Get matches for current user
POST   /api/matching/run              Trigger matching algorithm (admin)
POST   /api/matches/:id/accept        Accept a match
POST   /api/matches/:id/pass          Pass on a match
```

### Introduction Endpoints

```
GET    /api/intros                    Get active introductions
GET    /api/intros/mutual             Get completed mutual intros
POST   /api/intros/respond            Accept or pass on intro
```

### Feedback Endpoints

```
POST   /api/feedback                  Submit feedback on an intro
GET    /api/feedback                  Get feedback history
```

### GDPR Endpoints

```
GET    /api/users/me/export           Export user data (GDPR Article 15)
DELETE /api/users/me                  Delete account (GDPR Article 17)
POST   /api/users/me/consent          Record consent
```

### Admin Endpoints (org_admin, super_admin)

```
GET    /api/admin/users               List org users (paginated)
POST   /api/admin/users               Create new user
PUT    /api/admin/users/:id           Update user
POST   /api/admin/users/:id/suspend   Suspend user
DELETE /api/admin/users/:id           Delete user
GET    /api/admin/organization        Get org details
PUT    /api/admin/organization        Update org settings
GET    /api/admin/actions             View admin action audit log
GET    /api/admin/safety-flags        View safety flags (reports)
PUT    /api/admin/safety-flags/:id    Take action on safety flag
```

### Health Endpoint

```
GET    /api/health                    Health check (public)
```

**Full API Spec**: See `docs/api/` directory for detailed OpenAPI/Swagger documentation

---

## Database Schema

### Entity Relationship Overview

```
Org
 ├── User (many)
     ├── Profile (one)
     ├── Embedding (one)
     ├── Match (many as userA or userB)
     │   └── Intro (one)
     │       └── Feedback (many)
     ├── SafetyFlag (many as reporter or reported)
     ├── Event (many)
     └── AdminAction (many)
 └── AuthToken (many via email domain)
```

### 11 Database Tables

#### 1. Org (Organizations)
```prisma
model Org {
  id              String   @id @default(uuid())
  name            String
  domain          String   @unique  // e.g., "acme.com"
  status          String   @default("active")

  // SSO Configuration
  ssoEnabled      Boolean  @default(false)
  ssoProvider     String?  // "saml" | "oidc"
  samlMetadataUrl String?
  samlEntityId    String?
  oidcIssuer      String?
  oidcClientId    String?
  oidcClientSecret String? // Encrypted
  ssoMetadata     Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users           User[]
}
```

#### 2. User (Core Identity)
```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  name        String
  orgId       String
  status      String   @default("active")  // active, paused, deleted
  role        String   @default("user")    // user, org_admin, super_admin

  // SSO Fields
  ssoProvider String?  // saml, oidc
  ssoSubject  String?  // IdP user ID
  ssoMetadata Json?

  lastActive  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  org         Org       @relation(fields: [orgId], references: [id], onDelete: Cascade)
  profile     Profile?
  embedding   Embedding?
  matches     Match[]
  feedback    Feedback[]
  safetyFlags SafetyFlag[]
  events      Event[]

  @@index([orgId])
  @@index([email])
  @@index([status])
  @@index([ssoProvider, ssoSubject])
}
```

#### 3. Profile (Extended User Data)
```prisma
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique
  nicheInterest  String   @db.Text
  project        String   @db.Text
  connectionType String
  rabbitHole     String?  @db.Text
  preferences    String?  @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### 4. Embedding (AI Vectors)
```prisma
model Embedding {
  id            String   @id @default(uuid())
  userId        String   @unique
  interestsText String   @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Note: embedding vector(1536) added via raw SQL migration

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Vector Column** (added via migration):
```sql
ALTER TABLE "Embedding" ADD COLUMN embedding vector(1536);
CREATE INDEX ON "Embedding" USING ivfflat (embedding vector_cosine_ops);
```

#### 5. Match (Matching Results)
```prisma
model Match {
  id              String   @id @default(uuid())
  userAId         String
  userBId         String
  similarityScore Float
  sharedInterest  String?
  context         String?  @db.Text
  status          String   @default("pending")  // pending, accepted, rejected, expired
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  userA           User     @relation("userA", fields: [userAId], references: [id], onDelete: Cascade)
  userB           User     @relation("userB", fields: [userBId], references: [id], onDelete: Cascade)
  intro           Intro?

  @@unique([userAId, userBId])
  @@index([userAId])
  @@index([userBId])
  @@index([status])
}
```

#### 6. Intro (Double Opt-In State Machine)
```prisma
model Intro {
  id           String   @id @default(uuid())
  matchId      String   @unique
  userAStatus  String   @default("pending")  // pending, accepted, passed
  userBStatus  String   @default("pending")
  status       String   @default("pending")  // pending, accepted_by_a, accepted_by_b, mutual, rejected, expired
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  match        Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  feedback     Feedback[]

  @@index([status])
}
```

#### 7. Feedback (Post-Intro Feedback)
```prisma
model Feedback {
  id        String   @id @default(uuid())
  introId   String
  userId    String
  didMeet   String?  // yes, scheduled, no
  helpful   Boolean?
  note      String?  @db.Text
  createdAt DateTime @default(now())

  intro     Intro    @relation(fields: [introId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([introId])
  @@index([userId])
}
```

#### 8. SafetyFlag (Reports & Moderation)
```prisma
model SafetyFlag {
  id           String    @id @default(uuid())
  reporterId   String
  reportedId   String
  matchId      String?
  reason       String
  comment      String?   @db.Text
  status       String    @default("pending")  // pending, reviewed, actioned, dismissed
  actionTaken  String?   // warning, strike, ban, none
  reviewedAt   DateTime?
  reviewedBy   String?
  createdAt    DateTime  @default(now())

  reporter     User      @relation("reporter", fields: [reporterId], references: [id])
  reported     User      @relation("reported", fields: [reportedId], references: [id])

  @@index([reportedId])
  @@index([status])
}
```

#### 9. Event (Audit Log)
```prisma
model Event {
  id        String   @id @default(uuid())
  userId    String?
  eventType String
  metadata  Json?
  ipAddress String?
  userAgent String?  @db.Text
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}
```

#### 10. AuthToken (Magic Links)
```prisma
model AuthToken {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([token])
  @@index([email])
  @@index([expiresAt])
}
```

#### 11. AdminAction (Admin Audit Trail)
```prisma
model AdminAction {
  id         String   @id @default(uuid())
  adminId    String
  action     String
  targetType String
  targetId   String?
  orgId      String?
  metadata   Json?
  ipAddress  String
  userAgent  String   @db.Text
  createdAt  DateTime @default(now())

  @@index([adminId])
  @@index([orgId])
  @@index([action])
  @@index([createdAt])
}
```

**Full Schema**: `grove-backend/prisma/schema.prisma:1-262`

---

## Code Organization

### Frontend Structure

```
src/
├── admin/                    # Admin dashboard (6 subdirs)
│   ├── AdminRoute.tsx
│   ├── AdminLayout.tsx
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── AuditLogsPage.tsx
│   │   └── SettingsPage.tsx
├── components/               # Main UI components (13 subdirs)
│   ├── Welcome.tsx
│   ├── Onboarding.tsx
│   ├── MatchingAnimation.tsx
│   ├── Dashboard.tsx
│   ├── MatchCard.tsx
│   ├── Feedback.tsx
│   └── ui/                  # shadcn/ui components (52 files)
├── showcase/                # Demo/showcase pages
│   ├── ShowcaseListen.tsx
│   ├── ShowcaseLearn.tsx
│   └── ShowcaseConnect.tsx
├── lib/                     # Utilities
│   ├── api.ts              # Axios instance with CSRF
│   ├── apiService.ts       # High-level API methods
│   ├── utils.ts            # Helper functions
│   └── animations.ts       # Animation utilities
├── config/                  # Configuration
│   └── env.ts
├── types/                   # TypeScript types
│   └── index.ts
├── styles/                  # CSS
│   └── index.css
└── main.tsx                 # Entry point + routing
```

### Backend Structure

```
grove-backend/
├── src/
│   ├── auth/               # Authentication (13 subdirs)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── auth.config.ts
│   │   ├── strategies/     # Passport strategies (5 subdirs)
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── saml.strategy.ts
│   │   │   └── oidc.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── saml/           # SAML implementation (4 subdirs)
│   │   │   ├── saml.controller.ts
│   │   │   └── saml.service.ts
│   │   └── oidc/           # OIDC implementation (4 subdirs)
│   │       ├── oidc.controller.ts
│   │       └── oidc.service.ts
│   ├── profiles/           # Profile management (8 subdirs)
│   │   ├── profiles.controller.ts
│   │   ├── profiles.service.ts
│   │   ├── profiles.module.ts
│   │   └── dto/            # Data transfer objects (5 subdirs)
│   ├── embeddings/         # AI embeddings (5 subdirs)
│   │   ├── embeddings.service.ts
│   │   └── embeddings.module.ts
│   ├── matching/           # Matching engine (10 subdirs)
│   │   ├── matching.controller.ts
│   │   ├── matching.service.ts (11.5KB - main orchestration)
│   │   ├── matching.module.ts
│   │   ├── engines/        # Matching engines (5 subdirs)
│   │   │   ├── base-matching.engine.ts
│   │   │   └── vector-matching.engine.ts
│   │   ├── strategies/     # Pluggable strategies (6 subdirs)
│   │   │   ├── matching/   # Similarity strategies
│   │   │   │   └── vector-similarity.strategy.ts
│   │   │   ├── ranking/    # Ranking strategies
│   │   │   │   └── diversity-ranking.strategy.ts
│   │   │   └── filters/    # Filtering strategies
│   │   │       └── composite.filter.ts
│   │   └── interfaces/     # TypeScript interfaces (7 subdirs)
│   ├── intros/             # Introduction flow (8 subdirs)
│   │   ├── intros.controller.ts
│   │   ├── intros.service.ts
│   │   └── intros.module.ts
│   ├── admin/              # Admin dashboard (7 subdirs)
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── admin.module.ts
│   ├── gdpr/               # GDPR compliance (6 subdirs)
│   │   ├── gdpr.controller.ts
│   │   ├── gdpr.service.ts
│   │   └── gdpr.module.ts
│   ├── encryption/         # Field-level encryption
│   │   ├── encryption.service.ts
│   │   └── encryption.module.ts
│   ├── email/              # Email service (7 subdirs)
│   │   └── email.module.ts
│   ├── jobs/               # Background jobs
│   │   └── embedding-generation.processor.ts
│   ├── openai/             # OpenAI integration
│   │   └── openai.service.ts
│   ├── prisma/             # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── health/             # Health checks
│   │   └── health.module.ts
│   ├── common/             # Shared utilities
│   │   ├── guards/
│   │   │   ├── roles.guard.ts
│   │   │   └── csrf.guard.ts
│   │   ├── middleware/
│   │   │   ├── security-headers.middleware.ts
│   │   │   ├── tenant-context.middleware.ts
│   │   │   └── request-logger.middleware.ts
│   │   ├── interceptors/
│   │   │   └── org-filter.interceptor.ts
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── org-scoped.decorator.ts
│   │   └── enums/
│   │       └── role.enum.ts
│   ├── app.module.ts       # Root module (imports all feature modules)
│   └── main.ts             # Bootstrap + global security config
├── prisma/
│   ├── schema.prisma       # Database schema (262 lines)
│   ├── migrations/         # Database migrations (6 migrations)
│   └── seed.ts             # Seed data
├── test/                   # E2E tests
├── package.json
└── tsconfig.json
```

### Key Code References

**Entry Points**:
- Frontend: `src/main.tsx:1-100`
- Backend: `grove-backend/src/main.ts:1-93`

**Core Configuration**:
- Root module: `grove-backend/src/app.module.ts:1-58`
- Database schema: `grove-backend/prisma/schema.prisma:1-262`
- Docker setup: `docker-compose.yml:1-77`

**Feature Implementations**:
- Authentication: `grove-backend/src/auth/auth.service.ts:27-270`
- Matching algorithm: `grove-backend/src/matching/matching.service.ts` (11.5KB)
- Vector similarity: `grove-backend/src/matching/strategies/matching/vector-similarity.strategy.ts`
- Double opt-in: `grove-backend/src/intros/intros.service.ts:22-97`

---

## Future Roadmap

### Short-Term (1-2 months)

**Phase 7: Production Deployment**
- Railway backend deployment
- Vercel frontend deployment
- CI/CD pipeline (GitHub Actions)
- Monitoring & alerting (Sentry, Uptime Robot)

**Matching Algorithm Improvements** (Quick Wins):
- Switch to inner product similarity (10-20% performance gain)
- Use profile attributes for cold-start matching
- LLM-generated match reasons (GPT-4 for better explanations)
- Increase candidate pool dynamically (100-500 based on org size)

### Medium-Term (3-6 months)

**Phase 8: Analytics & Insights**
- Org-wide match statistics dashboard
- User engagement metrics
- Feedback analysis (sentiment, trends)
- A/B testing framework

**Matching Algorithm Enhancements** (Strategic):
- Multi-signal fusion (combine vector + profile attributes)
- Learning-to-Rank (ML-based ranking from feedback)
- Reciprocal matching (ensure mutual interest probability)
- Contextual bandits (exploration vs. exploitation)

### Long-Term (6-12 months)

**Phase 9: Mobile App**
- React Native or Flutter
- Push notifications for new matches
- In-app messaging (optional)

**Phase 10: Advanced Features**
- Group events (based on shared interests)
- Interest-based communities
- Public profiles (opt-in)
- Integration with Slack, Teams

**Matching Algorithm R&D** (Experimental):
- Graph Neural Networks (model network effects)
- Transformer-based sequential modeling (interest evolution)
- Custom embedding training (domain-specific)

---

## Appendix: Related Documentation

### Internal Documentation
- `/docs/development/architecture.md` - Detailed architecture documentation
- `/docs/development/docker-setup.md` - Docker development guide
- `/docs/features/matching-algorithm.md` - Matching engine deep dive
- `/docs/features/multi-tenancy.md` - Multi-tenancy implementation details
- `/docs/compliance/enterprise-readiness.md` - Enterprise features and SOC2 readiness

### Research Documents
- `thoughts/research/2025-10-24-grove-mvp-architecture-and-core-infrastructure.md`
- `thoughts/research/2025-10-24-core-business-logic-and-features-documentation.md`
- `thoughts/research/2025-10-24-authentication-authorization-and-security-implementation.md`
- `thoughts/research/2025-10-23-MATCHING-ALGO-STRATEGY-best-in-class-matching-algorithm-strategy-for-grove.md`

### Implementation Reviews
- `thoughts/reviews/` - Phase reviews for all completed phases (1-6)

---

## Document Maintenance

**Last Updated**: October 24, 2025
**Next Review**: Before production deployment
**Maintainers**: Sean Kim
**Feedback**: Please open an issue in the repository for corrections or additions

---

**End of Documentation**
