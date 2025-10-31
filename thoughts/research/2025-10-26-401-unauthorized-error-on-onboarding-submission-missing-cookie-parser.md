---
doc_type: research
date: 2025-10-26T16:59:33+00:00
title: "401 Unauthorized Error on Onboarding Submission - Missing Cookie Parser"
research_question: "Why is POST /api/onboarding getting a 401 Unauthorized error after successful magic link authentication?"
researcher: Sean Kim

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-26
last_updated_by: Sean Kim

tags:
  - authentication
  - cookies
  - jwt
  - csrf
  - bug-fix
  - onboarding
status: completed

related_docs: []
---

# Research: 401 Unauthorized Error on Onboarding Submission

**Date**: 2025-10-26 16:59:33 UTC
**Researcher**: Sean Kim
**Git Commit**: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
**Branch**: main
**Repository**: workspace

## Research Question

Why is the onboarding submission getting a 401 Unauthorized error (`POST /api/onboarding - 401 UnauthorizedException: Unauthorized at JwtAuthGuard.handleRequest`) when the user successfully authenticated via magic link?

## Summary

**ROOT CAUSE IDENTIFIED**: The backend is **missing the `cookie-parser` middleware**, which is required to parse cookies from incoming requests. Without this middleware, `req.cookies` is `undefined`, causing the JWT strategy's cookie extractor to fail.

### The Authentication Flow Breaks at Cookie Extraction

1. User successfully authenticates via magic link → JWT tokens stored in httpOnly cookies ✅
2. Frontend sends onboarding request with `withCredentials: true` → Cookies sent in request ✅
3. Backend receives request with cookies in headers → **Cookies NOT parsed** ❌
4. JWT Strategy tries to extract token from `req.cookies['accessToken']` → Returns `null` ❌
5. JwtAuthGuard fails validation → Returns 401 Unauthorized ❌

## Critical Missing Component

### Cookie Parser Middleware Not Installed or Configured

**Issue**: The backend does not have `cookie-parser` middleware installed or configured.

**Evidence**:
- `package.json` dependencies do NOT include `cookie-parser` ([grove-backend/package.json:22-56](https://github.com/user/repo/blob/main/grove-backend/package.json#L22-L56))
- `main.ts` does NOT configure cookie-parser middleware ([grove-backend/src/main.ts:23-92](https://github.com/user/repo/blob/main/grove-backend/src/main.ts#L23-L92))
- JWT Strategy expects `req.cookies['accessToken']` to exist ([grove-backend/src/auth/strategies/jwt.strategy.ts:11-16](https://github.com/user/repo/blob/main/grove-backend/src/auth/strategies/jwt.strategy.ts#L11-L16))

**Impact**: Without cookie-parser middleware, Express does not populate the `req.cookies` object. When the JWT strategy's `cookieExtractor` function runs, it receives `undefined` for `req.cookies`, making it impossible to extract the JWT token from the cookie.

## Detailed Findings

### 1. Cookie Configuration (Backend)

**Location**: `grove-backend/src/auth/auth.service.ts:194-206`

The backend correctly sets JWT cookies with appropriate security settings:

```typescript
res.cookie('accessToken', accessToken, {
  httpOnly: true,                    // ✅ Cannot be read by JavaScript
  secure: isProduction,              // ✅ HTTPS only in production
  sameSite: 'strict',                // ✅ CSRF protection
  maxAge: 15 * 60 * 1000,           // ✅ 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // ✅ 7 days
});
```

**Cookie Names**:
- Access Token: `accessToken`
- Refresh Token: `refreshToken`
- CSRF Token: `csrf-token` (httpOnly: false, readable by JS)

### 2. JWT Strategy Cookie Extraction

**Location**: `grove-backend/src/auth/strategies/jwt.strategy.ts:11-16`

The JWT strategy defines a custom cookie extractor:

```typescript
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies['accessToken']) {
    return req.cookies['accessToken'];
  }
  return null;
};
```

**Problem**: This extractor depends on `req.cookies` being populated by cookie-parser middleware. Without the middleware:
- `req.cookies` is `undefined`
- The extractor returns `null`
- JWT validation fails
- Guard returns 401

The strategy is registered to use the cookie extractor at line 29:

```typescript
super({
  jwtFromRequest: cookieExtractor,  // ← Uses the cookie extractor
  ignoreExpiration: false,
  secretOrKey: secret,
  passReqToCallback: false,
});
```

### 3. Frontend API Configuration

**Location**: `src/lib/api.ts:15-22`

The frontend correctly configures axios to send credentials:

```typescript
const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  withCredentials: true,  // ✅ Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**CSRF Token Management**: `src/lib/api.ts:32-41, 54-68`

The frontend properly:
1. Fetches CSRF token on app initialization ([src/main.tsx:41](https://github.com/user/repo/blob/main/src/main.tsx#L41))
2. Adds CSRF token to non-GET requests via interceptor ([src/lib/api.ts:54-68](https://github.com/user/repo/blob/main/src/lib/api.ts#L54-L68))

**Onboarding Submission**: `src/lib/apiService.ts:78-85`

```typescript
export async function submitOnboarding(
  responses: OnboardingResponses
): Promise<OnboardingResponse> {
  const response = await api.post<OnboardingResponse>('/onboarding', {
    responses,
  });
  return response.data;
}
```

This uses the `api` instance which has `withCredentials: true`, so cookies ARE sent.

### 4. CORS Configuration

**Location**: `grove-backend/src/main.ts:26-51`

CORS is properly configured to allow credentials:

```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);  // Allow requests with no origin
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // ✅ Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
});
```

**Allowed Origins**: `http://localhost:5173` and `http://localhost:3000` (from env var or defaults)

### 5. Endpoint Protection

**Location**: `grove-backend/src/profiles/profiles.controller.ts:22-30`

The onboarding endpoint is protected by the GLOBAL JwtAuthGuard:

```typescript
@Post('onboarding')
@HttpCode(HttpStatus.CREATED)
async createProfile(
  @CurrentUser() user: User,  // ← Requires authenticated user
  @Body() dto: CreateProfileDto,
  @Req() req: Request,
) {
  return this.profilesService.createProfile(user.id, dto, req);
}
```

**Global Guards**: `grove-backend/src/main.ts:78`

```typescript
app.useGlobalGuards(new JwtAuthGuard(reflector), new CsrfGuard(reflector));
```

The JwtAuthGuard is applied globally, which means ALL endpoints require authentication UNLESS marked with `@Public()`.

**Auth Endpoints Marked as Public**:
- `POST /auth/magic-link` ([grove-backend/src/auth/auth.controller.ts:27](https://github.com/user/repo/blob/main/grove-backend/src/auth/auth.controller.ts#L27))
- `POST /auth/verify` ([grove-backend/src/auth/auth.controller.ts:35](https://github.com/user/repo/blob/main/grove-backend/src/auth/auth.controller.ts#L35))
- `GET /auth/csrf-token` ([grove-backend/src/auth/auth.controller.ts:47](https://github.com/user/repo/blob/main/grove-backend/src/auth/auth.controller.ts#L47))
- `POST /auth/refresh` ([grove-backend/src/auth/auth.controller.ts:60](https://github.com/user/repo/blob/main/grove-backend/src/auth/auth.controller.ts#L60))

**The onboarding endpoint is NOT marked as public**, so it requires JWT authentication via cookie.

### 6. CSRF Guard Behavior

**Location**: `grove-backend/src/common/guards/csrf.guard.ts:24-44`

The CSRF guard correctly:
1. Skips validation for public routes ([line 26-29](https://github.com/user/repo/blob/main/grove-backend/src/common/guards/csrf.guard.ts#L26-L29))
2. Skips validation for GET requests ([line 32](https://github.com/user/repo/blob/main/grove-backend/src/common/guards/csrf.guard.ts#L32))
3. Validates CSRF token for protected POST requests ([line 36-40](https://github.com/user/repo/blob/main/grove-backend/src/common/guards/csrf.guard.ts#L36-L40))

**Important**: The CSRF guard also reads from `req.cookies['csrf-token']`, which would also fail without cookie-parser.

## Why the Error Occurs

### Authentication Flow Breakdown

1. **User requests magic link** → Email sent ✅
2. **User clicks magic link** → `POST /auth/verify` (public endpoint) succeeds ✅
3. **Backend sets cookies** in response:
   ```
   Set-Cookie: accessToken=<jwt>; HttpOnly; SameSite=Strict
   Set-Cookie: refreshToken=<jwt>; HttpOnly; SameSite=Strict
   ```
   ✅ Cookies stored by browser
4. **Frontend navigates to onboarding** → Page loads ✅
5. **User submits onboarding** → `POST /api/onboarding` with cookies in headers:
   ```
   Cookie: accessToken=<jwt>; refreshToken=<jwt>; csrf-token=<token>
   ```
   ✅ Browser sends cookies
6. **Backend receives request** → Express does NOT parse cookies ❌
7. **JwtAuthGuard runs** → Calls JWT strategy to extract token
8. **JWT Strategy's cookieExtractor runs**:
   ```typescript
   if (req && req.cookies && req.cookies['accessToken']) {
     return req.cookies['accessToken'];
   }
   return null;  // ← Returns this because req.cookies is undefined
   ```
   ❌ Returns `null`
9. **Passport JWT validation fails** → No token to verify ❌
10. **JwtAuthGuard.handleRequest throws** → `UnauthorizedException: Unauthorized` ❌

## Solution

### Install and Configure Cookie Parser Middleware

**Step 1**: Install cookie-parser

```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

**Step 2**: Configure middleware in `main.ts` BEFORE any route handlers

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add cookie-parser middleware (MUST be before guards and controllers)
  app.use(cookieParser());

  // ... rest of configuration
}
```

**Order matters**: Cookie-parser must be registered BEFORE the global guards are applied, so that `req.cookies` is populated when the JwtAuthGuard runs.

## Code References

### Backend
- **Cookie setting**: `grove-backend/src/auth/auth.service.ts:194-206`
- **JWT Strategy cookie extractor**: `grove-backend/src/auth/strategies/jwt.strategy.ts:11-16`
- **JWT Strategy registration**: `grove-backend/src/auth/strategies/jwt.strategy.ts:29`
- **Global guards**: `grove-backend/src/main.ts:78`
- **CORS config**: `grove-backend/src/main.ts:26-51`
- **Onboarding endpoint**: `grove-backend/src/profiles/profiles.controller.ts:22-30`
- **Auth controller (public routes)**: `grove-backend/src/auth/auth.controller.ts:27-65`
- **CSRF guard**: `grove-backend/src/common/guards/csrf.guard.ts:24-44`
- **Package dependencies**: `grove-backend/package.json:22-56`

### Frontend
- **API client with credentials**: `src/lib/api.ts:15-22`
- **CSRF initialization**: `src/lib/api.ts:32-41`
- **CSRF interceptor**: `src/lib/api.ts:54-68`
- **Onboarding submission**: `src/lib/apiService.ts:78-85`
- **App initialization**: `src/main.tsx:41`

## Architecture Documentation

### Current Cookie-Based Authentication Pattern

The application uses a cookie-based JWT authentication system:

1. **Authentication**: Magic link → JWT tokens stored in httpOnly cookies
2. **Authorization**: JwtAuthGuard (global) → Extracts JWT from `accessToken` cookie
3. **CSRF Protection**: CsrfGuard (global) → Validates CSRF token for non-GET requests
4. **Public Routes**: Marked with `@Public()` decorator → Bypass both guards

**Security Features**:
- HttpOnly cookies prevent XSS attacks
- SameSite=Strict prevents CSRF attacks on cookies
- CSRF token validation for state-changing operations
- Short-lived access tokens (15 min) with longer refresh tokens (7 days)

### Guard Execution Order

```
Request → CORS → Middleware (needs cookie-parser!) → Global Guards → Route Handler
                                    ↓
                         1. JwtAuthGuard (authentication)
                         2. CsrfGuard (CSRF validation)
                         3. ThrottlerGuard (rate limiting)
                         4. RolesGuard (authorization)
```

## Open Questions

None - the root cause has been identified and the solution is clear.

## Impact Assessment

**Current State**: All authenticated endpoints return 401 after login because cookies cannot be parsed.

**Affected Endpoints**:
- `POST /api/onboarding` (discovered issue)
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/matches`
- `POST /api/matches/:id/accept`
- `POST /api/matches/:id/pass`
- `GET /api/intros`
- `POST /api/intros/:id/feedback`
- All admin endpoints
- All other protected endpoints

**Working Endpoints**:
- Public auth endpoints (`/auth/magic-link`, `/auth/verify`, `/auth/csrf-token`, `/auth/refresh`)
- Health check endpoint (marked as `@Public()`)

## Next Steps

1. Install `cookie-parser` and `@types/cookie-parser`
2. Add `app.use(cookieParser())` to `main.ts` before guards
3. Test magic link authentication → onboarding flow
4. Verify all authenticated endpoints work correctly
5. Test CSRF protection is still functioning
