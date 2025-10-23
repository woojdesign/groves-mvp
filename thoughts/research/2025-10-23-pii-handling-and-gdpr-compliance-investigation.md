---
doc_type: research
date: 2025-10-23T03:38:21+00:00
title: "PII Handling and GDPR Compliance Investigation"
research_question: "How is PII collected, stored, protected, and managed? What is the current GDPR compliance status?"
researcher: Sean Kim

git_commit: 2671747e9859dba4c277febb1733004787629183
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-23
last_updated_by: Sean Kim

tags:
  - pii
  - gdpr
  - compliance
  - security
  - privacy
  - data-protection
status: complete

related_docs: []
---

# Research: PII Handling and GDPR Compliance Investigation

**Date**: October 23, 2025, 3:38 AM UTC
**Researcher**: Sean Kim
**Git Commit**: 2671747e9859dba4c277febb1733004787629183
**Branch**: main
**Repository**: workspace

## Research Question

How is Personally Identifiable Information (PII) collected, stored, protected, and managed in the Grove MVP codebase? What is the current GDPR compliance status, including implementation of user rights (access, erasure, rectification, portability)?

## Executive Summary

Grove collects significant PII including names, emails, work interests, projects, connection preferences, and behavioral data. Current PII protection is **minimal** with critical gaps in encryption, GDPR user rights implementation, and privacy controls. The application has **no formal GDPR compliance mechanisms** - missing data export, deletion, consent management, and privacy documentation. JWT authentication and rate limiting provide basic API security, but field-level encryption, audit logging (IP/user-agent tracking), and data retention policies are absent.

**Overall GDPR Compliance Status**: NON-COMPLIANT

## Detailed Findings

### 1. PII Data Collection & Storage

#### 1.1 User Table PII (grove-backend/prisma/schema.prisma:32-56)

The `User` model stores core identity PII:
- `email` (String, unique) - Line 34
- `name` (String) - Line 35
- `orgId` (String) - Line 36 (organizational affiliation)
- `status` (String) - Line 37 (active, paused, deleted)
- `lastActive` (DateTime) - Line 38

**Cascading Deletion**: User deletion cascades to Profile, Embedding, Match, Feedback, SafetyFlag, and Event records via `onDelete: Cascade` (Lines 42-50).

#### 1.2 Profile Table PII (grove-backend/prisma/schema.prisma:61-75)

The `Profile` model stores detailed personal interests and preferences:
- `nicheInterest` (Text) - Line 64 - User's niche interests
- `project` (Text) - Line 65 - Current projects/goals
- `connectionType` (String) - Line 66 - Desired relationship type
- `rabbitHole` (Text, optional) - Line 67 - Recent obsessions
- `preferences` (Text, optional) - Line 68 - Communication preferences

All fields are collected via onboarding flow in src/components/Onboarding.tsx:22-60.

#### 1.3 Organization Table (grove-backend/prisma/schema.prisma:16-27)

- `name` (String) - Organization name
- `domain` (String, unique) - Email domain for org membership

#### 1.4 Auth Tokens (grove-backend/prisma/schema.prisma:208-220)

Magic link authentication tokens:
- `email` (String) - Line 210
- `token` (String, unique) - Line 211 - 128 hex character token
- `expiresAt` (DateTime) - Line 212 - 15 minute expiration
- `used` (Boolean) - Line 213

#### 1.5 Events Table - Audit Logging (grove-backend/prisma/schema.prisma:188-203)

**CRITICAL**: The Events table is designed to collect IP addresses and user agents:
- `ipAddress` (String, optional) - Line 193
- `userAgent` (String, optional, Text) - Line 194
- `eventType` (String) - Line 191 - Event classification
- `metadata` (Json, optional) - Line 192 - Additional event data

**Current Implementation Status**: NO IP/user-agent collection is currently implemented in the codebase. Events are logged but WITHOUT ipAddress/userAgent fields populated.

Event creation examples:
- grove-backend/src/auth/auth.service.ts:145-151 - Login events
- grove-backend/src/auth/auth.service.ts:204-210 - Logout events
- grove-backend/src/profiles/profiles.service.ts:50-56 - Profile creation
- grove-backend/src/profiles/profiles.service.ts:116-122 - Profile updates
- grove-backend/src/intros/intros.service.ts:69-82 - Intro creation

#### 1.6 Match and Intro Data (grove-backend/prisma/schema.prisma:98-139)

Matches store:
- `userAId`, `userBId` - Line 100-101 - User identifiers
- `sharedInterest` (String) - Line 103 - Matching reason
- `context` (Text) - Line 104 - Detailed explanation
- `expiresAt` (DateTime) - Line 106 - Match expiration

Intros expose full PII to matched users:
- Names and emails shared via grove-backend/src/intros/intros.service.ts:94-119
- Email service sends PII: grove-backend/src/email/email.service.ts:103-139

#### 1.7 Feedback Table (grove-backend/prisma/schema.prisma:144-159)

- `didMeet` (String) - Line 148 - Meeting status
- `helpful` (Boolean) - Line 149
- `note` (Text) - Line 150 - Free-form text feedback

#### 1.8 Safety Flags (grove-backend/prisma/schema.prisma:164-183)

User-generated reports contain:
- `reporterId`, `reportedId` - Lines 166-167
- `reason` (String) - Line 169
- `comment` (Text) - Line 170
- `reviewedBy` (String) - Line 174 - Moderator identifier

### 2. PII Protection Mechanisms

#### 2.1 Authentication & Token Security

**Magic Link Token Generation** (grove-backend/src/auth/auth.service.ts:46-61):
- Uses Node.js `crypto.randomBytes(64)` for secure random tokens (128 hex characters)
- Tokens stored in plaintext in database (AuthToken table)
- 15-minute expiration enforced
- Single-use tokens (marked as `used: true` after verification)

**JWT Tokens** (grove-backend/src/auth/auth.service.ts:153-160):
- Access token: 15 minute expiration
- Refresh token: 7 day expiration
- JWT secret from environment variable: `JWT_SECRET` (grove-backend/.env.example:5)
- Tokens stored in browser localStorage (src/lib/api.ts:30-48)

**No Password Storage**: Application uses passwordless magic link authentication only.

#### 2.2 Database Encryption

**Prisma Service** (grove-backend/src/prisma/prisma.service.ts):
- No field-level encryption configured
- No database encryption at rest settings
- Standard PrismaClient with basic connection pooling
- Connection string from `DATABASE_URL` environment variable

**Database Connection Security**:
- SSL/TLS depends on DATABASE_URL configuration (not enforced in code)
- No explicit encryption configuration in Prisma schema

**Field-Level Encryption**: NOT IMPLEMENTED

#### 2.3 API Security

**JWT Authentication Guard** (grove-backend/src/auth/guards/jwt-auth.guard.ts):
- Protects all routes except those marked with `@Public()` decorator
- JWT Strategy validates tokens (grove-backend/src/auth/strategies/jwt.strategy.ts)

**Rate Limiting** (grove-backend/src/auth/auth.controller.ts:23):
- Magic link endpoint: 3 requests per 10 minutes
- Configured via `@Throttle` decorator

**Input Validation** (DTOs):
- CreateProfileDto validates onboarding input (grove-backend/src/profiles/dto/create-profile.dto.ts):
  - `nicheInterest`: 20-500 characters (Lines 13-17)
  - `project`: 20-500 characters (Lines 22-25)
  - `connectionType`: Enum validation (Line 30)
  - `rabbitHole`, `preferences`: Max 500 characters (Lines 37-43)

**CORS Configuration**: Not examined in core files reviewed.

#### 2.4 Environment Variable Security

Sensitive configuration externalized (grove-backend/.env.example):
- `DATABASE_URL` - Line 2
- `JWT_SECRET` - Line 5
- `OPENAI_API_KEY` - Line 13
- `POSTMARK_API_KEY` - Line 17
- `POSTMARK_FROM_EMAIL` - Line 18

No encryption key management or secrets rotation detected.

### 3. GDPR User Rights Implementation

#### 3.1 Right to Access (Data Export)

**STATUS: NOT IMPLEMENTED**

No data export functionality exists:
- No `/users/me/data` or `/export` endpoints
- No API methods to retrieve complete user data in machine-readable format
- Users can only access profile via `GET /profile` (grove-backend/src/profiles/profiles.controller.ts:29-32)

**Gap**: Users cannot download all their data including:
- Profile information
- Match history
- Intro history
- Feedback submitted
- Event logs
- Safety reports made

#### 3.2 Right to Erasure (Data Deletion)

**STATUS: PARTIALLY IMPLEMENTED (Soft Delete Only)**

User status field supports "deleted" state:
- User.status can be set to "deleted" (grove-backend/prisma/schema.prisma:37)
- Deleted users blocked from token refresh (grove-backend/src/auth/auth.service.ts:186)

**CRITICAL GAPS**:
- No user-facing deletion endpoint
- No hard delete mechanism
- No data anonymization on deletion
- Cascade deletes configured BUT no actual delete endpoints implemented
- Deleted user data remains in database
- No "right to be forgotten" workflow

**What happens**: User account can be marked as deleted, but PII remains in the database indefinitely.

#### 3.3 Right to Rectification (Data Update)

**STATUS: PARTIALLY IMPLEMENTED**

Users can update their profile:
- `PATCH /profile` endpoint (grove-backend/src/profiles/profiles.controller.ts:34-40)
- UpdateProfileDto allows modifying profile fields (grove-backend/src/profiles/dto/update-profile.dto.ts)

**GAPS**:
- Cannot update `email` or `name` fields in User table
- No UI for changing primary identity information
- No email change workflow with verification

#### 3.4 Data Portability

**STATUS: NOT IMPLEMENTED**

No structured data export in machine-readable format (JSON, XML, CSV).

#### 3.5 Consent Management

**STATUS: NOT IMPLEMENTED**

No consent tracking mechanisms:
- No terms of service acceptance tracking
- No privacy policy acceptance
- No opt-in/opt-out preferences
- No cookie consent
- No data processing consent records

Onboarding disclaimer exists but not tracked (src/components/Onboarding.tsx:239-241):
> "Your answers help us find meaningful matches — they're never shared publicly"

**Gap**: No database field tracks consent, acceptance timestamp, or version of terms accepted.

### 4. PII Exposure in API Responses

#### 4.1 Match Candidates (grove-backend/src/matching/dto/match-candidate.dto.ts)

Exposed to users viewing potential matches:
- `candidateId` - Line 7 - User ID
- `name` - Line 8 - Full name
- `score` - Line 9 - Match score
- `reason` - Line 10 - Why they matched
- `sharedInterests` - Line 11 - Interest overlap

**Privacy Control**: NO granular privacy settings. All active users are matchable.

#### 4.2 Introductions (grove-backend/src/intros/dto/intro-response.dto.ts)

After mutual acceptance, full PII exposed:
- `name` - Line 9
- `email` - Line 10
- `sharedInterest` - Line 11
- `interests` - Line 12

**Double Opt-In**: Provides consent mechanism before PII sharing (both users must accept).

#### 4.3 Email Communications

Match notification emails (grove-backend/src/email/email.service.ts:60-100):
- Share matched user's name, score, shared interests

Mutual introduction emails (grove-backend/src/email/email.service.ts:103-139):
- Share both users' names and emails
- Sent via Postmark API

### 5. Logging and PII Leakage

#### 5.1 Logging Approach

**NestJS Logger** used throughout:
- grove-backend/src/auth/auth.service.ts:15 - `private logger = new Logger(AuthService.name)`
- grove-backend/src/profiles/profiles.service.ts:18

**Console.log Usage** (minimal):
- grove-backend/src/prisma/prisma.service.ts:11 - "Database connected"
- grove-backend/src/prisma/prisma.service.ts:16 - "Database disconnected"
- grove-backend/src/main.ts:33-34 - Server startup
- grove-backend/src/matching/matching.service.ts:127, 145 - Error logging for email failures

#### 5.2 PII in Logs

**Email Logging** (grove-backend/src/auth/auth.service.ts):
- Line 28: `this.logger.log('Magic link requested for: ${email}')` - LOGS EMAIL
- Line 39: `this.logger.warn('Attempt to request magic link for unallowed domain: ${domain}')` - LOGS DOMAIN
- Line 52: Email service logs: `Magic link email sent to ${to}` (grove-backend/src/email/email.service.ts:52)

**User ID Logging**:
- grove-backend/src/profiles/profiles.service.ts:73-74 - Logs userId with profile creation
- grove-backend/src/profiles/profiles.service.ts:126-128, 144-145 - Logs userId with profile updates

**Error Responses**: No review of exception filters, but NestJS default exception handling may expose stack traces in development mode.

#### 5.3 Audit Trail

Events logged to database WITHOUT IP/user-agent (currently):
- `login` events (grove-backend/src/auth/auth.service.ts:148)
- `logout` events (grove-backend/src/auth/auth.service.ts:207)
- `profile_created` (grove-backend/src/profiles/profiles.service.ts:52)
- `profile_updated` (grove-backend/src/profiles/profiles.service.ts:118)
- `intro_created` (grove-backend/src/intros/intros.service.ts:71-77)

**Schema supports IP/user-agent collection** but NOT implemented in code.

### 6. Data Retention and Minimization

#### 6.1 Data Retention Policies

**STATUS: NOT IMPLEMENTED**

No automated data cleanup mechanisms found:
- No cron jobs or scheduled tasks
- No TTL (time-to-live) configurations
- No data archival processes
- No automated purging of old records

#### 6.2 Token Expiration

**Auth Tokens**:
- 15-minute expiration enforced (grove-backend/src/auth/auth.service.ts:49-51)
- Expired tokens rejected in verification (Line 93-94)
- No cleanup job to delete expired/used tokens

**Match Expiration**:
- Schema supports `expiresAt` field (grove-backend/prisma/schema.prisma:106)
- No code implements match expiration logic or cleanup

**Intro Expiration**:
- No expiration mechanism for introductions

#### 6.3 Data Minimization Assessment

**Required vs Optional Fields**:
- User name: Required but initialized as empty string (grove-backend/src/auth/auth.service.ts:130)
- Email: Required (authentication identifier)
- Profile fields: nicheInterest, project, connectionType required; rabbitHole, preferences optional
- Event metadata: Optional JSON field (potential for over-collection)

**Preferences Field** (grove-backend/prisma/schema.prisma:68):
- Free-form text field with no schema
- Could collect excessive PII based on user input
- No validation on content

#### 6.4 Soft Delete vs Hard Delete

**User Status** (grove-backend/prisma/schema.prisma:37):
- Supports "active", "paused", "deleted" states
- "Deleted" users blocked from authentication (grove-backend/src/auth/auth.service.ts:186)
- Data RETAINED in database (soft delete only)

**No Hard Delete**: No code to permanently remove user records from database.

**No Anonymization**: No mechanism to anonymize PII while retaining aggregate data.

### 7. Frontend PII Handling

#### 7.1 Token Storage

JWT tokens stored in browser localStorage (src/lib/api.ts:12-48):
- `grove_access_token` - Line 12
- `grove_refresh_token` - Line 13

**Security Concern**: localStorage accessible to JavaScript (XSS vulnerability). HttpOnly cookies would be more secure.

#### 7.2 Onboarding Data Collection

Frontend form collects all profile PII (src/components/Onboarding.tsx:22-60):
- Niche interest (textarea)
- Project (textarea)
- Connection type (radio selection)
- Rabbit hole (optional textarea)
- Preferences (optional textarea)

Client-side validation enforces character limits before submission.

#### 7.3 Cookie Usage

**Cookie Consent**: NOT IMPLEMENTED

Only cookie found: sidebar state cookie (src/components/ui/sidebar.tsx - mentioned in grep but not read in detail).

No analytics cookies, tracking cookies, or third-party cookies detected.

#### 7.4 Analytics and Tracking

**STATUS: NOT IMPLEMENTED**

No Google Analytics, tracking pixels, or third-party analytics found in codebase search.

### 8. Privacy Documentation

#### 8.1 Privacy Policy

**STATUS: DOES NOT EXIST**

No privacy policy document found in codebase.

#### 8.2 Terms of Service

**STATUS: DOES NOT EXIST**

No terms of service document found.

#### 8.3 GDPR Compliance Documentation

**STATUS: DOES NOT EXIST**

No GDPR compliance documentation or data processing agreements.

#### 8.4 Data Processing Register

**STATUS: DOES NOT EXIST**

No formal documentation of:
- What PII is collected
- Why it's collected
- How long it's retained
- Who has access
- Third-party processors

#### 8.5 User-Facing Privacy Information

Only privacy notice: Onboarding disclaimer (src/components/Onboarding.tsx:239-241):
> "Your answers help us find meaningful matches — they're never shared publicly"

**Misleading**: User data IS shared with matched users after mutual opt-in.

### 9. Third-Party Data Processors

#### 9.1 Postmark (Email Service)

PII sent to Postmark (grove-backend/src/email/email.service.ts):
- User emails (recipients)
- Names
- Match details
- Shared interests

**Data Processing Agreement**: Not verified in codebase.

#### 9.2 OpenAI (Embeddings)

Profile text sent to OpenAI API (grove-backend/src/openai/openai.service.ts - not read but referenced):
- Niche interests
- Projects
- Rabbit holes

**GDPR Consideration**: OpenAI processes EU user data. DPA required.

#### 9.3 PostgreSQL Database

Database provider not specified (could be AWS RDS, Supabase, etc.).

**Encryption at Rest**: Not configured in code (depends on hosting provider).

#### 9.4 Redis (BullMQ)

Used for job queues (grove-backend/.env.example:21-22):
- May temporarily store user IDs and profile IDs
- Retention policy not defined

## Code References

### Database Schema
- `/workspace/grove-backend/prisma/schema.prisma:1-221` - Complete database schema

### PII Collection
- `/workspace/grove-backend/prisma/schema.prisma:32-56` - User model
- `/workspace/grove-backend/prisma/schema.prisma:61-75` - Profile model
- `/workspace/grove-backend/prisma/schema.prisma:188-203` - Events table (audit logs with IP/UA fields)
- `/workspace/src/components/Onboarding.tsx:22-60` - Frontend onboarding prompts

### Authentication & Security
- `/workspace/grove-backend/src/auth/auth.service.ts:46-61` - Token generation
- `/workspace/grove-backend/src/auth/auth.service.ts:153-160` - JWT token creation
- `/workspace/grove-backend/src/auth/auth.controller.ts:23` - Rate limiting
- `/workspace/grove-backend/src/auth/guards/jwt-auth.guard.ts` - Auth guard
- `/workspace/src/lib/api.ts:30-48` - Frontend token storage

### API Endpoints & PII Exposure
- `/workspace/grove-backend/src/profiles/profiles.controller.ts:20-40` - Profile CRUD
- `/workspace/grove-backend/src/matching/matching.controller.ts:33-67` - Match endpoints
- `/workspace/grove-backend/src/intros/intros.controller.ts:26-33` - Intro endpoint
- `/workspace/grove-backend/src/matching/dto/match-candidate.dto.ts:1-16` - Match response DTO
- `/workspace/grove-backend/src/intros/dto/intro-response.dto.ts:1-17` - Intro response DTO

### Logging
- `/workspace/grove-backend/src/auth/auth.service.ts:28` - Email logging
- `/workspace/grove-backend/src/email/email.service.ts:52` - Email service logging
- `/workspace/grove-backend/src/prisma/prisma.service.ts:11,16` - DB connection logs

### Event Audit Trail
- `/workspace/grove-backend/src/auth/auth.service.ts:145-151` - Login event
- `/workspace/grove-backend/src/profiles/profiles.service.ts:50-56` - Profile creation event
- `/workspace/grove-backend/src/intros/intros.service.ts:69-82` - Intro creation events

### Email PII Sharing
- `/workspace/grove-backend/src/email/email.service.ts:60-100` - Match notifications
- `/workspace/grove-backend/src/email/email.service.ts:103-139` - Mutual introductions
- `/workspace/grove-backend/src/intros/intros.service.ts:94-119` - Email sending logic

## GDPR Compliance Gaps Summary

### CRITICAL GAPS (Must Address)

1. **Right to Access - NOT IMPLEMENTED**
   - No data export endpoint
   - No ability to download all user data
   - Impact: GDPR Article 15 violation

2. **Right to Erasure - NOT IMPLEMENTED**
   - No user-facing deletion endpoint
   - Only soft delete (data retained)
   - No anonymization mechanism
   - Impact: GDPR Article 17 violation

3. **Consent Management - NOT IMPLEMENTED**
   - No consent tracking
   - No terms/privacy policy acceptance records
   - Impact: GDPR Article 7 violation

4. **Privacy Documentation - MISSING**
   - No privacy policy
   - No terms of service
   - No data processing documentation
   - Impact: GDPR Article 13 transparency requirement violation

5. **Data Processing Agreements - UNKNOWN**
   - Postmark DPA not verified
   - OpenAI DPA not verified
   - Impact: GDPR Article 28 violation

6. **Data Retention Policy - NOT IMPLEMENTED**
   - No automated data cleanup
   - No defined retention periods
   - Auth tokens accumulate without cleanup
   - Impact: GDPR Article 5(1)(e) violation

### HIGH PRIORITY GAPS

7. **Data Portability - NOT IMPLEMENTED**
   - No structured export (JSON/CSV)
   - Impact: GDPR Article 20 violation

8. **Field-Level Encryption - NOT IMPLEMENTED**
   - PII stored in plaintext
   - No encryption at rest in application layer
   - Impact: GDPR Article 32 security requirement

9. **Rectification Limitations**
   - Cannot update email or name
   - Impact: GDPR Article 16 partial violation

10. **IP Address Collection Schema**
    - Events table prepared to collect IP/user-agent
    - Not currently implemented but schema exists
    - Risk: Could be enabled without privacy assessment

### MEDIUM PRIORITY GAPS

11. **localStorage for JWT Tokens**
    - XSS vulnerability risk
    - HttpOnly cookies recommended
    - Impact: Security best practice

12. **PII in Application Logs**
    - Emails logged in auth service
    - User IDs logged throughout
    - Impact: Potential log data breach exposure

13. **No Anonymization Strategy**
    - Deleted users retain all PII
    - No aggregate data retention with anonymization

14. **Free-Form Preferences Field**
    - No validation on content
    - Users could enter excessive PII
    - No data minimization controls

## Recommendations for GDPR Readiness

### Immediate Actions (Week 1-2)

1. **Create Privacy Policy & Terms of Service**
   - Document what data is collected and why
   - Explain user rights
   - Detail data retention periods
   - Identify third-party processors

2. **Implement Consent Tracking**
   - Add `termsAcceptedAt` and `privacyPolicyVersion` to User model
   - Force acceptance before onboarding
   - Log consent in Events table

3. **Build Data Export Endpoint**
   - `GET /users/me/data` returns JSON export
   - Include: user, profile, matches, intros, feedback, events
   - Format: JSON or CSV

4. **Build Data Deletion Endpoint**
   - `DELETE /users/me` with confirmation
   - Implement hard delete OR full anonymization
   - Delete from all tables or anonymize PII fields
   - Retain aggregated non-PII data if needed

5. **Verify Third-Party DPAs**
   - Confirm Postmark GDPR compliance
   - Confirm OpenAI Data Processing Agreement
   - Document in privacy policy

### Short-Term Actions (Month 1)

6. **Implement Data Retention Policy**
   - Define retention periods for each data type
   - Build cron job to purge expired auth tokens
   - Archive or delete old matches/intros after X months
   - Document policy in privacy policy

7. **Add Field-Level Encryption**
   - Encrypt sensitive fields (name, email, profile text)
   - Use Prisma middleware or application-layer encryption
   - Encryption at rest via database provider

8. **Remove PII from Logs**
   - Redact emails in log statements
   - Use user IDs only (not emails or names)
   - Implement structured logging with PII filters

9. **Enable User Profile Updates**
   - Allow email changes with verification
   - Allow name updates
   - Full PATCH /profile implementation

10. **Cookie Consent Banner (if analytics added)**
    - Only if third-party cookies introduced
    - Currently not needed

### Medium-Term Actions (Month 2-3)

11. **Implement IP/User-Agent Privacy Controls**
    - Decide if IP/user-agent collection is necessary
    - If yes: Document in privacy policy, allow opt-out
    - If no: Remove fields from Event schema

12. **Migrate JWT to HttpOnly Cookies**
    - More secure than localStorage
    - Prevents XSS token theft
    - Requires CORS configuration

13. **Add Privacy Settings UI**
    - Allow users to control data sharing
    - Opt-out of matching
    - Control profile visibility

14. **Data Minimization Review**
    - Validate if all collected fields are necessary
    - Add stricter validation on preferences field
    - Consider removing optional fields if unused

15. **Security Audit**
    - Penetration testing
    - OWASP Top 10 review
    - Database access controls

### Long-Term Actions (Month 3+)

16. **Appoint Data Protection Officer (if required)**
    - Required for large-scale processing

17. **Data Breach Response Plan**
    - Incident response procedures
    - 72-hour notification process (GDPR requirement)

18. **Regular Compliance Audits**
    - Quarterly reviews of data practices
    - Update privacy policy as features change

19. **User Notification System**
    - Email users about privacy policy updates
    - Get re-consent if material changes

20. **Consider Data Residency**
    - EU user data in EU regions
    - Database region selection

## Historical Context

No prior GDPR or privacy research documents found in thoughts/ directory. This is the first comprehensive privacy assessment for Grove MVP.

## Related Research

None identified (first privacy/compliance research).

## Open Questions

1. **Database Hosting Provider**: Where is PostgreSQL hosted? AWS RDS, Supabase, Heroku? Encryption at rest configuration?
2. **Production Environment**: Are there production-specific security configurations not in .env.example?
3. **OpenAI DPA**: Has a Data Processing Agreement been signed with OpenAI?
4. **Postmark DPA**: Has a Data Processing Agreement been signed with Postmark?
5. **Target Market**: Is Grove targeting EU users? If so, GDPR is mandatory. If US-only, still best practice.
6. **Exception Handling**: Does NestJS expose stack traces or PII in production error responses?
7. **Database Backups**: How are backups handled? Are they encrypted? How long are they retained?
8. **Employee Access**: Who has access to production database? Access logs?
9. **Data Breach History**: Any past incidents or near-misses?
10. **Compliance Timeline**: What is the target date for GDPR compliance?

---

**Research Completed**: October 23, 2025, 3:38 AM UTC
**Next Steps**: Review findings with legal/compliance team, prioritize implementation roadmap, assign owners to each gap.
