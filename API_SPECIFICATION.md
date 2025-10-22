# Grove MVP Backend API Specification

**Version**: 0.1.0
**Base URL**: `http://localhost:4000/api`
**Last Updated**: 2025-10-22
**Status**: Phase 1 Complete, Phase 2+ Planned

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Health Check](#health-check-phase-1-complete)
   - [Authentication](#authentication-endpoints-phase-2)
   - [Onboarding](#onboarding-endpoints-phase-3)
   - [Profiles](#profile-endpoints-phase-3)
   - [Matches](#match-endpoints-phase-5--6)
   - [Introductions](#introduction-endpoints-phase-6)
   - [Feedback](#feedback-endpoints-phase-8)
   - [Safety](#safety-endpoints-phase-9)
   - [Settings](#settings-endpoints-post-mvp)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Overview

The Grove MVP backend API provides endpoints for:
- Magic link authentication
- User onboarding and profile creation
- AI-powered semantic matching
- Double opt-in introduction flow
- Post-match feedback collection
- Safety reporting and moderation

**API Principles**:
- RESTful design
- JSON request/response bodies
- JWT-based authentication (after login)
- Comprehensive error messages
- Idempotent where appropriate

---

## Authentication

### Authentication Methods

1. **Magic Link** (Primary - Phase 2)
   - User requests magic link via email
   - Backend sends time-limited token
   - User clicks link, exchanges token for JWT
   - JWT used for all subsequent requests

2. **JWT Tokens** (Phase 2)
   - Access token: 15 minutes expiry
   - Refresh token: 7 days expiry
   - Include in header: `Authorization: Bearer {token}`

### Protected Routes

All endpoints except `/health` and `/auth/*` require valid JWT.

**Header Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## API Endpoints

### Health Check (Phase 1) ✅ COMPLETE

#### `GET /health`

Health check endpoint for monitoring.

**Authentication**: None required

**Response** (200 OK):
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

**Response** (503 Service Unavailable):
```json
{
  "status": "error",
  "error": {
    "database": {
      "status": "down",
      "message": "Connection failed"
    }
  }
}
```

---

### Authentication Endpoints (Phase 2)

#### `POST /api/auth/magic-link`

Request a magic link for email-based authentication.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "alice@example.com"
}
```

**Validation**:
- `email`: Required, valid email format, max 255 characters
- Must match allowed organization domain (from `orgs` table)

**Response** (200 OK):
```json
{
  "message": "Magic link sent to alice@example.com",
  "expiresIn": "15 minutes"
}
```

**Errors**:
- `400 Bad Request`: Invalid email format
- `403 Forbidden`: Email domain not allowed
- `429 Too Many Requests`: Rate limit exceeded (max 3 requests per 10 minutes)

**Side Effects**:
- Creates `AuthToken` record in database
- Sends email via Postmark with magic link

---

#### `POST /api/auth/verify`

Verify magic link token and receive JWT.

**Authentication**: None required

**Request Body**:
```json
{
  "token": "abc123def456..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "hasCompletedOnboarding": false
  }
}
```

**Errors**:
- `400 Bad Request`: Missing or invalid token
- `401 Unauthorized`: Token expired or already used
- `404 Not Found`: Token not found

**Side Effects**:
- Marks `AuthToken` as used
- Creates `User` record if first login
- Creates audit log entry in `events` table

---

#### `POST /api/auth/refresh`

Refresh access token using refresh token.

**Authentication**: Refresh token in body

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired refresh token

---

#### `POST /api/auth/logout`

Invalidate current refresh token.

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### Onboarding Endpoints (Phase 3)

#### `POST /api/onboarding`

Submit onboarding responses and create user profile.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "responses": {
    "niche_interest": "I'm really into urban beekeeping and teaching people about pollinators.",
    "project": "Building a community garden database to track crop yields across different neighborhoods.",
    "connection_type": "collaboration",
    "rabbit_hole": "Recently went deep on permaculture principles and regenerative agriculture.",
    "preferences": "I prefer async communication first, then maybe a coffee chat."
  }
}
```

**Validation**:
- All fields required except `rabbit_hole` and `preferences`
- `niche_interest`: Min 20 chars, max 500 chars
- `project`: Min 20 chars, max 500 chars
- `connection_type`: Enum ["collaboration", "mentorship", "friendship", "knowledge_exchange"]
- `rabbit_hole`: Optional, max 500 chars
- `preferences`: Optional, max 500 chars

**Response** (201 Created):
```json
{
  "profile": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "nicheInterest": "I'm really into urban beekeeping...",
    "project": "Building a community garden database...",
    "connectionType": "collaboration",
    "rabbitHole": "Recently went deep on permaculture...",
    "preferences": "I prefer async communication...",
    "createdAt": "2025-10-22T10:30:00Z"
  },
  "embeddingStatus": "queued"
}
```

**Errors**:
- `400 Bad Request`: Validation failed
- `409 Conflict`: User already completed onboarding

**Side Effects**:
- Creates `Profile` record
- Queues background job to generate embedding (Phase 4)
- Creates audit log entry

---

### Profile Endpoints (Phase 3)

#### `GET /api/profile`

Get current user's profile.

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "nicheInterest": "I'm really into urban beekeeping...",
  "project": "Building a community garden database...",
  "connectionType": "collaboration",
  "rabbitHole": "Recently went deep on permaculture...",
  "preferences": "I prefer async communication...",
  "createdAt": "2025-10-22T10:30:00Z",
  "updatedAt": "2025-10-22T10:30:00Z"
}
```

**Errors**:
- `404 Not Found`: Profile not found (user hasn't completed onboarding)

---

#### `PATCH /api/profile`

Update current user's profile (post-MVP feature).

**Authentication**: Required (JWT)

**Request Body** (all fields optional):
```json
{
  "nicheInterest": "Updated interest...",
  "project": "Updated project...",
  "preferences": "Updated preferences..."
}
```

**Response** (200 OK):
```json
{
  "profile": { /* updated profile */ },
  "embeddingStatus": "queued"
}
```

**Side Effects**:
- Queues background job to regenerate embedding
- Creates audit log entry

---

### Match Endpoints (Phase 5 & 6)

#### `GET /api/matches`

Get current matches for authenticated user.

**Authentication**: Required (JWT)

**Query Parameters**:
- `status`: Optional, filter by status (`pending`, `accepted`, `passed`, `expired`)
- `limit`: Optional, default 10, max 50

**Response** (200 OK):
```json
{
  "matches": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "candidate": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "Bob Smith",
        "role": "Product Designer"
      },
      "sharedInterest": "urban agriculture",
      "context": "You both mentioned sustainable food systems and community building.",
      "interests": ["Permaculture", "Community organizing", "Design thinking"],
      "score": 0.87,
      "status": "pending",
      "createdAt": "2025-10-22T09:00:00Z",
      "expiresAt": "2025-10-29T09:00:00Z"
    }
  ],
  "total": 3,
  "hasMore": false
}
```

**Errors**:
- `404 Not Found`: No matches found

---

#### `POST /api/matches/:matchId/accept`

Accept a match (express interest).

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "status": "accepted",
  "mutualMatch": false,
  "message": "Your interest has been noted. We'll let you know if they accept too!"
}
```

**Response** (200 OK - Mutual Match):
```json
{
  "status": "mutual_match",
  "mutualMatch": true,
  "intro": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "status": "active"
  },
  "message": "It's a match! Check your email for an introduction."
}
```

**Errors**:
- `404 Not Found`: Match not found
- `400 Bad Request`: Match already actioned or expired
- `403 Forbidden`: Not authorized to accept this match

**Side Effects**:
- Updates `Match` record status
- If mutual: Creates `Intro` record, sends mutual introduction email
- Creates audit log entry

---

#### `POST /api/matches/:matchId/pass`

Pass on a match (decline interest).

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "status": "passed",
  "message": "No worries! We'll find you better matches."
}
```

**Errors**:
- `404 Not Found`: Match not found
- `400 Bad Request`: Match already actioned or expired

**Side Effects**:
- Updates `Match` record status to `passed`
- Match hidden from both users
- Creates audit log entry

---

### Introduction Endpoints (Phase 6)

#### `GET /api/intros`

Get active introductions for authenticated user.

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "intros": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "match": {
        "name": "Carol Davis",
        "email": "carol@example.com",
        "sharedInterest": "community gardens",
        "interests": ["Urban planning", "Food systems", "Education"]
      },
      "status": "active",
      "createdAt": "2025-10-22T12:00:00Z"
    }
  ]
}
```

---

### Feedback Endpoints (Phase 8)

#### `POST /api/intros/:introId/feedback`

Submit feedback after an introduction.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "didMeet": "yes",
  "helpful": true,
  "note": "Great conversation! We're planning a project together."
}
```

**Validation**:
- `didMeet`: Required, enum ["yes", "scheduled", "no"]
- `helpful`: Optional, boolean
- `note`: Optional, max 1000 chars

**Response** (201 Created):
```json
{
  "message": "Thank you for your feedback!",
  "feedback": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "didMeet": "yes",
    "helpful": true,
    "createdAt": "2025-10-29T14:00:00Z"
  }
}
```

**Errors**:
- `404 Not Found`: Introduction not found
- `409 Conflict`: Feedback already submitted

---

### Safety Endpoints (Phase 9)

#### `POST /api/reports`

Report a user for safety concerns.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "reportedUserId": "880e8400-e29b-41d4-a716-446655440003",
  "matchId": "770e8400-e29b-41d4-a716-446655440002",
  "reason": "harassment",
  "comment": "Received inappropriate messages after intro."
}
```

**Validation**:
- `reportedUserId`: Required, valid UUID
- `matchId`: Optional, valid UUID (context for report)
- `reason`: Required, enum ["harassment", "inappropriate_content", "spam", "safety_concern", "other"]
- `comment`: Optional, max 2000 chars

**Response** (201 Created):
```json
{
  "message": "Report submitted. Our team will review within 24 hours.",
  "report": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "status": "pending",
    "createdAt": "2025-10-29T15:00:00Z"
  }
}
```

**Side Effects**:
- Creates `SafetyFlag` record
- Sends notification to moderation team
- Creates audit log entry

---

### Settings Endpoints (Post-MVP)

#### `PATCH /api/settings`

Update user settings.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "status": "paused",
  "emailNotifications": false
}
```

**Response** (200 OK):
```json
{
  "settings": {
    "status": "paused",
    "emailNotifications": false,
    "updatedAt": "2025-10-30T10:00:00Z"
  }
}
```

---

## Data Models

### User
```typescript
{
  id: string;                    // UUID
  email: string;                 // Unique
  name: string;
  orgId: string;                 // UUID - Organization FK
  status: 'active' | 'paused' | 'deleted';
  createdAt: Date;
  lastActive: Date;
}
```

### Profile
```typescript
{
  id: string;                    // UUID
  userId: string;                // UUID - User FK
  nicheInterest: string;
  project: string;
  connectionType: 'collaboration' | 'mentorship' | 'friendship' | 'knowledge_exchange';
  rabbitHole?: string;
  preferences?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Match
```typescript
{
  id: string;                    // UUID
  userId: string;                // UUID - User FK
  candidateId: string;           // UUID - User FK
  score: number;                 // 0-1 similarity score
  reason: string;                // Shared interest explanation
  status: 'pending' | 'accepted' | 'passed' | 'expired';
  userAction?: Date;             // When user acted
  candidateAction?: Date;        // When candidate acted
  expiresAt: Date;
  createdAt: Date;
}
```

### Intro
```typescript
{
  id: string;                    // UUID
  matchId: string;               // UUID - Match FK
  userAId: string;               // UUID - User FK
  userBId: string;               // UUID - User FK
  status: 'active' | 'completed' | 'expired';
  emailSentAt: Date;
  createdAt: Date;
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "constraint": "isEmail",
      "message": "email must be a valid email"
    }
  ]
}
```

### Standard HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Valid JWT but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., already exists)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Rate Limiting

**Global Limits**:
- 100 requests per minute per IP
- 1000 requests per hour per user (authenticated)

**Endpoint-Specific Limits**:
- `POST /api/auth/magic-link`: 3 requests per 10 minutes per email
- `POST /api/reports`: 5 requests per day per user

**Rate Limit Response** (429):
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfter": 600
}
```

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635789600
```

---

## Implementation Status

| Endpoint | Phase | Status | Notes |
|----------|-------|--------|-------|
| `GET /health` | 1 | ✅ Complete | - |
| `POST /api/auth/magic-link` | 2 | 🔄 Pending | - |
| `POST /api/auth/verify` | 2 | 🔄 Pending | - |
| `POST /api/auth/refresh` | 2 | 🔄 Pending | - |
| `POST /api/auth/logout` | 2 | 🔄 Pending | - |
| `POST /api/onboarding` | 3 | 🔄 Pending | - |
| `GET /api/profile` | 3 | 🔄 Pending | - |
| `PATCH /api/profile` | Post-MVP | ⏸️ Deferred | - |
| `GET /api/matches` | 5 | 🔄 Pending | - |
| `POST /api/matches/:id/accept` | 6 | 🔄 Pending | - |
| `POST /api/matches/:id/pass` | 6 | 🔄 Pending | - |
| `GET /api/intros` | 6 | 🔄 Pending | - |
| `POST /api/intros/:id/feedback` | 8 | 🔄 Pending | Optional phase |
| `POST /api/reports` | 9 | 🔄 Pending | Optional phase |
| `PATCH /api/settings` | Post-MVP | ⏸️ Deferred | - |

---

**Document Version**: 0.1.0
**Last Updated**: 2025-10-22 (Phase 1 Complete)
**Next Update**: After Phase 2 (Authentication endpoints implemented)
