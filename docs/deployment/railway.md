# Deploying Grove Backend to Railway

## Overview

This guide walks through deploying the Grove NestJS backend to Railway, a platform designed for full-stack applications with databases.

### Understanding Railway CLI Commands

**Important clarification on Railway CLI**:

| Command | Where It Runs | Use Case |
|---------|---------------|----------|
| `railway run <cmd>` | **Your local machine** | Runs command locally WITH Railway's environment variables (connects to Railway DB) |
| `railway ssh` | **Inside Railway container** | Opens shell session in the running container on Railway |
| Start script in `package.json` | **Railway container** | Runs automatically on deployment |

**Example:**
```bash
# This runs on YOUR laptop but connects to Railway's database:
railway run npx prisma migrate deploy

# This runs INSIDE Railway's container:
railway ssh
npx prisma migrate deploy
```

Both achieve the same result, but run in different locations.

## Why Railway?

- ✅ Perfect for NestJS long-running servers
- ✅ Built-in PostgreSQL with pgvector support
- ✅ Built-in Redis
- ✅ $5/month free credit
- ✅ Easy GitHub integration
- ✅ Automatic HTTPS
- ✅ Environment variable management

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository access
- Frontend deployed to Vercel

## Step 1: Create Railway Project

### 1.1 Sign Up / Login

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"

### 1.2 Deploy from GitHub

1. Select "Deploy from GitHub repo"
2. Choose your Grove repository
3. Railway will detect the monorepo

### 1.3 Configure Root Directory

Since backend is in `grove-backend/` subdirectory:

1. Click on the service
2. Go to Settings → "Root Directory"
3. Set to: `grove-backend`
4. Save changes

## Step 2: Add PostgreSQL Database

### 2.1 Add PostgreSQL Service

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway provisions a PostgreSQL 15 instance
4. Connection details auto-generated

### 2.2 Install pgvector Extension

Railway PostgreSQL needs pgvector for vector embeddings:

1. Go to PostgreSQL service → "Data" tab
2. Click "Query"
3. Run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Or via CLI**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Connect to database
railway connect postgres

# In psql:
CREATE EXTENSION vector;
\q
```

## Step 3: Add Redis Service

### 3.1 Add Redis

1. In your Railway project, click "+ New"
2. Select "Database" → "Redis"
3. Railway provisions Redis instance
4. Connection details auto-generated

## Step 4: Configure Environment Variables

### 4.1 Backend Service Variables

Go to backend service → "Variables" tab:

**Database** (auto-provided by Railway):
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

**Application**:
```bash
NODE_ENV=production
PORT=4000
JWT_SECRET=generate-with-openssl-rand-base64-32
ENCRYPTION_KEY=generate-with-openssl-rand-base64-32
```

**Frontend URL** (for CORS):
```bash
ALLOWED_ORIGINS=https://grove-mvp.vercel.app,https://app.grove.com
```

**Email** (Postmark):
```bash
POSTMARK_API_KEY=your-postmark-api-key
FROM_EMAIL=noreply@grove.com
```

**OpenAI** (for embeddings):
```bash
OPENAI_API_KEY=your-openai-api-key
```

**Sentry** (monitoring):
```bash
SENTRY_DSN=your-backend-sentry-dsn
```

**SSO** (when ready):
```bash
# SAML (per organization in database, but you can set defaults)
SAML_CALLBACK_URL=https://grove-backend-production.up.railway.app/api/auth/saml/callback

# OIDC (per organization in database)
OIDC_CALLBACK_URL=https://grove-backend-production.up.railway.app/api/auth/oidc/callback
```

### 4.2 Generate Secrets

Generate strong secrets locally:

```bash
# JWT_SECRET (32+ characters)
openssl rand -base64 32

# ENCRYPTION_KEY (32+ characters)
openssl rand -base64 32

# Copy output to Railway environment variables
```

## Step 5: Configure Build Settings

### 5.1 Set Build Command

Railway auto-detects package.json, but verify:

1. Go to Settings → "Build"
2. **Install Command**: `npm install`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start:prod`

### 5.2 Set Healthcheck (Optional)

1. Go to Settings → "Healthcheck"
2. **Path**: `/api/health`
3. **Timeout**: 300s
4. **Interval**: 60s

## Step 6: Run Database Migrations

### 6.1 Deploy First (Without Migrations)

Railway will deploy the app, but migrations aren't run yet.

### 6.2 Choose Migration Approach

Railway doesn't automatically run migrations. You have three options:

**Option A: Automatic Migrations (RECOMMENDED)**

Add migrations to your start command in `package.json`:

```json
{
  "scripts": {
    "build": "nest build && npx prisma generate",
    "start:prod": "npx prisma migrate deploy && node dist/main"
  }
}
```

**Important**: Use this format in Railway if setting custom start command:
```bash
/bin/sh -c "npx prisma migrate deploy && npm run start:prod"
```

✅ **Pros**: Automatic, runs on every deployment, no manual steps
⚠️ **Cons**: Deployment fails if migration fails (which is usually what you want)

**Option B: Local Execution via Railway CLI**

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Link to your project
railway link

# Run migration from your local machine (connects to Railway DB)
railway run npx prisma migrate deploy

# Note: "railway run" runs LOCALLY with Railway's environment variables
# It connects to your Railway database from your machine
```

✅ **Pros**: Manual control, can test migrations first
⚠️ **Cons**: Must remember to run manually after each schema change

**Option C: SSH into Railway Container**

```bash
# SSH into running container
railway ssh

# Once inside container:
cd /app
npx prisma migrate deploy
exit
```

✅ **Pros**: Runs directly on Railway infrastructure
⚠️ **Cons**: Container must be running, manual process

### 6.3 Verify Database

Check that tables were created:

```bash
# Connect to database
railway connect postgres

# List tables
\dt

# Should see: users, orgs, profiles, matches, etc.
\q
```

## Step 7: Test Backend Deployment

### 7.1 Get Backend URL

Railway provides a public URL:
- Format: `grove-backend-production.up.railway.app`
- Automatic HTTPS certificate

Find it in: Settings → "Networking" → "Public Networking"

### 7.2 Test Health Endpoint

```bash
curl https://your-backend.up.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "database": "up",
  "redis": "up"
}
```

### 7.3 Test CORS

```bash
curl -H "Origin: https://grove-mvp.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-backend.up.railway.app/api/auth/request-magic-link

# Should return CORS headers:
Access-Control-Allow-Origin: https://grove-mvp.vercel.app
Access-Control-Allow-Credentials: true
```

## Step 8: Seed Initial Data (Optional)

### 8.1 Create Super Admin User

```bash
# Connect to database
railway connect postgres

# Create organization
INSERT INTO orgs (id, name, domain, status)
VALUES ('org-1', 'Grove Admin', 'grove.com', 'active');

# Create super admin user
INSERT INTO users (id, email, name, org_id, role, status)
VALUES ('user-1', 'admin@grove.com', 'Admin User', 'org-1', 'super_admin', 'active');

\q
```

### 8.2 Test Admin Login

1. Go to your Vercel frontend
2. Request magic link for `admin@grove.com`
3. Check Postmark for email
4. Click magic link
5. Should login and redirect to dashboard

## Step 9: Connect Frontend to Backend

### 9.1 Update Frontend Environment

In Vercel:
1. Go to Project Settings → Environment Variables
2. Update `VITE_API_URL`:
```bash
VITE_API_URL=https://your-backend.up.railway.app/api
```

### 9.2 Redeploy Frontend

1. Go to Vercel deployments
2. Click "Redeploy" on latest
3. Or push a new commit to trigger deployment

### 9.3 Test End-to-End

1. Visit your Vercel frontend
2. Request magic link
3. Check email arrives
4. Login successfully
5. Navigate to /admin
6. Verify API calls work

## Step 10: Set Up Custom Domain (Optional)

### 10.1 Add Domain in Railway

1. Go to backend service → Settings → "Networking"
2. Click "Add Custom Domain"
3. Enter: `api.grove.com`
4. Railway provides CNAME record

### 10.2 Configure DNS

At your DNS provider:
```
Type: CNAME
Name: api
Value: your-backend.up.railway.app
```

### 10.3 Update Frontend

Update Vercel environment:
```bash
VITE_API_URL=https://api.grove.com/api
```

## Monitoring & Logs

### View Logs

In Railway:
1. Click on backend service
2. Go to "Logs" tab
3. Real-time logs stream

**Filter logs**:
- By service
- By time range
- Search text

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Response times

Go to "Metrics" tab to view.

### Sentry Integration

Errors automatically sent to Sentry:
- Check Sentry dashboard
- Grouped by error type
- Stack traces included

## Troubleshooting

### Issue: Build Fails

**Symptom**: Deployment fails during build

**Solution**:
```bash
# Check Railway build logs
# Common issues:
# 1. Missing dependencies
# 2. TypeScript errors
# 3. Prisma schema issues

# Test locally:
cd grove-backend
npm install
npm run build

# Fix errors, commit, push
```

### Issue: Database Connection Fails

**Symptom**: "Cannot connect to database"

**Solution**:
```bash
# Check DATABASE_URL is set
# Should be: postgresql://user:pass@host:port/db

# Verify pgvector extension:
railway connect postgres
\dx
# Should show: vector | extension

# If missing:
CREATE EXTENSION vector;
```

### Issue: Migrations Fail

**Symptom**: "Migration failed" error

**Solution**:
```bash
# Reset database (CAUTION: deletes all data)
railway run npx prisma migrate reset

# Or manually run:
railway run npx prisma migrate deploy

# Check migration status:
railway run npx prisma migrate status
```

### Issue: CORS Errors

**Symptom**: Frontend can't call backend

**Solution**:
```bash
# Check ALLOWED_ORIGINS includes Vercel domain
# Must be exact match (https, no trailing slash)

ALLOWED_ORIGINS=https://grove-mvp.vercel.app

# Redeploy backend after changing
```

### Issue: Environment Variables Not Loading

**Symptom**: App crashes, missing config

**Solution**:
1. Go to Railway → Variables
2. Check all required variables are set
3. Check for typos
4. Click "Redeploy" to pick up new variables

## Cost Estimates

**Railway Free Tier**:
- $5 credit per month
- ~500 hours of usage
- Sufficient for:
  - MVP deployment
  - Development/staging
  - Low-traffic pilot

**Railway Pro ($20/month)**:
- $5 credit + pay-as-you-go
- Suitable for:
  - Production deployment
  - 100-1000 users
  - 99.9% uptime SLA

**At Scale**:
- PostgreSQL: ~$5-20/month
- Redis: ~$2-10/month
- Backend compute: ~$10-50/month
- Total: ~$20-80/month

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] JWT_SECRET and ENCRYPTION_KEY generated securely
- [ ] Database migrations applied
- [ ] pgvector extension installed
- [ ] Health endpoint returns 200
- [ ] CORS configured for Vercel domain
- [ ] Postmark API key configured (email works)
- [ ] OpenAI API key configured (embeddings work)
- [ ] Sentry DSN configured (errors tracked)
- [ ] Super admin user created
- [ ] Test end-to-end authentication
- [ ] Test admin dashboard APIs
- [ ] Custom domain configured (optional)
- [ ] Monitor logs for errors
- [ ] Set up Railway alerts

## Continuous Deployment

Railway automatically redeploys on git push:

```bash
# Make changes to backend
cd grove-backend
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: Update backend feature"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Runs build
# 3. Runs migrations (if configured)
# 4. Deploys new version
# 5. Zero-downtime deployment
```

## Alternative Platforms

If Railway doesn't fit your needs:

**Render** (https://render.com):
- Similar to Railway
- $7/month for services
- Built-in PostgreSQL + Redis

**Fly.io** (https://fly.io):
- More control over infrastructure
- Docker-based deployment
- Global edge network

**Heroku** (https://heroku.com):
- Classic PaaS
- More expensive (~$25/month)
- Very reliable

All support NestJS, PostgreSQL, and Redis.

## Next Steps

1. Deploy frontend to Vercel (see DEPLOYMENT_VERCEL_FRONTEND.md)
2. Configure SSO with IdP credentials
3. Load test with realistic traffic
4. Set up database backups
5. Configure monitoring alerts
6. Document deployment for team

## Support

**Railway Documentation**: https://docs.railway.app
**Railway Discord**: Active community support
**Status Page**: https://status.railway.app

---

**Deployment Date**: 2025-10-23
**Backend Version**: Grove MVP v1.0
**Railway Region**: us-west1 (configurable)
