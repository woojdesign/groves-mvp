# Technical Debt Fixes - Implementation Plan

**Created**: 2025-10-24
**Status**: Ready for Implementation
**Priority**: High (blocks proper dev server functionality)

## Overview

This plan addresses the technical debt created during dev-start.sh fixes. We'll implement three fixes in priority order, ensuring the server starts successfully after each phase.

---

## Phase 1: Optional EmailService (2-4 hours)

**Goal**: Make EmailService optional when POSTMARK_API_KEY isn't configured, eliminating need for dummy values.

### Success Criteria
- ✅ Server starts without POSTMARK_API_KEY
- ✅ Email sending is no-op in development (logs instead)
- ✅ Email sending works in production with real API key
- ✅ No breaking changes to existing code
- ✅ All existing tests pass

### Implementation Steps

#### Step 1.1: Create Email Service Interface
**File**: `grove-backend/src/email/email.service.interface.ts` (new)

```typescript
export interface IEmailService {
  sendMagicLink(to: string, magicLink: string, expiresIn: string): Promise<void>;
  sendVerificationEmail(to: string, verificationToken: string): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
```

#### Step 1.2: Create No-Op Email Service
**File**: `grove-backend/src/email/email-noop.service.ts` (new)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from './email.service.interface';

@Injectable()
export class EmailNoopService implements IEmailService {
  private readonly logger = new Logger(EmailNoopService.name);

  async sendMagicLink(to: string, magicLink: string, expiresIn: string): Promise<void> {
    this.logger.log(`[NO-OP] Magic link for ${to}:`);
    this.logger.log(`[NO-OP] ${magicLink}`);
    this.logger.log(`[NO-OP] Expires in: ${expiresIn}`);
  }

  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    this.logger.log(`[NO-OP] Verification email for ${to}:`);
    this.logger.log(`[NO-OP] Token: ${verificationToken}`);
  }
}
```

#### Step 1.3: Update EmailService to Implement Interface
**File**: `grove-backend/src/email/email.service.ts`

- Add `implements IEmailService`
- Remove constructor validation (move to factory)

#### Step 1.4: Create Email Service Factory
**File**: `grove-backend/src/email/email.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailNoopService } from './email-noop.service';
import { EMAIL_SERVICE } from './email.service.interface';

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('POSTMARK_API_KEY');
        const isConfigured = apiKey &&
                            !apiKey.includes('dummy') &&
                            !apiKey.includes('placeholder');

        if (isConfigured) {
          return new EmailService(config);
        } else {
          return new EmailNoopService();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
```

#### Step 1.5: Update All Email Service Consumers
**Files**:
- `grove-backend/src/auth/auth.service.ts`
- Any other files using EmailService

```typescript
import { Inject } from '@nestjs/common';
import { EMAIL_SERVICE, IEmailService } from '../email/email.service.interface';

constructor(
  @Inject(EMAIL_SERVICE) private emailService: IEmailService,
  // ... other dependencies
) {}
```

#### Step 1.6: Remove Dummy POSTMARK_API_KEY from .env
**File**: `grove-backend/.env`

Comment out or remove the dummy value:
```bash
# Postmark (optional - emails will be logged in development)
# POSTMARK_API_KEY="your-key-here"
POSTMARK_FROM_EMAIL="hello@grove.dev"
```

#### Step 1.7: Test Phase 1
```bash
# Stop dev servers
# Restart dev-start.sh
# Verify server starts successfully
# Check logs show "[NO-OP]" email messages
# Test magic link flow (should log token instead of sending email)
```

---

## Phase 2: Conditional Auth Strategies (4-6 hours)

**Goal**: Only register SAML/OIDC strategies when properly configured, eliminating need for dummy certificates.

### Success Criteria
- ✅ Server starts without SAML/OIDC configuration
- ✅ SAML routes only available when SAML is configured
- ✅ OIDC routes only available when OIDC is configured
- ✅ No breaking changes for JWT authentication
- ✅ All existing tests pass

### Implementation Steps

#### Step 2.1: Create Auth Configuration Helper
**File**: `grove-backend/src/auth/auth.config.ts` (new)

```typescript
export class AuthConfig {
  static isSamlEnabled(): boolean {
    const cert = process.env.SAML_CERT;
    const entryPoint = process.env.SAML_ENTRY_POINT;

    return !!(
      cert &&
      entryPoint &&
      !cert.includes('dummy') &&
      !cert.includes('your-tenant-id') &&
      !entryPoint.includes('dev.example.com')
    );
  }

  static isOidcEnabled(): boolean {
    const issuer = process.env.OIDC_ISSUER;
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;

    return !!(
      issuer &&
      clientId &&
      clientSecret &&
      !issuer.includes('dev.example.com') &&
      !clientId.includes('dev-client-id')
    );
  }
}
```

#### Step 2.2: Convert AuthModule to Dynamic Module
**File**: `grove-backend/src/auth/auth.module.ts`

```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { AuthConfig } from './auth.config';

@Module({})
export class AuthModule {
  static registerAsync(): DynamicModule {
    const providers = [
      AuthService,
      JwtStrategy,
    ];

    const controllers = [AuthController];

    // Conditionally add SAML
    if (AuthConfig.isSamlEnabled()) {
      providers.push(SamlService, SamlStrategy);
      controllers.push(SamlController);
    }

    // Conditionally add OIDC
    if (AuthConfig.isOidcEnabled()) {
      providers.push(OidcService, OidcStrategy);
      controllers.push(OidcController);
    }

    return {
      module: AuthModule,
      imports: [
        PassportModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const jwtSecret = config.get<string>('JWT_SECRET');

            if (!jwtSecret || jwtSecret.length < 32) {
              throw new Error('JWT_SECRET must be at least 32 characters');
            }

            return {
              secret: jwtSecret,
              signOptions: { expiresIn: '15m' },
            };
          },
        }),
        EmailModule,
        PrismaModule,
      ],
      controllers,
      providers,
      exports: [AuthService],
    };
  }
}
```

#### Step 2.3: Update AppModule
**File**: `grove-backend/src/app.module.ts`

Change:
```typescript
imports: [AuthModule, ...]
```

To:
```typescript
imports: [AuthModule.registerAsync(), ...]
```

#### Step 2.4: Add Logging for Enabled Strategies
**File**: `grove-backend/src/auth/auth.module.ts`

Add to registerAsync():
```typescript
if (AuthConfig.isSamlEnabled()) {
  console.log('✅ SAML authentication enabled');
  providers.push(SamlService, SamlStrategy);
  controllers.push(SamlController);
} else {
  console.log('⚠️  SAML authentication disabled (not configured)');
}

if (AuthConfig.isOidcEnabled()) {
  console.log('✅ OIDC authentication enabled');
  providers.push(OidcService, OidcStrategy);
  controllers.push(OidcController);
} else {
  console.log('⚠️  OIDC authentication disabled (not configured)');
}
```

#### Step 2.5: Remove Dummy SAML/OIDC from .env
**File**: `grove-backend/.env`

Comment out all SAML/OIDC configuration:
```bash
# SAML Configuration (optional - only needed for enterprise SSO)
# SAML_ENTRY_POINT="https://login.microsoftonline.com/your-tenant-id/saml2"
# SAML_ISSUER="grove-mvp"
# SAML_CALLBACK_URL="http://localhost:4000/api/auth/saml/callback"
# SAML_CERT="-----BEGIN CERTIFICATE-----..."

# OIDC Configuration (optional - only needed for enterprise SSO)
# OIDC_ISSUER="https://login.microsoftonline.com/your-tenant-id/v2.0"
# OIDC_CLIENT_ID="your-client-id"
# OIDC_CLIENT_SECRET="your-client-secret"
# OIDC_CALLBACK_URL="http://localhost:4000/api/auth/oidc/callback"
# OIDC_SCOPE="openid profile email"
```

#### Step 2.6: Test Phase 2
```bash
# Stop dev servers
# Restart dev-start.sh
# Verify server starts successfully
# Check logs show SAML/OIDC disabled messages
# Test JWT authentication (magic link) still works
# Verify /api/auth/saml routes return 404
# Verify /api/auth/oidc routes return 404
```

---

## Phase 3: Prisma Middleware Migration (8-12 hours)

**Goal**: Migrate from deprecated `$use()` to Prisma Client Extensions `$extends()`.

### Success Criteria
- ✅ Query logging works in development
- ✅ Field-level encryption works for User.email, User.name, Profile fields
- ✅ No deprecated API warnings
- ✅ All existing tests pass
- ✅ Server starts successfully

### Implementation Steps

#### Step 3.1: Install prisma-field-encryption (Recommended)
**File**: `grove-backend/package.json`

```bash
cd grove-backend
npm install prisma-field-encryption
```

This package provides automatic encryption using Prisma Client Extensions.

#### Step 3.2: Update Prisma Schema
**File**: `grove-backend/prisma/schema.prisma`

Add `/// @encrypted` annotations:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique /// @encrypted
  name      String?  /// @encrypted
  // ... rest of fields
}

model Profile {
  id             String   @id @default(uuid())
  nicheInterest  String?  /// @encrypted
  project        String?  /// @encrypted
  rabbitHole     String?  /// @encrypted
  // ... rest of fields
}
```

#### Step 3.3: Create Extended Prisma Client
**File**: `grove-backend/src/prisma/prisma.service.ts`

Replace middleware code with:
```typescript
import { PrismaClient } from '@prisma/client';
import { fieldEncryptionExtension } from 'prisma-field-encryption';

async onModuleInit() {
  // Create extended client with encryption
  const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

  if (encryptionKey && encryptionKey.length >= 32) {
    const extendedClient = new PrismaClient().$extends(
      fieldEncryptionExtension({ encryptionKey })
    );

    // Add query logging in development
    if (process.env.NODE_ENV === 'development') {
      const withLogging = extendedClient.$extends({
        query: {
          $allOperations({ operation, model, args, query }) {
            const start = performance.now();
            return query(args).then((result) => {
              const time = performance.now() - start;
              this.logger.debug(
                `Query ${model}.${operation} took ${time.toFixed(2)}ms`
              );
              return result;
            });
          },
        },
      });

      Object.assign(this, withLogging);
    } else {
      Object.assign(this, extendedClient);
    }

    this.logger.log('Field-level encryption enabled with prisma-field-encryption');
  } else {
    this.logger.warn('ENCRYPTION_KEY not configured - encryption disabled');
  }

  await this.$connect();
  console.log('✅ Database connected');
}
```

#### Step 3.4: Remove Old Middleware Code
**File**: `grove-backend/src/prisma/prisma.service.ts`

Delete:
- `setupEncryptionMiddleware()` method
- `decryptFields()` method
- All commented-out `$use()` code

#### Step 3.5: Update Package Scripts
**File**: `grove-backend/package.json`

Ensure Prisma generates after install:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### Step 3.6: Regenerate Prisma Client
```bash
cd grove-backend
npx prisma generate
```

#### Step 3.7: Test Phase 3
```bash
# Stop dev servers
# Restart dev-start.sh
# Verify server starts successfully
# Test creating user with email (should be encrypted in DB)
# Test reading user (should be decrypted)
# Query DB directly to verify encryption:
#   PGPASSWORD=postgres psql -h postgres -U postgres -d grove_mvp -c "SELECT email FROM users LIMIT 1;"
# Email should show as encrypted cipher text
# Check dev logs show query timing
```

---

## Testing Protocol

After each phase:
1. ✅ Stop all running dev servers (`pkill -9 -f "nest\|vite"`)
2. ✅ Clear logs (`rm -rf /workspace/logs/*`)
3. ✅ Run `./dev-start.sh`
4. ✅ Verify both servers start without errors
5. ✅ Check logs for expected output
6. ✅ Test affected functionality manually
7. ✅ Commit changes with descriptive message

---

## Rollback Plan

If any phase fails:
1. `git revert HEAD` to undo last commit
2. Restore previous .env values
3. Restart servers
4. Debug issue before re-attempting

---

## Final Verification

After all phases complete:
1. ✅ Server starts cleanly with no errors
2. ✅ No dummy values in .env
3. ✅ No deprecated API warnings
4. ✅ JWT authentication works (magic link)
5. ✅ Admin user can login
6. ✅ Field encryption works (verify in DB)
7. ✅ All three authentication methods conditionally load
8. ✅ Dev logs show query performance

---

## Dependencies

**Required packages**:
- `prisma-field-encryption` (Phase 3)

**Required environment variables**:
- `JWT_SECRET` (always required)
- `ENCRYPTION_KEY` (required for encryption)
- `POSTMARK_API_KEY` (optional, Phase 1)
- `SAML_*` (optional, Phase 2)
- `OIDC_*` (optional, Phase 2)

---

## Estimated Timeline

- **Phase 1**: 2-4 hours (Optional EmailService)
- **Phase 2**: 4-6 hours (Conditional Auth Strategies)
- **Phase 3**: 8-12 hours (Prisma Middleware Migration)

**Total**: 14-22 hours

---

## Notes

- Phase 1 has lowest risk, implement first
- Phase 2 is medium complexity, good middle step
- Phase 3 is highest complexity, requires careful testing
- Each phase is independently testable
- Can deploy after any phase if needed
