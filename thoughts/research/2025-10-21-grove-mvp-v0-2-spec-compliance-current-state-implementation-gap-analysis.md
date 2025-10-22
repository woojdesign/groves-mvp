---
doc_type: research
date: 2025-10-21T20:09:02+00:00
title: "Grove MVP v0.2 Spec Compliance: Current State & Implementation Gap Analysis"
research_question: "What is the current implementation status of the Grove MVP codebase compared to the v0.2 technical specification, and what are all the gaps that need to be filled to reach a functional first version?"
researcher: Sean Kim

git_commit: 875ab6fa6f4239bf1ccba9b80d72b44079e58a1f
branch: main
repository: grove-mvp

created_by: Sean Kim
last_updated: 2025-10-21
last_updated_by: Sean Kim

tags:
  - grove-mvp
  - gap-analysis
  - technical-specification
  - architecture
  - implementation-status
  - frontend
  - backend
  - database
  - matching-engine
  - authentication
  - email-service
status: complete

related_docs:
  - thoughts/research/2025-10-18-styles-and-animations-implementation.md
  - thoughts/plans/styles-animations-consolidation-plan.md
---

# Grove MVP v0.2 Spec Compliance: Current State & Implementation Gap Analysis

**Date**: October 21, 2025, 1:09 PM PDT
**Researcher**: Sean Kim
**Git Commit**: 875ab6f
**Branch**: main
**Repository**: grove-mvp

## Research Question

What is the current implementation status of the Grove MVP codebase compared to the v0.2 technical specification, and what are all the gaps that need to be filled to reach a functional first version?

---

## Executive Summary

The Grove MVP codebase is currently a **frontend-only visual prototype** built with Vite, React, and Tailwind CSS. It successfully demonstrates the premium UI/UX vision with polished onboarding flows, matching animations, and feedback collection screens. However, **100% of the backend infrastructure, data persistence, and external service integrations are missing**.

### Current State in Three Points

1. **Frontend Complete (UI/UX)**: All 5 core user flows are implemented as interactive React components with premium animations, glass morphism design, and responsive layouts. Recent consolidation work has created reusable `GlassCard`, `IconBadge`, and `ButtonShimmer` components with centralized animation constants.

2. **Backend Completely Missing**: There is zero backend infrastructure - no API server, no database, no authentication service, no email integration, no vector storage, no matching algorithm implementation. All data is currently mock data in component state.

3. **Gap is Massive**: To reach a functional MVP, approximately 85-90% of the technical specification needs to be built from scratch, including database schema, API endpoints, authentication flow, embedding generation, vector search, matching algorithm, email service, and all security/privacy controls.

---

## 1. Current Implementation Inventory

### 1.1 Frontend Architecture & Tech Stack

**Framework & Build Tool**
- **Vite 6.3.5** - Modern build tool with hot module replacement
- **React 18.3.1** - UI library with hooks
- **React Router DOM 7.9.4** - Client-side routing (4 routes: main app + 3 showcase screens)
- **TypeScript** - Vite config and component typing

**UI Component Library**
- **shadcn/ui** (52 components) - Built on Radix UI primitives
- **Radix UI** - Headless accessible components (accordion, dialog, dropdown, popover, radio, select, switch, tabs, tooltip, etc.)
- **Lucide React 0.487.0** - Icon library (Sprout logo, UI icons)

**Styling System**
- **Tailwind CSS v4.1.3** - Utility-first CSS with CSS-first configuration (no tailwind.config.js)
- **CSS Custom Properties** - Design tokens in `/src/styles/globals.css` (215 lines)
- **class-variance-authority (CVA)** - Variant management for shadcn components
- **clsx + tailwind-merge** - Class composition via `cn()` utility

**Animation Library**
- **Framer Motion** (`motion/react`) - All animations, transitions, orchestrated sequences
- **Centralized Animation Constants** (`/src/lib/animations.ts`, 98 lines) - Easing curves, durations, spring configs, reusable variants (fadeInUp, scaleIn, slideInRight)

**Form Management**
- **React Hook Form 7.55.0** - Installed but not actively used (forms are simple controlled components)

**Charts/Data Visualization**
- **Recharts 2.15.2** - Installed for potential analytics/admin dashboard

**Development & Deployment**
- **Vite Plugin React SWC** - Fast refresh with SWC compiler
- **Vercel Deployment** - Configured in `vercel.json` (SPA with catch-all routing)
- **PostCSS + Autoprefixer** - CSS processing

### 1.2 Component Inventory

**Custom Application Components** (7 core screens, all in `/src/components/`)
1. **Welcome.tsx** (130 lines) - Landing page with email/name input, magic link sent animation
2. **Onboarding.tsx** (187 lines) - Multi-step questionnaire (5 prompts), progress bar, directional slide animations
3. **MatchingAnimation.tsx** (597 lines) - Complex 5-phase matching visualization with word clouds, clustering, SVG line connections
4. **Dashboard.tsx** (147 lines) - Match card display with pause/active toggle, settings icon
5. **MatchCard.tsx** (143 lines) - Individual match card with interests, context, accept/pass actions, confirmation overlay
6. **Feedback.tsx** (176 lines) - Post-match feedback form (did you meet? helpful? optional note)
7. **DevMenu.tsx** (159 lines) - Developer navigation overlay (Cmd+K to toggle between screens)

**Showcase Screens** (3 auto-playing demos, all in `/src/showcase/`)
1. **ShowcaseListen.tsx** (254 lines) - Onboarding preview with typewriter effect
2. **ShowcaseLearn.tsx** (218 lines) - Matching animation preview
3. **ShowcaseConnect.tsx** (194 lines) - Match card interaction preview

**Reusable UI Components** (created from consolidation work)
- **GlassCard.tsx** (55 lines) - Glass morphism card with variants (default, premium, subtle), optional glow and accent strip
- **IconBadge.tsx** (61 lines) - Circular icon badge with size/variant props
- **ButtonShimmer** (in button.tsx) - Shimmer effect component for premium buttons

**shadcn/ui Library** (52 components in `/src/components/ui/`)
- Form controls: button, input, textarea, checkbox, radio-group, select, slider, switch
- Overlays: dialog, drawer, sheet, popover, tooltip, hover-card, alert-dialog
- Navigation: tabs, accordion, breadcrumb, menubar, navigation-menu, sidebar
- Display: card, badge, avatar, separator, progress, skeleton, table
- Charts: chart (with recharts integration)
- Layout: resizable, scroll-area, collapsible, aspect-ratio
- Utilities: utils.ts (cn function), use-mobile.ts

### 1.3 Visual Design System

**Design Aesthetic**: Premium, warm, nature-inspired

**Color Palette** (from `/src/styles/globals.css:3-43`)
- Primary: `#1a1a1a` (near black)
- Secondary: `#a07855` (warm brown/terracotta)
- Accent: `#d4a574` (warm gold)
- Background: `#fafaf9` (off-white)
- Muted: `#f5f5f4` (light gray)
- Destructive: `#d4183d` (red)

**Typography**
- Headings: Georgia serif, light weight (300), fluid sizing with `clamp()`
- Body: -apple-system, BlinkMacSystemFont fallback stack
- Font smoothing: antialiased

**Key Visual Patterns**
- Glass morphism: `backdrop-blur-xl`, semi-transparent backgrounds (`bg-card/70`)
- Soft shadows: `shadow-2xl shadow-black/[0.05]`
- Gradient accents: `bg-gradient-to-br from-secondary/60`
- Rounded corners: Primarily `rounded-2xl` and `rounded-3xl`
- Texture overlay: SVG noise on `body::before` at 1.5% opacity

**Animation Patterns**
- Custom easing: `[0.22, 1, 0.36, 1]` cubic bezier (premium feel)
- Entry animations: fade + slide (0.4-0.8s)
- Hover effects: shimmer, lift, border glow
- Complex orchestration: MatchingAnimation with 5 phases (11.5s total)
- Spring physics: stiffness 50-80, damping 20-25

### 1.4 Routing & Navigation

**Routes** (defined in `/src/main.tsx:14-18`)
1. `/` - Main application (state machine: welcome → onboarding → matching → dashboard → feedback)
2. `/showcase/listen` - Auto-playing onboarding demo
3. `/showcase/learn` - Auto-playing matching demo
4. `/showcase/connect` - Auto-playing match card demo

**State Management**
- **Local component state only** - No Redux, Zustand, or global state management
- **App.tsx** maintains top-level state: `AppState` (welcome | onboarding | matching | dashboard | feedback)
- **UserProfile** stored in component state: `{ email, name, responses }`
- **Mock data** defined inline in components (e.g., mockMatches in Dashboard.tsx)

### 1.5 Data Flow (Current - All Mock)

**Onboarding Prompts** (hardcoded in Onboarding.tsx:18-56)
```typescript
const prompts = [
  { id: 'niche_interest', question: 'What's a niche interest...', type: 'textarea' },
  { id: 'project', question: 'What's a project you're excited...', type: 'textarea' },
  { id: 'connection_type', question: 'What kind of connection...', type: 'radio', options: [...] },
  { id: 'rabbit_hole', question: 'Optional: a recent rabbit hole...', type: 'textarea', optional: true },
  { id: 'preferences', question: 'Anything that would make...', type: 'textarea', optional: true }
];
```

**Match Data** (hardcoded in Dashboard.tsx:17-36)
```typescript
const mockMatches = [
  {
    id: 1,
    name: 'Sam Rivera',
    role: 'Product Designer',
    sharedInterest: 'ceramics',
    context: 'You both mentioned ceramics — how lovely.',
    interests: ['Pottery', 'Sustainable design', 'Trail running'],
    image: 'avatar person'
  },
  // ... more mock matches
];
```

**Interest Words** (hardcoded in MatchingAnimation.tsx:20-30)
```typescript
const INTEREST_WORDS = [
  'hiking', 'photography', 'cooking', 'meditation', 'jazz',
  'startups', 'sustainability', 'travel', 'reading', 'pottery',
  // ... 45 total words
];
```

### 1.6 What's Functional vs. Visual Only

**Fully Functional (Interactive)**
✅ Form inputs (email, name, textarea responses, radio selections)
✅ Multi-step navigation (onboarding progress, back/next buttons)
✅ State transitions (welcome → onboarding → matching → dashboard → feedback)
✅ Animations (all Framer Motion animations work)
✅ Responsive design (mobile, tablet, desktop breakpoints)
✅ DevMenu navigation (Cmd+K to jump between screens)
✅ Showcase auto-play (typewriter effects, auto-advance)

**Visual Only (No Backend)**
❌ Email verification (just shows "Check your email" after 2s delay)
❌ Authentication (no magic link generation, no JWT, no session)
❌ Data persistence (all state lost on page reload)
❌ Matching algorithm (just shows canned animation, no real matching)
❌ User profiles (no database, responses not saved)
❌ Match recommendations (hardcoded mock data)
❌ Feedback collection (submission does nothing)
❌ Settings/preferences (pause toggle is visual only)

### 1.7 Backend Infrastructure Status

**Database**: ❌ NONE
- No PostgreSQL instance
- No database schema or migrations
- No ORM/query builder (no Prisma, Drizzle, TypeORM)
- No connection pooling

**API Server**: ❌ NONE
- No FastAPI, NestJS, Express, or any backend framework
- No API routes or endpoints
- No request validation
- No error handling middleware

**Authentication**: ❌ NONE
- No magic link generation
- No email token creation/verification
- No JWT signing/verification
- No session management
- No user authentication state

**Email Service**: ❌ NONE
- No Postmark or SendGrid integration
- No email templates
- No email sending logic
- No email verification

**Vector Storage & Embeddings**: ❌ NONE
- No OpenAI API integration
- No HuggingFace models
- No embedding generation
- No pgvector extension
- No vector similarity search
- No FAISS or Pinecone

**Matching Engine**: ❌ NONE
- No semantic matching algorithm
- No ANN (Approximate Nearest Neighbor) search
- No filtering logic (prior matches, blocked users, same team)
- No diversity/exposure re-ranking
- No match scoring

**Security & Compliance**: ❌ NONE
- No TLS/SSL configuration
- No encryption at rest
- No RBAC (Role-Based Access Control)
- No audit logging
- No GDPR/FERPA data export/deletion
- No safety reporting system
- No two-strike policy enforcement

**Infrastructure**: ❌ NONE
- No AWS services (RDS, S3, Lambda, ECS)
- No Docker containers
- No CI/CD pipeline
- No environment variable management (no .env file)
- No secrets management
- No monitoring/logging (no Sentry, DataDog, CloudWatch)

### 1.8 External Dependencies (Installed but Unused)

From package.json analysis:
- **react-hook-form** - Installed but not used (forms are simple controlled components)
- **recharts** - Installed but not used (likely for future admin analytics)
- **react-day-picker** - Installed but not used
- **embla-carousel-react** - Installed but not used
- **input-otp** - Installed but not used
- **cmdk** - Installed but not used
- **next-themes** - Installed but dark mode not actively implemented

---

## 2. Specification Compliance Analysis

### 2.1 Core Features Compliance Matrix

| Feature | Spec Requirement | Current Status | Gap |
|---------|-----------------|----------------|-----|
| **Magic Link Auth** | Domain-based email verification with JWT | ❌ None | 100% - Need email service, token generation, verification flow |
| **Onboarding Flow** | 5-7 open-ended prompts | ✅ Partial | 50% - UI complete, but no backend storage |
| **Semantic Embeddings** | OpenAI/HuggingFace text-to-vector | ❌ None | 100% - Need API integration, model selection |
| **Vector Search** | pgvector or Pinecone ANN search | ❌ None | 100% - Need database setup, vector storage |
| **Matching Algorithm** | Top-K candidates, filtering, re-ranking | ❌ None | 100% - Need complete algorithm implementation |
| **Double Opt-In** | Mirrored emails, both accept → intro | ❌ None | 100% - Need email service, state machine |
| **Feedback Collection** | Did you meet? Thumbs up/down | ✅ Partial | 50% - UI complete, no storage/analytics |
| **Privacy Controls** | No browsing, aggregated analytics | ❌ None | 100% - Need access control, analytics system |
| **Safety System** | Reporting, two-strike policy | ❌ None | 100% - Need reporting flow, moderation queue |

### 2.2 Tech Stack Compliance

| Component | Spec Options | Current Choice | Status |
|-----------|-------------|----------------|--------|
| **Frontend** | React (Next.js) or SvelteKit | ✅ React (Vite) | Complete |
| **Backend** | Python (FastAPI) or Node.js (NestJS) | ❌ None | Need to build |
| **Database** | PostgreSQL + pgvector | ❌ None | Need to provision |
| **Vector Search** | FAISS (dev) → Pinecone (scale) | ❌ None | Need to implement |
| **Email** | Postmark or SendGrid | ❌ None | Need to integrate |
| **Infrastructure** | AWS (RDS, S3, Lambda/ECS) | ✅ Partial (Vercel frontend only) | Need backend infra |
| **Authentication** | Magic link + JWT | ❌ None | Need to implement |

### 2.3 Data Model Compliance

**Specified Tables (from spec)**:
1. `orgs` - Organizations/companies
2. `users` - User accounts
3. `profiles` - Extended user profiles
4. `interests` - User interest responses
5. `embeddings` - Vector representations
6. `matches` - Match candidates
7. `intros` - Introduction requests (double opt-in state)
8. `feedback` - Post-match feedback
9. `safety_flags` - Reports and moderation
10. `events` - Audit log

**Current Implementation**: ❌ **Zero tables exist**

**Gap**: Need complete database schema design, migrations, and seed data.

### 2.4 Matching Pipeline Compliance

**Spec Requirements**:
1. Generate embeddings from user interests → ❌ Not implemented
2. ANN search for top-K candidates within org → ❌ Not implemented
3. Filter out prior matches, blocked users, same team → ❌ Not implemented
4. Re-rank for diversity and exposure → ❌ Not implemented
5. Send mirrored emails for double opt-in → ❌ Not implemented
6. Both accept → send mutual intro → ❌ Not implemented

**Current Implementation**: Hardcoded animation showing word clustering (purely visual)

**Gap**: 100% of matching pipeline needs to be built

### 2.5 Security & Compliance

**Spec Requirements**:
- TLS 1.2+ → ❌ No backend to configure
- AES-256 encryption at rest → ❌ No database
- GDPR/FERPA ready → ❌ No data export/deletion endpoints
- Audit logging → ❌ No logging system
- Role-based access control → ❌ No auth system

**Current Implementation**: None

**Gap**: Complete security infrastructure needed

---

## 3. Detailed Gap Analysis by Category

### 3.1 Authentication & User Management

**Missing Components**:

1. **Magic Link Generation**
   - Email token creation (JWT or random secure token)
   - Expiration handling (15-30 min)
   - Domain validation (ensure email matches allowed org domains)
   - Token storage (database table: `auth_tokens`)
   - Rate limiting (prevent abuse)

2. **Magic Link Verification**
   - Token verification endpoint
   - Token expiry check
   - User creation or login
   - Session establishment (JWT signing)
   - Redirect to onboarding or dashboard

3. **Session Management**
   - JWT generation with user claims
   - JWT verification middleware
   - Refresh token rotation
   - Session invalidation (logout)
   - Cookie configuration (httpOnly, secure, sameSite)

4. **User Data Management**
   - User CRUD operations
   - Profile updates
   - Account deletion (GDPR compliance)
   - Data export (JSON download)

**Complexity**: Moderate (4-7 days)
**Dependencies**: Email service, database, backend API

### 3.2 Database Schema & Migrations

**Missing Components**:

1. **Database Setup**
   - PostgreSQL 14+ provisioning (AWS RDS or equivalent)
   - pgvector extension installation
   - Connection pooling configuration (PgBouncer or native pooling)
   - Backup and restore strategy

2. **Schema Design** (10 tables from spec)
   ```sql
   -- Example: users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     org_id UUID REFERENCES orgs(id),
     created_at TIMESTAMP DEFAULT NOW(),
     last_active TIMESTAMP,
     status VARCHAR(50) DEFAULT 'active' -- active, paused, deleted
   );

   -- Example: embeddings table with pgvector
   CREATE TABLE embeddings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     embedding vector(1536), -- OpenAI ada-002 dimension
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
   ```

3. **Migration System**
   - Alembic (Python) or Knex/Prisma (Node.js)
   - Version control for schema changes
   - Rollback capability
   - Seed data for development

4. **ORM/Query Builder**
   - SQLAlchemy (Python) or Prisma (Node.js)
   - Type-safe queries
   - Connection management
   - Transaction handling

**Complexity**: Moderate (4-7 days)
**Dependencies**: None (foundational)

### 3.3 Onboarding Flow (Backend)

**Missing Components**:

1. **Profile Creation API**
   ```
   POST /api/onboarding
   Body: {
     email: string,
     name: string,
     responses: {
       niche_interest: string,
       project: string,
       connection_type: string,
       rabbit_hole?: string,
       preferences?: string
     }
   }
   ```
   - Input validation (email format, required fields)
   - Duplicate check (prevent re-onboarding)
   - Store user + profile in database
   - Trigger embedding generation (async job)

2. **Embedding Generation Pipeline**
   - Extract text from all responses
   - Concatenate with weights (important fields get more weight)
   - Call OpenAI API (`text-embedding-ada-002`) or HuggingFace
   - Store embedding vector in database
   - Mark user as "ready for matching"

3. **Response Validation**
   - Minimum length requirements (e.g., 20 chars for open-ended)
   - Profanity filtering (basic safety)
   - Character limits (prevent abuse)

**Complexity**: Moderate (4-7 days)
**Dependencies**: Database, embedding service, backend API

### 3.4 Embedding Generation Integration

**Missing Components**:

1. **OpenAI Integration** (Option 1)
   - API key management (environment variables)
   - Text preprocessing (cleaning, formatting)
   - API call with retry logic
   - Error handling (rate limits, API failures)
   - Cost tracking (monitor token usage)

   ```python
   import openai

   async def generate_embedding(text: str) -> list[float]:
       response = await openai.Embedding.acreate(
           model="text-embedding-ada-002",
           input=text
       )
       return response['data'][0]['embedding']
   ```

2. **HuggingFace Integration** (Option 2 - Free)
   - Model selection (sentence-transformers/all-MiniLM-L6-v2)
   - Local inference or API endpoint
   - GPU acceleration (optional)
   - Batch processing for efficiency

   ```python
   from sentence_transformers import SentenceTransformer

   model = SentenceTransformer('all-MiniLM-L6-v2')
   embedding = model.encode(text)
   ```

3. **Background Job System**
   - Celery (Python) or Bull (Node.js)
   - Redis for job queue
   - Worker processes for embedding generation
   - Job status tracking
   - Retry on failure

**Complexity**: Moderate (4-7 days)
**Dependencies**: OpenAI API key or HuggingFace model, background job system

**Decision Required**: OpenAI (paid, high quality) vs HuggingFace (free, self-hosted)

### 3.5 Vector Storage & Similarity Search

**Missing Components**:

1. **pgvector Setup**
   - Install pgvector extension on PostgreSQL
   - Create vector columns (dimension 1536 for OpenAI, 384 for MiniLM)
   - Create IVFFlat or HNSW indexes
   - Tune index parameters (lists, m, ef_construction)

2. **Similarity Search Query**
   ```sql
   -- Find top 10 most similar users within same org
   SELECT u.id, u.name, e.embedding <=> $1::vector AS distance
   FROM users u
   JOIN embeddings e ON u.id = e.user_id
   WHERE u.org_id = $2
     AND u.id != $3 -- exclude self
     AND u.status = 'active'
   ORDER BY e.embedding <=> $1::vector
   LIMIT 10;
   ```

3. **FAISS Setup (Alternative for Development)**
   - Install FAISS library
   - Build index from all embeddings
   - Serialize index to disk
   - Rebuild index on new embeddings
   - Search with k-nearest neighbors

4. **Pinecone Setup (Alternative for Scale)**
   - Pinecone account and API key
   - Create index with correct dimension
   - Upsert embeddings on user creation
   - Query with metadata filters (org_id, status)

**Complexity**: Complex (1-2 weeks)
**Dependencies**: Database with pgvector OR FAISS/Pinecone, embeddings

**Decision Required**: pgvector (simple, integrated) vs FAISS (dev) vs Pinecone (scale, cost)

### 3.6 Matching Algorithm Implementation

**Missing Components**:

1. **Candidate Generation**
   - Query vector DB for top-K similar users (K=50-100)
   - Filter by organization (only match within org)
   - Exclude self
   - Exclude inactive/paused users

2. **Filtering Logic**
   ```python
   async def filter_candidates(user_id: UUID, candidates: list[User]) -> list[User]:
       # Get prior matches
       prior_match_ids = await db.get_prior_match_ids(user_id)

       # Get blocked users
       blocked_ids = await db.get_blocked_user_ids(user_id)

       # Get same team members (if team data exists)
       same_team_ids = await db.get_same_team_ids(user_id)

       # Filter out
       filtered = [
           c for c in candidates
           if c.id not in prior_match_ids
           and c.id not in blocked_ids
           and c.id not in same_team_ids
       ]

       return filtered
   ```

3. **Re-Ranking for Diversity**
   - Track match frequency per user (don't over-recommend popular users)
   - Diversity scoring (prefer varied interests across matches)
   - Recency penalty (don't show same user too often)
   - Serendipity boost (occasionally show lower similarity matches)

4. **Match Scoring & Storage**
   - Calculate final match score (0-100)
   - Store in `matches` table
   - Mark as "pending" (awaiting user action)
   - Set expiration (e.g., 7 days to respond)

5. **Batch Matching Job**
   - Cron job (daily or weekly)
   - Generate N matches per active user (N=3-5)
   - Send notification emails
   - Respect user pause status

**Complexity**: Complex (1-2 weeks)
**Dependencies**: Vector search, database, business logic

### 3.7 Email Service Integration

**Missing Components**:

1. **Email Service Setup**
   - Postmark or SendGrid account
   - API key configuration
   - Domain verification (SPF, DKIM, DMARC)
   - Sender email address (e.g., hello@commonplace.app)

2. **Email Templates**
   - Magic link email (HTML + plain text)
   - Match notification (mirrored email to both users)
   - Mutual intro email (both accepted)
   - Feedback request email (after intro)
   - System emails (password reset, account deletion confirmation)

3. **Email Sending Logic**
   ```python
   async def send_magic_link(email: str, token: str):
       link = f"https://commonplace.app/auth/verify?token={token}"

       await email_service.send(
           to=email,
           subject="Your login link for commonplace",
           template="magic-link",
           context={"link": link, "expires_in": "15 minutes"}
       )
   ```

4. **Mirrored Match Email**
   ```python
   async def send_match_notification(user_a: User, user_b: User, match: Match):
       # Send to User A
       await email_service.send(
           to=user_a.email,
           subject=f"We found a great match: {user_b.name}",
           template="match-notification",
           context={
               "recipient_name": user_a.name,
               "match_name": user_b.name,
               "shared_interest": match.shared_interest,
               "context": match.context,
               "accept_link": f"https://commonplace.app/matches/{match.id}/accept"
           }
       )

       # Send identical structure to User B
       # Neither knows the other has been notified
   ```

5. **Email Tracking**
   - Track opens (pixel tracking)
   - Track clicks (link tracking)
   - Store in database for analytics
   - Handle bounces and unsubscribes

**Complexity**: Moderate (4-7 days)
**Dependencies**: Email service account, email templates

**Decision Required**: Postmark (simpler, transactional focus) vs SendGrid (more features, complexity)

### 3.8 Double Opt-In Flow

**Missing Components**:

1. **Introduction State Machine**
   ```
   States:
   - pending: Match generated, emails sent, awaiting responses
   - accepted_by_a: User A accepted, User B pending
   - accepted_by_b: User B accepted, User A pending
   - mutual_acceptance: Both accepted, intro email sent
   - rejected: One or both passed
   - expired: No response within time limit
   ```

2. **Accept/Pass API Endpoints**
   ```
   POST /api/matches/{match_id}/accept
   POST /api/matches/{match_id}/pass
   ```
   - Update match state
   - Check if both accepted
   - If mutual → send intro email
   - If passed → mark as rejected, hide from both

3. **Mutual Introduction Email**
   - Reveal both users to each other
   - Share contact info (email, LinkedIn if provided)
   - Suggest conversation starters
   - Include shared interests and context

4. **Privacy Enforcement**
   - User A cannot see if User B responded (until mutual acceptance)
   - No "seen" indicators
   - No browsing of who passed
   - Aggregated stats only (e.g., "You've made 5 connections this month")

**Complexity**: Moderate (4-7 days)
**Dependencies**: Email service, database, state machine logic

### 3.9 Feedback Collection (Backend)

**Missing Components**:

1. **Feedback API**
   ```
   POST /api/introductions/{intro_id}/feedback
   Body: {
     did_meet: 'yes' | 'scheduled' | 'no',
     helpful: boolean | null,
     note: string | null
   }
   ```

2. **Feedback Storage**
   - Store in `feedback` table
   - Link to introduction record
   - Timestamp submission
   - Mark as reviewed/unreviewed

3. **Analytics Aggregation**
   - Calculate match success rate (% who met)
   - Calculate helpfulness score (thumbs up/down ratio)
   - Track by organization
   - Track by match reason (shared interest categories)
   - Weekly/monthly reports

4. **Algorithm Improvement Loop**
   - Use feedback to tune matching weights
   - Identify high-performing interest combinations
   - A/B test different matching strategies
   - Retrain embeddings or adjust re-ranking

**Complexity**: Simple (1-3 days)
**Dependencies**: Database, analytics system

### 3.10 Privacy & Security

**Missing Components**:

1. **Access Control**
   - User can only see their own data
   - No directory browsing (cannot list all users)
   - No profile viewing (cannot see other profiles)
   - Match data hidden until mutual acceptance

2. **Data Encryption**
   - TLS 1.2+ for all API requests
   - AES-256 encryption at rest (database encryption)
   - Encrypted backups
   - Secure password storage (not applicable - magic link only)

3. **GDPR/FERPA Compliance**
   - Data export endpoint (JSON dump of all user data)
   - Data deletion endpoint (hard delete or anonymization)
   - Consent tracking (ToS acceptance timestamp)
   - Data retention policy (auto-delete after inactivity)

4. **Audit Logging**
   - Log all sensitive actions (login, profile edit, match accept/pass, feedback)
   - Store in `events` table
   - Include IP address, user agent, timestamp
   - Searchable for security investigations

**Complexity**: Moderate (4-7 days)
**Dependencies**: Backend API, database, compliance expertise

### 3.11 Safety & Reporting

**Missing Components**:

1. **Reporting Flow**
   - Report button on match card
   - Report reasons (harassment, inappropriate content, spam, other)
   - Optional comment
   - Submit to moderation queue

2. **Moderation Queue**
   - Admin dashboard to review reports
   - Show reporter and reported user profiles
   - Show match context and conversation history (if any)
   - Actions: warn, strike, ban, dismiss

3. **Two-Strike Policy**
   - First strike: Warning email, temporary suspension (3-7 days)
   - Second strike: Permanent ban
   - Track strikes in `safety_flags` table
   - Auto-enforce on strike threshold

4. **Safety Flags Table**
   ```sql
   CREATE TABLE safety_flags (
     id UUID PRIMARY KEY,
     reporter_id UUID REFERENCES users(id),
     reported_id UUID REFERENCES users(id),
     match_id UUID REFERENCES matches(id),
     reason VARCHAR(100),
     comment TEXT,
     status VARCHAR(50), -- pending, reviewed, actioned, dismissed
     action_taken VARCHAR(50), -- warning, strike, ban, none
     created_at TIMESTAMP,
     reviewed_at TIMESTAMP,
     reviewed_by UUID REFERENCES admins(id)
   );
   ```

**Complexity**: Moderate (4-7 days)
**Dependencies**: Admin dashboard, database, email service

### 3.12 Admin Dashboard & Analytics

**Missing Components**:

1. **Admin Authentication**
   - Separate admin user table or role flag
   - Admin login flow
   - RBAC (admin, moderator, super-admin)

2. **Dashboard Views**
   - User stats (total users, active users, paused users)
   - Match stats (total matches, acceptance rate, meeting rate)
   - Feedback summary (avg helpfulness, top complaints)
   - Safety reports queue
   - System health (API uptime, email delivery rate)

3. **Analytics Queries**
   - Daily/weekly/monthly active users
   - Match conversion funnel (notified → accepted → met)
   - Top shared interests
   - Organization breakdown
   - Cohort analysis (retention)

4. **Admin Actions**
   - View user profiles
   - Edit user data (support requests)
   - Ban/unban users
   - Resend emails
   - Trigger re-matching for specific user

**Complexity**: Complex (1-2 weeks)
**Dependencies**: Backend API, charting library, auth system

### 3.13 Infrastructure & Deployment

**Missing Components**:

1. **Backend API Deployment**
   - AWS ECS (Docker containers) or Lambda (serverless)
   - Load balancer (ALB)
   - Auto-scaling configuration
   - Environment variable management (AWS Secrets Manager or Systems Manager)

2. **Database Provisioning**
   - AWS RDS PostgreSQL 14+
   - Multi-AZ for high availability
   - Automated backups (daily snapshots)
   - Read replicas for analytics queries

3. **Storage**
   - AWS S3 for file uploads (profile photos, documents)
   - CloudFront CDN for static assets
   - Bucket policies for access control

4. **Background Jobs**
   - Redis for job queue (AWS ElastiCache)
   - Worker containers (ECS or Lambda)
   - Job monitoring (dead letter queue)

5. **Monitoring & Logging**
   - CloudWatch for logs and metrics
   - Alarms for errors, latency, downtime
   - Sentry for error tracking
   - DataDog or New Relic for APM (optional)

6. **CI/CD Pipeline**
   - GitHub Actions or AWS CodePipeline
   - Automated testing (unit, integration, e2e)
   - Deploy on merge to main
   - Blue-green or canary deployments

7. **Domain & SSL**
   - Domain registration (e.g., commonplace.app)
   - Route53 for DNS
   - ACM for SSL certificates
   - HTTPS redirect enforcement

**Complexity**: Very Complex (2+ weeks)
**Dependencies**: AWS account, DevOps expertise

---

## 4. Implementation Roadmap Recommendations

### 4.1 Phase 1: Foundation (Weeks 1-2)

**Goal**: Set up core infrastructure and database

**Tasks**:
1. Choose backend framework (FastAPI or NestJS)
2. Set up local development environment
3. Create PostgreSQL database with pgvector
4. Design and implement database schema (10 tables)
5. Set up migration system
6. Create basic API structure (routes, middleware)
7. Set up environment variable management

**Deliverables**:
- Running backend API with health check endpoint
- Database with all tables and indexes
- Migration files in version control
- README with local setup instructions

**Effort**: 7-10 days

---

### 4.2 Phase 2: Authentication & User Management (Week 3)

**Goal**: Implement magic link authentication

**Tasks**:
1. Choose email service (Postmark or SendGrid)
2. Set up email service account and verify domain
3. Create email templates (magic link, system emails)
4. Implement magic link generation API
5. Implement magic link verification API
6. Implement JWT generation and verification
7. Add auth middleware to protect routes
8. Test full auth flow end-to-end

**Deliverables**:
- POST /api/auth/request-link (send magic link)
- GET /api/auth/verify?token=... (verify and login)
- JWT-based session management
- Frontend integration (Welcome.tsx connected to real API)

**Effort**: 5-7 days

---

### 4.3 Phase 3: Onboarding & Profile Creation (Week 4)

**Goal**: Store user profiles and responses

**Tasks**:
1. Implement onboarding API endpoint
2. Validate and store user responses
3. Connect Onboarding.tsx to real API
4. Test data persistence (responses saved, reload works)

**Deliverables**:
- POST /api/onboarding (create profile)
- GET /api/profile (retrieve user profile)
- PATCH /api/profile (update profile)
- Frontend state management (persist user data)

**Effort**: 3-5 days

---

### 4.4 Phase 4: Embedding Generation (Week 5)

**Goal**: Generate embeddings from user interests

**Tasks**:
1. Choose embedding provider (OpenAI or HuggingFace)
2. Set up API keys or model download
3. Implement text preprocessing and concatenation
4. Implement embedding generation function
5. Set up background job system (Celery or Bull)
6. Create job to generate embeddings on profile creation
7. Store embeddings in database
8. Test embedding quality (manual inspection)

**Deliverables**:
- Embedding generation service
- Background job queue
- Embeddings stored in database with vector index

**Effort**: 5-7 days

---

### 4.5 Phase 5: Vector Search & Matching Algorithm (Weeks 6-7)

**Goal**: Implement matching logic

**Tasks**:
1. Implement similarity search query (pgvector or FAISS)
2. Implement filtering logic (prior matches, blocked, same team)
3. Implement re-ranking for diversity
4. Implement match scoring and storage
5. Create batch matching job (run nightly)
6. Test matching quality with seed data

**Deliverables**:
- GET /api/matches (retrieve user's current matches)
- Batch job to generate matches for all users
- Match quality metrics (diversity, relevance)

**Effort**: 10-14 days

---

### 4.6 Phase 6: Double Opt-In Flow (Week 8)

**Goal**: Implement match acceptance and introductions

**Tasks**:
1. Create match notification email template
2. Implement accept/pass API endpoints
3. Implement state machine for introduction flow
4. Create mutual introduction email template
5. Send emails on state transitions
6. Connect Dashboard.tsx and MatchCard.tsx to real API
7. Test full double opt-in flow

**Deliverables**:
- POST /api/matches/{id}/accept
- POST /api/matches/{id}/pass
- Email notifications at each stage
- Frontend integration (accept/pass buttons work)

**Effort**: 5-7 days

---

### 4.7 Phase 7: Feedback Collection (Week 9)

**Goal**: Collect post-match feedback

**Tasks**:
1. Implement feedback API endpoint
2. Send feedback request email (7 days after intro)
3. Store feedback in database
4. Connect Feedback.tsx to real API
5. Create basic analytics queries

**Deliverables**:
- POST /api/introductions/{id}/feedback
- Feedback email template
- Analytics dashboard (basic metrics)

**Effort**: 3-5 days

---

### 4.8 Phase 8: Safety & Reporting (Week 10)

**Goal**: Implement reporting and moderation

**Tasks**:
1. Create report submission flow in UI
2. Implement report API endpoint
3. Create moderation queue in admin dashboard
4. Implement two-strike policy logic
5. Send warning/ban emails
6. Test reporting flow end-to-end

**Deliverables**:
- POST /api/reports
- Admin moderation interface
- Automated strike tracking

**Effort**: 5-7 days

---

### 4.9 Phase 9: Admin Dashboard (Week 11)

**Goal**: Build admin tools and analytics

**Tasks**:
1. Create admin login flow
2. Build dashboard views (users, matches, feedback, reports)
3. Implement analytics queries
4. Add charts (Recharts integration)
5. Test admin permissions

**Deliverables**:
- Admin dashboard at /admin
- Analytics views
- User management tools

**Effort**: 5-7 days

---

### 4.10 Phase 10: Production Deployment (Week 12)

**Goal**: Deploy to AWS production environment

**Tasks**:
1. Set up AWS infrastructure (ECS, RDS, S3, CloudFront)
2. Configure production environment variables
3. Set up CI/CD pipeline
4. Configure monitoring and alerting
5. Set up backups and disaster recovery
6. Perform load testing
7. Security audit
8. Deploy to production
9. Create runbook for ops

**Deliverables**:
- Production environment live at commonplace.app
- CI/CD pipeline deploying on merge to main
- Monitoring and alerting configured
- Runbook for common operations

**Effort**: 7-10 days

---

### 4.11 Phase 11: Pilot Launch Prep (Week 13)

**Goal**: Prepare for first pilot organization

**Tasks**:
1. Create pilot onboarding checklist
2. Create user documentation (FAQ, how-to)
3. Set up support email
4. Create feedback collection process
5. Plan pilot metrics and success criteria
6. Invite pilot organization
7. Monitor and support pilot users

**Deliverables**:
- User documentation
- Support process
- Pilot metrics dashboard
- Pilot organization onboarded

**Effort**: 5-7 days

---

## 5. Technical Decisions Needed

### 5.1 Backend Framework

**Options**:
1. **FastAPI (Python)**
   - Pros: Fast, modern, auto-generated docs, type hints, async/await
   - Cons: Smaller ecosystem than Node.js, Python deployment complexity

2. **NestJS (Node.js)**
   - Pros: TypeScript, mature ecosystem, similar to React (same language), Prisma ORM
   - Cons: More boilerplate, steeper learning curve than Express

**Recommendation**: **NestJS** for TypeScript consistency with frontend, Prisma for type-safe DB access

---

### 5.2 Embedding Provider

**Options**:
1. **OpenAI (text-embedding-ada-002)**
   - Pros: Best quality, 1536 dimensions, battle-tested
   - Cons: Paid ($0.0001 per 1K tokens), requires API key, vendor lock-in

2. **HuggingFace (sentence-transformers/all-MiniLM-L6-v2)**
   - Pros: Free, self-hosted, 384 dimensions (smaller), no vendor lock-in
   - Cons: Lower quality, requires GPU for speed, maintenance overhead

**Recommendation**: **OpenAI for MVP**, switch to HuggingFace if cost becomes prohibitive

**Cost Estimate**: ~$0.01 per user onboarding (100 tokens) → $10 for 1000 users

---

### 5.3 Vector Search Strategy

**Options**:
1. **pgvector (PostgreSQL extension)**
   - Pros: Simple, integrated with main DB, no extra service, good for <1M vectors
   - Cons: Slower than specialized solutions at scale

2. **FAISS (Facebook AI Similarity Search)**
   - Pros: Fast, free, no vendor lock-in, good for development
   - Cons: In-memory (requires rebuild on deploy), no persistence without custom code

3. **Pinecone (managed vector DB)**
   - Pros: Blazing fast, scalable, managed, metadata filtering
   - Cons: Expensive ($70/mo for 100K vectors), vendor lock-in

**Recommendation**: **pgvector for MVP**, evaluate Pinecone if >100K users

---

### 5.4 Email Service

**Options**:
1. **Postmark**
   - Pros: Simple, transactional-focused, excellent deliverability, great docs
   - Cons: Slightly more expensive, fewer features

2. **SendGrid**
   - Pros: More features (marketing emails, templates), larger free tier
   - Cons: More complex, reputation issues (shared IPs)

**Recommendation**: **Postmark** for simplicity and deliverability

**Cost Estimate**: Free tier (100 emails/month), then $10/mo for 10K emails

---

### 5.5 Infrastructure & Deployment

**Options**:
1. **AWS ECS (containers)**
   - Pros: Flexible, can run any code, easier to debug, full control
   - Cons: More expensive, more ops overhead

2. **AWS Lambda (serverless)**
   - Pros: Cheaper for low traffic, auto-scaling, no server management
   - Cons: Cold starts, timeout limits (15 min), debugging harder

**Recommendation**: **ECS for API**, **Lambda for background jobs** (best of both)

---

### 5.6 Database Hosting

**Options**:
1. **AWS RDS (managed PostgreSQL)**
   - Pros: Fully managed, backups, high availability, pgvector support
   - Cons: More expensive than self-hosted

2. **Self-hosted on EC2**
   - Pros: Cheaper, full control
   - Cons: Ops overhead, backup management, no auto-scaling

**Recommendation**: **AWS RDS** - worth the cost for managed backups and HA

**Cost Estimate**: ~$30-50/mo for db.t3.micro, scale up as needed

---

## 6. Risk Areas & Potential Blockers

### 6.1 Embedding Quality & Matching Relevance

**Risk**: Embeddings may not capture nuanced interests, leading to poor matches

**Mitigation**:
- Start with manual testing and seed data
- Collect feedback early and iterate
- A/B test different embedding strategies
- Consider hybrid approach (embeddings + keyword matching)
- Add manual "re-match" button for users

---

### 6.2 Cold Start Problem

**Risk**: New users have no matches (not enough users in org)

**Mitigation**:
- Set minimum org size requirement (e.g., 50 users before enabling)
- Seed with synthetic profiles for testing
- Relax filters for small orgs (allow cross-team matches)
- Provide "coming soon" state with waitlist

---

### 6.3 Email Deliverability

**Risk**: Magic links land in spam, users can't log in

**Mitigation**:
- Use reputable email service (Postmark)
- Set up SPF, DKIM, DMARC correctly
- Warm up domain slowly (start with small batches)
- Monitor bounce rates and spam complaints
- Provide alternative login method (OTP via SMS as backup)

---

### 6.4 Privacy Leaks

**Risk**: Users discover who passed on them, browse profiles, see unmatched users

**Mitigation**:
- Strict access control in API (users can only see own data)
- No directory browsing endpoints
- Encrypt match data until mutual acceptance
- Audit all endpoints for privacy leaks
- Security review before launch

---

### 6.5 Abuse & Safety Issues

**Risk**: Harassment, inappropriate content, spam

**Mitigation**:
- Implement reporting early (Phase 8)
- Review all reports manually at first
- Build automated detection over time
- Clear ToS and community guidelines
- Respond to reports within 24 hours

---

### 6.6 Scaling & Performance

**Risk**: Slow matching, slow vector search, database overload

**Mitigation**:
- Optimize vector search queries (proper indexes)
- Run matching as batch job (not real-time)
- Cache frequently accessed data (Redis)
- Load test before launch (simulate 1000 concurrent users)
- Monitor query performance (slow query log)

---

### 6.7 Cost Overruns

**Risk**: OpenAI embeddings, infrastructure, email costs exceed budget

**Mitigation**:
- Set up billing alarms (AWS Budgets)
- Monitor costs daily (CloudWatch dashboard)
- Optimize embedding generation (batch, cache)
- Consider HuggingFace for high-volume orgs
- Charge pilot organizations to offset costs

**Estimated Monthly Cost** (for 1000 users):
- AWS RDS: $50
- AWS ECS: $30
- AWS S3/CloudFront: $5
- OpenAI embeddings: $10
- Postmark: $10
- **Total: ~$105/mo**

---

### 6.8 Team & Timeline

**Risk**: 12-week timeline is ambitious for one developer

**Mitigation**:
- Cut scope aggressively (no admin dashboard in MVP)
- Use proven libraries and frameworks (no custom auth)
- Lean on AI assistance for boilerplate
- Ship incremental versions (deploy after Phase 6, iterate)
- Get early feedback from pilot users (don't wait for perfection)

---

## 7. Recommended Build Sequence (Critical Path)

**Priority Order** (if scope must be cut):

1. **Must Have (Critical Path to Functional MVP)**:
   - Database setup (Phase 1) ✅
   - Authentication (Phase 2) ✅
   - Onboarding backend (Phase 3) ✅
   - Embeddings (Phase 4) ✅
   - Matching algorithm (Phase 5) ✅
   - Double opt-in (Phase 6) ✅
   - Production deploy (Phase 10) ✅

2. **Important (Needed for Pilot)**:
   - Feedback collection (Phase 7)
   - Safety/reporting (Phase 8)
   - Basic analytics (Phase 9 - subset)

3. **Nice to Have (Post-MVP)**:
   - Full admin dashboard (Phase 9 - full)
   - Advanced analytics (cohort analysis, retention)
   - Profile editing
   - Pause/unpause matching
   - Email preferences
   - Notification settings

**Minimum Viable Product** = Phases 1-6 + Phase 10 = **8 weeks** for core functionality

---

## 8. Next Steps

1. **Choose Tech Stack** (Backend, Embedding, Email) - Decision document required
2. **Set Up Development Environment** - Local backend + database
3. **Create Project Plan** - Detailed task breakdown with estimates
4. **Begin Phase 1** - Database schema and migrations
5. **Weekly Progress Reviews** - Track against 12-week timeline
6. **Identify Pilot Organization** - Recruit beta testers early
7. **Create Feedback Loop** - Structured process to collect and act on learnings

---

## Code References

### Current Codebase Structure

**Frontend**:
- `/src/App.tsx:1-137` - Main app with state machine and DevMenu
- `/src/main.tsx:11-20` - Routing configuration (4 routes)
- `/src/components/Welcome.tsx:1-130` - Landing page (email/name input)
- `/src/components/Onboarding.tsx:1-187` - 5-step questionnaire
- `/src/components/MatchingAnimation.tsx:1-597` - Complex matching visualization
- `/src/components/Dashboard.tsx:1-147` - Match card display
- `/src/components/MatchCard.tsx:1-143` - Individual match card
- `/src/components/Feedback.tsx:1-176` - Feedback form
- `/src/lib/animations.ts:1-98` - Centralized animation constants
- `/src/components/ui/glass-card.tsx:1-55` - Reusable glass card component
- `/src/components/ui/icon-badge.tsx:1-61` - Reusable icon badge component
- `/src/components/ui/button.tsx:1-76` - Button with premium variant and shimmer

**Styling**:
- `/src/styles/globals.css:1-215` - Theme variables, base styles, dark mode
- `/src/index.css` - Auto-generated Tailwind output (3607 lines)

**Configuration**:
- `/vite.config.ts:1-60` - Vite build configuration
- `/vercel.json:1-13` - Vercel deployment (SPA routing)
- `/package.json:1-64` - Dependencies and scripts

**Git History**:
- `875ab6f` - Configure Vercel deployment
- `4cb00a7` - Initial commit: Grove MVP showcase screens

---

## Related Research

- [Styles and Animations Implementation Analysis](thoughts/research/2025-10-18-styles-and-animations-implementation.md) - Detailed analysis of current UI/UX patterns, animation library usage, and consolidation opportunities
- [Styles and Animations Consolidation Plan](thoughts/plans/styles-animations-consolidation-plan.md) - Implementation plan for creating reusable UI components (completed)

---

## Conclusion

The Grove MVP codebase has a **polished, production-ready frontend** with excellent UI/UX design, animations, and component architecture. However, it is fundamentally a **visual prototype with zero backend infrastructure**.

To reach a functional MVP, the team must build **~85-90% of the technical specification from scratch**, including:
- Complete backend API (authentication, onboarding, matching, feedback)
- Database schema and migrations (10 tables)
- Embedding generation pipeline (OpenAI or HuggingFace)
- Vector storage and similarity search (pgvector, FAISS, or Pinecone)
- Matching algorithm (candidate generation, filtering, re-ranking)
- Email service integration (Postmark or SendGrid)
- Double opt-in flow (state machine, mirrored emails)
- Safety and reporting system
- Production infrastructure (AWS RDS, ECS, S3, monitoring)

**Recommended Timeline**: 12 weeks with aggressive scope management, focusing on critical path (Phases 1-6 + 10) first.

**Biggest Risks**: Embedding quality, email deliverability, privacy leaks, timeline slippage.

**Next Immediate Actions**:
1. Make tech stack decisions (backend framework, embedding provider, email service)
2. Set up local development environment
3. Begin Phase 1 (database schema and migrations)
