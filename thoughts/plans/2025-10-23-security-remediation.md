---
doc_type: plan
date: 2025-10-23T03:41:26+00:00
title: "Security Remediation"
feature: "security-hardening"

# Update phase status as implementation progresses
phases:
  - name: "Phase 1: Critical Secrets & Credentials"
    status: pending
  - name: "Phase 2: Backend Security Vulnerabilities"
    status: pending
  - name: "Phase 3: Auth & Token Security"
    status: pending
  - name: "Phase 4: Infrastructure Hardening"
    status: pending

git_commit: 2671747e9859dba4c277febb1733004787629183
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-23
last_updated_by: Sean Kim

tags:
  - security
  - critical
  - production-readiness
status: draft

related_docs: []
---

# Security Remediation Plan

## Overview

**Problem**: Security review identified 10 critical/high vulnerabilities requiring immediate remediation before production deployment.

**Solution**: 4-phase systematic security hardening targeting secrets management, SQL injection, token storage, rate limiting, CSRF, CORS, dependency vulnerabilities, and infrastructure security.

**Success**: All critical/high security issues resolved, security tests pass, ready for production deployment.

---

## PHASE 1: Critical Secrets & Credentials

**Objective**: Replace default/weak secrets and credentials with production-grade security.

**Files**:
- `/workspace/grove-backend/.env.example`
- `/workspace/grove-backend/.env` (local)
- `/workspace/.env.example`
- `/workspace/.env` (local)
- `/workspace/grove-backend/README.md` (security docs)
- `/workspace/docs/DEPLOYMENT.md` (new)

**Changes**:

1. **CRIT-001: Weak JWT Secret**
   - Update `.env.example` JWT_SECRET with strong placeholder: `"CHANGE_ME_min_32_chars_use_openssl_rand_base64_32"`
   - Generate production secret: `openssl rand -base64 32`
   - Add validation in `auth.module.ts`: throw error if JWT_SECRET length < 32 chars
   - Document secret rotation procedure

2. **CRIT-002: Default DB Credentials**
   - Update `DATABASE_URL` in `.env.example`: `"postgresql://CHANGE_USER:CHANGE_PASS@localhost:5432/grove_mvp"`
   - Add credential strength validation on app startup
   - Create `.env.production.example` with AWS RDS placeholder
   - Document credential rotation process

3. **Add Security Checklist**
   - Create `docs/DEPLOYMENT.md` with production security checklist
   - Add pre-deployment script to validate all secrets changed
   - Document environment variable security requirements

**Success Criteria**:
- ✅ JWT_SECRET validation prevents weak secrets (test: start app with weak secret = error)
- ✅ Database credential validation enforces complexity
- ✅ All `.env.example` files have clear "CHANGE_ME" placeholders
- ✅ Deployment docs include secret generation commands

**Test**:
```bash
# Should fail - weak JWT secret
JWT_SECRET="weak" npm run start:dev

# Should pass - strong secret
JWT_SECRET=$(openssl rand -base64 32) npm run start:dev

# Verify no default passwords work
psql $DATABASE_URL -c "SELECT 1" # should fail with default creds
```

**Review**:
- Check all `.env.example` files have no real secrets
- Verify startup validation throws clear errors for weak secrets
- Confirm deployment docs are comprehensive and actionable

---

## PHASE 2: Backend Security Vulnerabilities

**Objective**: Fix SQL injection, rate limiting, email injection, and dependency vulnerabilities.

**Files**:
- `/workspace/grove-backend/src/matching/strategies/matching/vector-similarity.strategy.ts`
- `/workspace/grove-backend/src/auth/auth.controller.ts`
- `/workspace/grove-backend/src/email/email.service.ts`
- `/workspace/grove-backend/src/email/templates/magic-link.hbs`
- `/workspace/grove-backend/src/email/templates/match-notification.hbs`
- `/workspace/grove-backend/src/email/templates/mutual-introduction.hbs`
- `/workspace/grove-backend/package.json`
- `/workspace/package.json`
- `/workspace/grove-backend/src/common/filters/prisma-exception.filter.ts` (new)

**Changes**:

1. **HIGH-001: SQL Injection in vector-similarity.strategy.ts:50**
   ```typescript
   // BEFORE (line 50):
   1 - (embedding <=> ${`[${sourceVector.join(',')}]`}::vector) AS similarity_score

   // AFTER - use Prisma.sql for safe interpolation:
   import { Prisma } from '@prisma/client';

   const vectorString = Prisma.sql`[${Prisma.join(sourceVector.map(v => Prisma.sql`${v}`), ',')}]`;
   const results = await this.prisma.$queryRaw<Array<{ user_id: string; similarity_score: number }>>`
     SELECT
       user_id::text as user_id,
       1 - (embedding <=> ${vectorString}::vector) AS similarity_score
     FROM embeddings
     WHERE user_id = ANY(${candidateUserIds}::uuid[])
       AND embedding IS NOT NULL
     ORDER BY similarity_score DESC
   `;
   ```
   - Add input validation: `sourceVector.forEach(v => { if (!Number.isFinite(v)) throw new Error('Invalid vector') })`
   - Add unit test with malicious vector input attempting SQL injection

2. **HIGH-003: No Rate Limit on /auth/verify**
   ```typescript
   // In auth.controller.ts, add to @Post('verify'):
   @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
   @Post('verify')
   async verifyMagicLink(@Body() dto: VerifyTokenDto) {
   ```
   - Configure global throttler in `app.module.ts` with stricter defaults
   - Add custom throttler response message

3. **HIGH-007: Email Template Injection (email.service.ts:36-40)**
   ```typescript
   // In email.service.ts, sanitize template variables:
   import { escape } from 'handlebars';

   async sendMagicLink(to: string, magicLink: string, expiresIn: string): Promise<void> {
     // Validate email format
     if (!this.isValidEmail(to)) throw new Error('Invalid email');

     // Sanitize inputs before templating
     const html = template({
       magicLink: escape(magicLink),
       expiresIn: escape(expiresIn),
       recipientEmail: escape(to),
     });
   ```
   - Add `isValidEmail(email: string)` using `class-validator` IsEmail
   - Update all template calls: `sendMatchNotification`, `sendMutualIntroduction`
   - Add tests for XSS/injection attempts in template variables

4. **HIGH-005: npm Vulnerabilities**
   ```bash
   # Frontend: Upgrade Vite 6.3.5 → 6.4.x
   npm update vite

   # Backend: Check class-validator and update if needed
   cd grove-backend
   npm audit fix
   npm audit fix --force  # if safe
   ```
   - Review `npm audit` output, upgrade packages with fixes
   - Document any vulnerabilities without fixes as known issues
   - Add `npm audit --audit-level=high` to CI pipeline

5. **Add Prisma Exception Filter**
   - Create `prisma-exception.filter.ts` to catch DB errors without leaking schema details
   - Register globally in `main.ts`: `app.useGlobalFilters(new PrismaExceptionFilter())`

**Success Criteria**:
- ✅ SQL injection test fails (malicious vector input blocked)
- ✅ /auth/verify returns 429 after 10 requests in 1 minute
- ✅ Email template injection test fails (XSS scripts escaped)
- ✅ `npm audit --audit-level=high` shows 0 vulnerabilities
- ✅ DB errors return generic 500, not schema details

**Test**:
```bash
# Test SQL injection protection
curl -X POST http://localhost:4000/api/matches/compute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"maliciousVector": "1]; DROP TABLE users; --"}'
# Should return 400 Bad Request, not execute SQL

# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:4000/api/auth/verify -d '{"token":"test"}' &
done
# 11th+ requests should return 429

# Test email template injection
curl -X POST http://localhost:4000/api/auth/magic-link \
  -d '{"email":"<script>alert(1)</script>@test.com"}'
# Should escape or reject

# Check vulnerabilities
npm audit --audit-level=high
cd grove-backend && npm audit --audit-level=high
```

**Review**:
- Verify Prisma.sql usage prevents all SQL injection vectors
- Check throttler configuration covers all public endpoints
- Confirm Handlebars escaping applied to ALL template variables
- Review npm audit output, ensure all high/critical fixed or documented

---

## PHASE 3: Auth & Token Security

**Objective**: Secure token storage, add CSRF protection, fix CORS configuration.

**Files**:
- `/workspace/src/lib/api.ts`
- `/workspace/src/lib/tokenStorage.ts` (new)
- `/workspace/src/components/AuthCallback.tsx`
- `/workspace/src/components/ProtectedRoute.tsx`
- `/workspace/grove-backend/src/main.ts`
- `/workspace/grove-backend/src/auth/auth.controller.ts`
- `/workspace/grove-backend/src/auth/auth.service.ts`
- `/workspace/grove-backend/src/common/guards/csrf.guard.ts` (new)
- `/workspace/src/index.html`

**Changes**:

1. **HIGH-002: JWT in localStorage → httpOnly Cookies**

   **Backend (auth.service.ts)**:
   ```typescript
   // In verifyMagicLink, return user data only (no tokens in response body):
   async verifyMagicLink(token: string, res: Response): Promise<{
     user: { id: string; email: string; name: string; hasCompletedOnboarding: boolean };
   }> {
     // ... existing logic ...

     // Set httpOnly cookies instead of returning tokens
     res.cookie('accessToken', accessToken, {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'strict',
       maxAge: 15 * 60 * 1000, // 15 minutes
     });

     res.cookie('refreshToken', refreshToken, {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'strict',
       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
     });

     return { user };
   }
   ```

   **Backend (auth.controller.ts)**:
   ```typescript
   import { Response } from 'express';

   @Post('verify')
   async verifyMagicLink(@Body() dto: VerifyTokenDto, @Res({ passthrough: true }) res: Response) {
     return this.authService.verifyMagicLink(dto.token, res);
   }

   @Post('logout')
   async logout(@Res({ passthrough: true }) res: Response) {
     res.clearCookie('accessToken');
     res.clearCookie('refreshToken');
     return { message: 'Logged out' };
   }
   ```

   **Backend (jwt.strategy.ts)** - Extract token from cookie:
   ```typescript
   async validate(req: Request) {
     const token = req.cookies['accessToken'];
     // ... existing validation
   }
   ```

   **Frontend (api.ts)** - Remove tokenManager, use cookies:
   ```typescript
   // DELETE lines 11-54 (entire tokenManager object)

   // Update axios config to include credentials:
   const api: AxiosInstance = axios.create({
     baseURL: config.apiBaseUrl,
     timeout: config.apiTimeout,
     withCredentials: true, // Send cookies with requests
     headers: {
       'Content-Type': 'application/json',
     },
   });

   // REMOVE request interceptor (lines 60-73) - cookies sent automatically

   // UPDATE response interceptor to handle 401 without manual token refresh:
   api.interceptors.response.use(
     (response) => response,
     async (error: AxiosError<ApiError>) => {
       if (error.response?.status === 401) {
         // Token refresh handled automatically by httpOnly cookies
         // Just redirect to login
         window.location.href = '/';
       }
       return Promise.reject(error.response?.data || error);
     }
   );
   ```

   **Frontend (AuthCallback.tsx, ProtectedRoute.tsx)** - Remove tokenManager usage:
   ```typescript
   // Replace tokenManager.setTokens() with checking user data in response
   // Replace tokenManager.isAuthenticated() with API call to /auth/me
   ```

2. **HIGH-004: Add CSRF Protection**

   **Backend (csrf.guard.ts)** - New file:
   ```typescript
   import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
   import { Reflector } from '@nestjs/core';

   @Injectable()
   export class CsrfGuard implements CanActivate {
     constructor(private reflector: Reflector) {}

     canActivate(context: ExecutionContext): boolean {
       const request = context.switchToHttp().getRequest();
       const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());

       // Skip CSRF for public routes and GET requests
       if (isPublic || request.method === 'GET') return true;

       const csrfToken = request.headers['x-csrf-token'];
       const csrfCookie = request.cookies['csrf-token'];

       if (!csrfToken || csrfToken !== csrfCookie) {
         throw new ForbiddenException('Invalid CSRF token');
       }

       return true;
     }
   }
   ```

   **Backend (auth.controller.ts)** - Add CSRF token endpoint:
   ```typescript
   @Public()
   @Get('csrf-token')
   getCsrfToken(@Res({ passthrough: true }) res: Response) {
     const token = randomBytes(32).toString('hex');
     res.cookie('csrf-token', token, {
       httpOnly: false, // Readable by JS
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'strict',
     });
     return { csrfToken: token };
   }
   ```

   **Backend (main.ts)** - Register CSRF guard globally:
   ```typescript
   import { CsrfGuard } from './common/guards/csrf.guard';
   app.useGlobalGuards(new CsrfGuard(reflector));
   ```

   **Frontend (api.ts)** - Add CSRF token to requests:
   ```typescript
   // Fetch CSRF token on app load
   let csrfToken: string | null = null;

   export async function initCsrf() {
     const response = await axios.get(`${config.apiBaseUrl}/auth/csrf-token`);
     csrfToken = response.data.csrfToken;
   }

   // Add CSRF header to requests
   api.interceptors.request.use(
     (config: InternalAxiosRequestConfig) => {
       if (csrfToken && config.method !== 'get') {
         config.headers['X-CSRF-Token'] = csrfToken;
       }
       return config;
     }
   );
   ```

   **Frontend (main.tsx)** - Initialize CSRF:
   ```typescript
   import { initCsrf } from './lib/api';

   initCsrf().then(() => {
     ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
   });
   ```

3. **HIGH-008: CORS Misconfiguration**
   ```typescript
   // In grove-backend/src/main.ts, replace lines 10-13:
   app.enableCors({
     origin: (origin, callback) => {
       const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
     exposedHeaders: ['Set-Cookie'],
   });
   ```

   **Update .env.example**:
   ```
   ALLOWED_ORIGINS="http://localhost:5173,https://app.commonplace.app"
   ```

4. **HIGH-006: Weak Token Generation - Already Strong**
   - auth.service.ts:47 uses `randomBytes(64)` which is cryptographically secure
   - No changes needed, but add test to verify token entropy

**Success Criteria**:
- ✅ Tokens stored in httpOnly cookies (inspect DevTools: localStorage empty, cookies present)
- ✅ CSRF protection active: POST without X-CSRF-Token returns 403
- ✅ CORS blocks unauthorized origins (test with curl from wrong origin)
- ✅ Token generation uses crypto.randomBytes (already implemented)
- ✅ Auth flows work end-to-end with new cookie-based auth

**Test**:
```bash
# Test httpOnly cookies
curl -c cookies.txt http://localhost:4000/api/auth/verify -d '{"token":"valid"}'
grep httpOnly cookies.txt # Should see accessToken, refreshToken

# Test CSRF protection
curl http://localhost:4000/api/auth/csrf-token # Get token
curl -b cookies.txt -X POST http://localhost:4000/api/profile # Should return 403
curl -b cookies.txt -H "X-CSRF-Token: $CSRF" -X POST http://localhost:4000/api/profile # Should work

# Test CORS
curl -H "Origin: http://evil.com" http://localhost:4000/api/auth/verify
# Should return CORS error

# Test in browser
# 1. Login via magic link
# 2. Check DevTools Application tab: cookies have httpOnly flag
# 3. Check localStorage: empty (no tokens)
# 4. Navigate protected routes: should work
```

**Review**:
- Verify NO tokens in localStorage or sessionStorage
- Check all cookies have httpOnly, secure (in prod), sameSite flags
- Confirm CSRF token included in all POST/PUT/DELETE requests
- Test CORS with different origins, ensure only allowed origins work
- Verify auth flows: login, refresh, logout all work with cookies

---

## PHASE 4: Infrastructure Hardening

**Objective**: Add security headers, comprehensive logging, secure error handling.

**Files**:
- `/workspace/grove-backend/src/main.ts`
- `/workspace/grove-backend/src/common/middleware/security-headers.middleware.ts` (new)
- `/workspace/grove-backend/src/common/middleware/request-logger.middleware.ts` (new)
- `/workspace/grove-backend/src/common/filters/global-exception.filter.ts` (new)
- `/workspace/grove-backend/src/auth/auth.service.ts`
- `/workspace/src/index.html`

**Changes**:

1. **Add Security Headers Middleware**

   **security-headers.middleware.ts** (new):
   ```typescript
   import { Injectable, NestMiddleware } from '@nestjs/common';
   import { Request, Response, NextFunction } from 'express';

   @Injectable()
   export class SecurityHeadersMiddleware implements NestMiddleware {
     use(req: Request, res: Response, next: NextFunction) {
       // Prevent clickjacking
       res.setHeader('X-Frame-Options', 'DENY');

       // Prevent MIME sniffing
       res.setHeader('X-Content-Type-Options', 'nosniff');

       // XSS Protection (legacy but still useful)
       res.setHeader('X-XSS-Protection', '1; mode=block');

       // Content Security Policy
       res.setHeader(
         'Content-Security-Policy',
         "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
       );

       // Referrer Policy
       res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

       // Permissions Policy
       res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

       // HSTS (only in production)
       if (process.env.NODE_ENV === 'production') {
         res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
       }

       next();
     }
   }
   ```

   **Register in app.module.ts**:
   ```typescript
   export class AppModule implements NestModule {
     configure(consumer: MiddlewareConsumer) {
       consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
     }
   }
   ```

2. **Add Request Logging Middleware**

   **request-logger.middleware.ts** (new):
   ```typescript
   import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
   import { Request, Response, NextFunction } from 'express';

   @Injectable()
   export class RequestLoggerMiddleware implements NestMiddleware {
     private logger = new Logger('HTTP');

     use(req: Request, res: Response, next: NextFunction) {
       const { method, originalUrl, ip } = req;
       const userAgent = req.get('user-agent') || '';
       const startTime = Date.now();

       res.on('finish', () => {
         const { statusCode } = res;
         const responseTime = Date.now() - startTime;

         // Log with appropriate level
         const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${ip} ${userAgent}`;

         if (statusCode >= 500) {
           this.logger.error(message);
         } else if (statusCode >= 400) {
           this.logger.warn(message);
         } else {
           this.logger.log(message);
         }

         // Log security events
         if (statusCode === 401 || statusCode === 403) {
           this.logger.warn(`Security: ${method} ${originalUrl} ${statusCode} - ${ip}`);
         }
       });

       next();
     }
   }
   ```

3. **Add Global Exception Filter**

   **global-exception.filter.ts** (new):
   ```typescript
   import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

   @Catch()
   export class GlobalExceptionFilter implements ExceptionFilter {
     private logger = new Logger('ExceptionFilter');

     catch(exception: unknown, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const response = ctx.getResponse();
       const request = ctx.getRequest();

       let status = HttpStatus.INTERNAL_SERVER_ERROR;
       let message = 'Internal server error';

       if (exception instanceof HttpException) {
         status = exception.getStatus();
         const exceptionResponse = exception.getResponse();
         message = typeof exceptionResponse === 'string'
           ? exceptionResponse
           : (exceptionResponse as any).message || message;
       }

       // Log error with context
       this.logger.error(
         `${request.method} ${request.url} - ${status}`,
         exception instanceof Error ? exception.stack : exception
       );

       // Never leak sensitive data in production
       const errorResponse = {
         statusCode: status,
         message: process.env.NODE_ENV === 'production' && status === 500
           ? 'Internal server error'
           : message,
         timestamp: new Date().toISOString(),
         path: request.url,
       };

       response.status(status).json(errorResponse);
     }
   }
   ```

   **Register in main.ts**:
   ```typescript
   import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
   app.useGlobalFilters(new GlobalExceptionFilter());
   ```

4. **Enhance Auth Logging**

   **In auth.service.ts**, add detailed security event logging:
   ```typescript
   // In requestMagicLink:
   this.logger.log(`Magic link requested: ${email} from IP: ${req.ip}`);

   // In verifyMagicLink (on failure):
   this.logger.warn(`Failed login attempt with token: ${token.substring(0, 8)}... from IP: ${req.ip}`);

   // In verifyMagicLink (on success):
   this.logger.log(`Successful login: ${user.email} from IP: ${req.ip}`);

   // Track failed attempts in database for rate limiting/blocking
   ```

5. **Frontend Security Headers (via meta tags)**

   **In src/index.html**, add CSP meta tag:
   ```html
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <meta http-equiv="Content-Security-Policy"
           content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
     <title>Grove</title>
   </head>
   ```

**Success Criteria**:
- ✅ Security headers present in all responses (check with `curl -I`)
- ✅ All requests logged with method, status, response time, IP
- ✅ 500 errors don't leak stack traces in production
- ✅ Security events (401, 403) logged with IP and endpoint
- ✅ CSP blocks inline scripts (test by adding `<script>alert(1)</script>`)

**Test**:
```bash
# Test security headers
curl -I http://localhost:4000/api/health
# Should see: X-Frame-Options, X-Content-Type-Options, CSP, etc.

# Test error handling
curl http://localhost:4000/api/nonexistent
# Should return clean JSON, no stack trace

# Test logging
tail -f grove-backend/logs/app.log # or check console
curl http://localhost:4000/api/health
# Should see log entry with method, status, response time

# Test CSP
# In browser, open DevTools Console
# Try: eval('alert(1)')
# Should be blocked by CSP
```

**Review**:
- Verify all security headers present in response headers
- Check logs contain IP, method, status, response time (no sensitive data)
- Confirm production errors return generic messages (no stack traces)
- Test CSP blocks unauthorized scripts
- Verify HSTS header only in production (not dev)

---

## Post-Remediation Validation

**Final Security Checklist**:

1. **Secrets & Credentials**
   - [ ] JWT_SECRET minimum 32 characters
   - [ ] Database credentials changed from defaults
   - [ ] All `.env.example` files have clear placeholders
   - [ ] Deployment docs include secret generation

2. **Backend Security**
   - [ ] SQL injection tests pass (malicious inputs blocked)
   - [ ] Rate limiting active on all public endpoints
   - [ ] Email template injection tests pass (XSS escaped)
   - [ ] `npm audit --audit-level=high` returns 0 vulnerabilities
   - [ ] Database errors don't leak schema details

3. **Auth & Tokens**
   - [ ] Tokens in httpOnly cookies (not localStorage)
   - [ ] CSRF protection active on POST/PUT/DELETE
   - [ ] CORS allows only specified origins
   - [ ] Auth flows work end-to-end with cookies

4. **Infrastructure**
   - [ ] Security headers present in all responses
   - [ ] Request logging captures method, status, IP, response time
   - [ ] Production errors return generic messages
   - [ ] CSP blocks unauthorized scripts
   - [ ] Security events (401, 403) logged

**Testing Commands**:
```bash
# Run all security tests
npm run test:security  # Create this script

# Manual penetration testing
./scripts/security-test.sh  # Create this script

# Verify deployment readiness
./scripts/pre-deploy-security-check.sh  # Create this script
```

**Rollback Plan**:
- Phase 1: Revert env files to previous secrets
- Phase 2: Revert package.json, restore old query code
- Phase 3: Re-enable localStorage tokens, remove CSRF/CORS changes
- Phase 4: Remove new middleware/filters

**Documentation Updates**:
- Update README.md with security features
- Create SECURITY.md with vulnerability reporting process
- Document security configuration in deployment guide
- Add security testing to CI/CD pipeline docs

---

## Estimated Timeline

- **Phase 1**: 2-3 hours (secrets, validation, docs)
- **Phase 2**: 4-6 hours (SQL fix, rate limiting, email sanitization, npm updates)
- **Phase 3**: 6-8 hours (cookie auth refactor, CSRF, CORS)
- **Phase 4**: 3-4 hours (headers, logging, error handling)

**Total**: 15-21 hours

**Priority**: Critical - Required before production deployment
