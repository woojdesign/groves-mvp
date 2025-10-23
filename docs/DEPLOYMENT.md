# Grove Deployment Security Checklist

## Pre-Deployment Security Requirements

This document outlines the critical security requirements that MUST be satisfied before deploying Grove to any production or staging environment.

## Environment Variables Security

### Required Environment Variables

All environment variables must be properly configured before deployment. Never use default, example, or weak values in production.

### Critical Secrets Configuration

#### 1. JWT Secret

**Required Strength**: Minimum 32 characters, cryptographically random

**Generation Command**:
```bash
openssl rand -base64 32
```

**Environment Variable**:
```bash
JWT_SECRET="<output from command above>"
```

**Validation**: The application will refuse to start if:
- JWT_SECRET is less than 32 characters
- JWT_SECRET contains "CHANGE_ME" or "your-super-secret"
- JWT_SECRET is not set

**Example Error**:
```
Error: JWT_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32
```

#### 2. Database Credentials

**Required**: Strong database username and password

**Production DATABASE_URL Format**:
```bash
# For AWS RDS PostgreSQL
DATABASE_URL="postgresql://<USERNAME>:<PASSWORD>@<RDS_ENDPOINT>:5432/grove_production?schema=public&sslmode=require"
```

**Security Requirements**:
- Use a dedicated database user (not postgres/admin)
- Password must be at least 16 characters with mixed case, numbers, and symbols
- Enable SSL mode (sslmode=require) for production
- Use AWS RDS IAM authentication where possible

**Password Generation**:
```bash
# Generate strong database password
openssl rand -base64 24
```

#### 3. API Keys

**OpenAI API Key**:
```bash
OPENAI_API_KEY="sk-..."
```
- Obtain from OpenAI platform
- Restrict API key permissions if possible
- Monitor usage and set budget limits

**Postmark API Key**:
```bash
POSTMARK_API_KEY="..."
```
- Obtain from Postmark account
- Use separate keys for staging/production
- Configure DMARC/SPF/DKIM for email domain

### Complete Environment Variable Checklist

#### Backend (.env in grove-backend/)

```bash
# Database
DATABASE_URL="postgresql://<USER>:<PASS>@<HOST>:5432/grove_production?schema=public&sslmode=require"

# JWT Authentication
JWT_SECRET="<32+ char secret from openssl rand -base64 32>"
JWT_EXPIRATION="7d"

# Magic Link
MAGIC_LINK_EXPIRATION="15m"
MAGIC_LINK_BASE_URL="https://app.commonplace.app"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="text-embedding-3-small"

# Postmark
POSTMARK_API_KEY="..."
POSTMARK_FROM_EMAIL="hello@commonplace.app"

# Redis (for BullMQ)
REDIS_HOST="<redis-host>"
REDIS_PORT="6379"

# Application
NODE_ENV="production"
PORT="4000"
API_PREFIX="api"

# Frontend URL
FRONTEND_URL="https://app.commonplace.app"

# CORS Configuration
ALLOWED_ORIGINS="https://app.commonplace.app"

# AWS (for production)
AWS_REGION="us-east-1"
```

#### Frontend (.env in root/)

```bash
# API Base URL
VITE_API_BASE_URL=https://api.commonplace.app/api
```

## Security Validation Script

Before deploying, run this validation script to ensure all security requirements are met:

```bash
#!/bin/bash
# File: scripts/pre-deploy-security-check.sh

set -e

echo "Grove Deployment Security Validation"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f "grove-backend/.env" ]; then
  echo "ERROR: grove-backend/.env file not found"
  exit 1
fi

# Source .env
source grove-backend/.env

# Validate JWT_SECRET
echo "Checking JWT_SECRET..."
if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET is not set"
  exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "ERROR: JWT_SECRET is less than 32 characters (${#JWT_SECRET})"
  exit 1
fi

if [[ "$JWT_SECRET" == *"CHANGE_ME"* ]] || [[ "$JWT_SECRET" == *"your-super-secret"* ]]; then
  echo "ERROR: JWT_SECRET contains default/example value"
  exit 1
fi

echo "✓ JWT_SECRET is strong"

# Validate DATABASE_URL
echo "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if [[ "$DATABASE_URL" == *"CHANGE_USER"* ]] || [[ "$DATABASE_URL" == *"CHANGE_PASS"* ]]; then
  echo "ERROR: DATABASE_URL contains default credentials"
  exit 1
fi

if [[ "$DATABASE_URL" == *"user:password"* ]]; then
  echo "ERROR: DATABASE_URL contains example credentials"
  exit 1
fi

if [[ "$NODE_ENV" == "production" ]] && [[ "$DATABASE_URL" != *"sslmode=require"* ]]; then
  echo "WARNING: DATABASE_URL should include sslmode=require for production"
fi

echo "✓ DATABASE_URL is configured"

# Validate API Keys
echo "Checking API keys..."
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" == "sk-..." ]; then
  echo "ERROR: OPENAI_API_KEY is not set or using example value"
  exit 1
fi

if [ -z "$POSTMARK_API_KEY" ] || [ "$POSTMARK_API_KEY" == "..." ]; then
  echo "ERROR: POSTMARK_API_KEY is not set or using example value"
  exit 1
fi

echo "✓ API keys are configured"

# Validate NODE_ENV
echo "Checking NODE_ENV..."
if [ "$NODE_ENV" != "production" ] && [ "$NODE_ENV" != "staging" ]; then
  echo "ERROR: NODE_ENV must be 'production' or 'staging' for deployment (got: $NODE_ENV)"
  exit 1
fi

echo "✓ NODE_ENV is set to $NODE_ENV"

# Check npm audit
echo "Running npm audit..."
cd grove-backend
if npm audit --audit-level=high | grep -q "found.*vulnerabilities"; then
  echo "ERROR: High/critical npm vulnerabilities found"
  npm audit --audit-level=high
  exit 1
fi
echo "✓ No high/critical npm vulnerabilities"

cd ..

# Check frontend npm audit
echo "Running frontend npm audit..."
if npm audit --audit-level=high | grep -q "found.*vulnerabilities"; then
  echo "ERROR: High/critical frontend npm vulnerabilities found"
  npm audit --audit-level=high
  exit 1
fi
echo "✓ No high/critical frontend npm vulnerabilities"

echo ""
echo "======================================"
echo "All security checks passed!"
echo "Safe to proceed with deployment"
echo "======================================"
```

## Post-Deployment Verification

After deploying, verify the following security controls are active:

### 1. Security Headers

```bash
# Check security headers are present
curl -I https://api.commonplace.app/api/health

# Should include:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 2. HTTPS/TLS

```bash
# Verify SSL certificate
openssl s_client -connect api.commonplace.app:443 -servername api.commonplace.app

# Check SSL Labs rating
# https://www.ssllabs.com/ssltest/analyze.html?d=api.commonplace.app
# Target: A+ rating
```

### 3. Authentication

```bash
# Verify httpOnly cookies are set
curl -c cookies.txt https://api.commonplace.app/api/auth/verify -d '{"token":"test"}'
grep httpOnly cookies.txt

# Should see accessToken and refreshToken with httpOnly flag
```

### 4. CSRF Protection

```bash
# Verify CSRF protection is active
curl https://api.commonplace.app/api/auth/csrf-token

# Verify POST without CSRF token fails
curl -X POST https://api.commonplace.app/api/profile
# Should return 403 Forbidden
```

### 5. Rate Limiting

```bash
# Verify rate limiting on auth endpoints
for i in {1..15}; do
  curl -X POST https://api.commonplace.app/api/auth/verify -d '{"token":"test"}' &
done

# 11th+ requests should return 429 Too Many Requests
```

## Secret Rotation

### JWT Secret Rotation

When rotating JWT secret:

1. Generate new secret: `openssl rand -base64 32`
2. Update JWT_SECRET in environment
3. Restart application
4. All existing sessions will be invalidated
5. Users will need to log in again

**Recommended rotation**: Every 90 days or immediately if compromised

### Database Password Rotation

When rotating database password:

1. Create new password: `openssl rand -base64 24`
2. Update database user password in PostgreSQL
3. Update DATABASE_URL environment variable
4. Restart application with minimal downtime

**Recommended rotation**: Every 90 days

### API Key Rotation

When rotating API keys:

1. Generate new key in provider dashboard (OpenAI/Postmark)
2. Update environment variable
3. Restart application
4. Deactivate old key after verifying new one works

**Recommended rotation**: Every 180 days

## Incident Response

### If Secrets Are Compromised

1. **Immediately rotate all affected secrets**
2. Audit logs for unauthorized access
3. Invalidate all user sessions if JWT_SECRET compromised
4. Review and update security procedures
5. Document incident in security log

### Emergency Contacts

- **Security Incidents**: [security@commonplace.app]
- **On-Call Engineer**: [PagerDuty rotation]
- **Infrastructure Team**: [Slack channel]

## Compliance Requirements

### SOC2 Requirements

- All secrets must be stored in secure secret management (AWS Secrets Manager, not .env files in production)
- Access to secrets must be logged and audited
- Secrets must be rotated on schedule
- Backup secrets must be encrypted at rest

### GDPR Requirements

- Database encryption at rest enabled
- Database encryption in transit (SSL) enabled
- Access logs must include IP addresses
- Data retention policies enforced

## Additional Security Measures

### 1. Secret Management (Production)

For production deployments, migrate from .env files to AWS Secrets Manager:

```bash
# Store secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name grove/production/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id grove/production/jwt-secret \
  --query SecretString \
  --output text
```

### 2. Database Encryption

- Enable RDS encryption at rest
- Use SSL/TLS for connections (sslmode=require)
- Consider field-level encryption for PII

### 3. Monitoring

- Set up alerts for failed authentication attempts
- Monitor for abnormal API usage patterns
- Track secret access in audit logs

### 4. Backup & Recovery

- Regular database backups (daily minimum)
- Test backup restoration quarterly
- Document recovery procedures

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [NestJS Security](https://docs.nestjs.com/security/authentication)

## Changelog

- 2025-10-23: Initial security checklist created
- Document version: 1.0.0
