# Phase 2: Authentication API Testing Guide

This guide provides example requests for testing the authentication endpoints.

## Prerequisites

1. Start the database and backend:
```bash
# From /workspace/grove-backend
docker compose up -d postgres redis
npm run start:dev
```

2. Ensure you have an organization in the database (created via seed data):
```sql
-- Example org domains from seed:
-- example.com
-- acme.org
-- techcorp.io
```

## API Endpoints

Base URL: `http://localhost:4000/api`

### 1. Request Magic Link

**Endpoint**: `POST /api/auth/magic-link`

**Request**:
```bash
curl -X POST http://localhost:4000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com"
  }'
```

**Response** (200 OK):
```json
{
  "message": "Magic link sent to alice@example.com",
  "expiresIn": "15 minutes"
}
```

**Rate Limiting**: Max 3 requests per 10 minutes per email

**Notes**:
- Email domain must exist in `orgs` table
- Token is stored in `auth_tokens` table
- Magic link is sent via Postmark (check .env for POSTMARK_API_KEY)
- For testing without email: Check database for token directly:
  ```sql
  SELECT token FROM auth_tokens WHERE email = 'alice@example.com'
  ORDER BY created_at DESC LIMIT 1;
  ```

---

### 2. Verify Magic Link Token

**Endpoint**: `POST /api/auth/verify`

**Request**:
```bash
curl -X POST http://localhost:4000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456..."
  }'
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

**Notes**:
- Token must be valid, unused, and not expired (15 minutes)
- Creates user if first login
- Returns JWT access token (15 min expiry)
- Returns refresh token (7 day expiry)
- Creates audit log entry in `events` table

---

### 3. Refresh Access Token

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes**:
- Refresh token must be valid and not expired
- Returns new access token (15 min expiry)

---

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

**Authentication**: Required (JWT access token)

**Request**:
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Notes**:
- Requires valid JWT access token
- Creates logout event in `events` table

---

## Testing Protected Routes

Once you have a JWT token, you can access protected routes by including it in the Authorization header:

```bash
curl -X GET http://localhost:4000/api/some-protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Public Routes** (no JWT required):
- `GET /health`
- `POST /api/auth/magic-link`
- `POST /api/auth/verify`
- `POST /api/auth/refresh`

**Protected Routes** (JWT required):
- `POST /api/auth/logout`
- All future endpoints (onboarding, profile, matches, etc.)

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Email domain not allowed",
  "error": "Forbidden"
}
```

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests"
}
```

---

## Database Verification

Check authentication-related tables:

```sql
-- View auth tokens
SELECT * FROM auth_tokens ORDER BY created_at DESC LIMIT 5;

-- View users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- View events (audit log)
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;

-- View organizations
SELECT * FROM orgs;
```

---

## Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Grove MVP Auth",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Request Magic Link",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"alice@example.com\"}"
        },
        "url": {
          "raw": "http://localhost:4000/api/auth/magic-link",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "auth", "magic-link"]
        }
      }
    },
    {
      "name": "Verify Token",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"token\": \"{{token}}\"}"
        },
        "url": {
          "raw": "http://localhost:4000/api/auth/verify",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4000",
          "path": ["api", "auth", "verify"]
        }
      }
    }
  ]
}
```

---

## Next Steps

After Phase 2 completion:
- Phase 3: Implement onboarding endpoints
- Frontend integration: Connect Welcome.tsx to magic link flow
- Email configuration: Add real Postmark API key for production
