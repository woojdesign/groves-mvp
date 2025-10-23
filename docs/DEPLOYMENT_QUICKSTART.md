# Grove MVP - Deployment Quick Start

## Overview

This guide provides a streamlined path to deploy Grove MVP to production using the recommended architecture:

- **Frontend** → Vercel (React/Vite)
- **Backend** → Railway (NestJS)
- **Database** → Railway PostgreSQL with pgvector
- **Cache** → Railway Redis

**Total Time**: ~1-2 hours
**Cost**: $0-5/month (MVP), $25-30/month (production)

---

## Prerequisites

### Accounts Needed (All Free Tier)
- [ ] GitHub account (for repository)
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Postmark account ([postmarkapp.com](https://postmarkapp.com)) - for emails
- [ ] OpenAI account ([openai.com](https://openai.com)) - for embeddings
- [ ] Sentry account ([sentry.io](https://sentry.io)) - for error tracking

### Local Setup
- [ ] Code committed to GitHub
- [ ] Both frontend and backend build successfully locally

---

## Deployment Steps

### Phase 1: Backend Deployment (30-45 minutes)

#### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub → Select your repository
3. Set root directory to `grove-backend`

#### Step 2: Add Databases

1. Click "+ New" → Database → PostgreSQL
2. Click "+ New" → Database → Redis
3. Wait for provisioning (~2 minutes)

#### Step 3: Enable pgvector

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Connect to database
railway connect postgres

# Enable extension
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

#### Step 4: Configure Environment Variables

In Railway backend service → Variables:

**Copy these** (update values):
```bash
# Database (auto-linked)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Application
NODE_ENV=production
PORT=4000

# Security (GENERATE NEW VALUES!)
JWT_SECRET=REPLACE_WITH_openssl_rand_base64_32
ENCRYPTION_KEY=REPLACE_WITH_openssl_rand_base64_32

# Frontend (will update after Vercel deployment)
ALLOWED_ORIGINS=http://localhost:5173

# Email (get from Postmark)
POSTMARK_API_KEY=your-postmark-api-key
FROM_EMAIL=noreply@yourdomain.com

# AI (get from OpenAI)
OPENAI_API_KEY=your-openai-api-key

# Monitoring (get from Sentry)
SENTRY_DSN=your-backend-sentry-dsn
```

**Generate secrets locally**:
```bash
# JWT_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -base64 32

# Copy outputs to Railway variables
```

#### Step 5: Configure Automatic Migrations (RECOMMENDED)

Update `grove-backend/package.json` to auto-run migrations:

```json
{
  "scripts": {
    "build": "nest build && npx prisma generate",
    "start:prod": "npx prisma migrate deploy && node dist/main"
  }
}
```

Push this change:
```bash
git add grove-backend/package.json
git commit -m "chore: Add automatic migration to start command"
git push
```

Railway will redeploy and automatically run migrations before starting the server.

**Alternative: Manual Migration**

If you prefer manual control, use Railway CLI locally:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Link to project
railway link

# Run migrations from your local machine (connects to Railway DB)
railway run npx prisma migrate deploy

# Note: This runs on YOUR computer but connects to Railway's database
```

#### Step 6: Get Backend URL

1. Go to Settings → Networking → Public Networking
2. Copy URL (e.g., `grove-backend-production.up.railway.app`)
3. **Save this URL** - you'll need it for frontend

#### Step 7: Test Backend

```bash
# Health check
curl https://your-backend.up.railway.app/api/health

# Should return: {"status":"ok","database":"up","redis":"up"}
```

✅ **Backend deployed!**

---

### Phase 2: Frontend Deployment (15-20 minutes)

#### Step 1: Update Environment Variables

Create `.env` in frontend root:

```bash
# Update with your actual backend URL
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_SENTRY_DSN=your-frontend-sentry-dsn
```

Commit this change:
```bash
git add .env
git commit -m "chore: Add production environment config"
git push
```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repository
3. Vercel auto-detects Vite configuration
4. **Do NOT deploy yet** - set environment variables first

#### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables:

```bash
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_SENTRY_DSN=your-frontend-sentry-dsn
```

Apply to: **Production, Preview, Development**

#### Step 4: Deploy

Click "Deploy" - Vercel will:
1. Build your React app
2. Deploy to edge network
3. Provide URL (e.g., `grove-mvp.vercel.app`)

Wait ~2-3 minutes for deployment.

#### Step 5: Update Backend CORS

Now that you have the Vercel URL, update Railway backend:

1. Go to Railway → backend service → Variables
2. Update `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=https://grove-mvp.vercel.app,http://localhost:5173
```
3. Backend will auto-redeploy (~1 minute)

✅ **Frontend deployed!**

---

### Phase 3: Create Admin User (5 minutes)

#### Option A: Via Database (Quick)

```bash
# Connect to Railway database
railway connect postgres

# Create org
INSERT INTO orgs (id, name, domain, status)
VALUES (gen_random_uuid(), 'Admin Org', 'admin.grove.com', 'active')
RETURNING id;

# Copy the org ID, then create user (replace ORG_ID_HERE)
INSERT INTO users (id, email, name, org_id, role, status)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  'Admin User',
  'ORG_ID_HERE',
  'super_admin',
  'active'
);

\q
```

#### Option B: Via Admin API (Proper)

Will be available once you have your first org_admin user.

---

### Phase 4: Test End-to-End (10-15 minutes)

#### Test 1: Basic Authentication

1. Go to your Vercel URL: `https://grove-mvp.vercel.app`
2. Click "Sign In"
3. Enter `admin@yourdomain.com`
4. Check email for magic link
5. Click link → Should redirect and login ✅

#### Test 2: Admin Dashboard

1. Navigate to `/admin`
2. Should see admin dashboard
3. Check user list loads
4. Check audit logs load
5. Check analytics display

#### Test 3: User Management

1. Click "Create User"
2. Fill form, submit
3. New user should appear in list
4. Try editing, suspending user

#### Test 4: Profile & Matching

1. Logout of admin
2. Login as regular user
3. Complete onboarding
4. Create profile
5. View matches (if enabled)

✅ **All tests pass? You're live!**

---

## Post-Deployment

### Monitor for Errors

**Sentry** (5 minutes):
1. Go to [sentry.io](https://sentry.io)
2. Check for errors in:
   - Frontend project (React errors)
   - Backend project (API errors)
3. Set up alerts for new errors

**Railway Logs** (ongoing):
1. Go to Railway → backend → Logs
2. Watch for errors during first day
3. Common issues:
   - CORS errors → Check ALLOWED_ORIGINS
   - Database errors → Check migrations
   - Email errors → Check POSTMARK_API_KEY

### Performance Baseline

**Run these tests**:
```bash
# Backend response time
time curl https://your-backend.up.railway.app/api/health

# Should be < 500ms

# Frontend load time
# Open browser DevTools → Network → Reload
# Should be < 3s
```

### Configure Custom Domains (Optional)

**Backend** (api.yourdomain.com):
1. Railway → Settings → Networking → Custom Domain
2. Add `api.yourdomain.com`
3. Configure CNAME at DNS provider

**Frontend** (app.yourdomain.com):
1. Vercel → Settings → Domains
2. Add `app.yourdomain.com`
3. Configure CNAME at DNS provider

**Update Environment**:
```bash
# Vercel:
VITE_API_URL=https://api.yourdomain.com/api

# Railway:
ALLOWED_ORIGINS=https://app.yourdomain.com
```

---

## Troubleshooting

### Frontend Can't Reach Backend

**Symptom**: Network errors in browser console

**Check**:
1. Backend URL correct in `VITE_API_URL`?
2. Backend health endpoint works?
3. CORS configured with Vercel domain?

**Fix**:
```bash
# Update Railway ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://grove-mvp.vercel.app

# Redeploy backend (auto-deploys on save)
```

### Magic Link Email Not Sending

**Symptom**: No email arrives

**Check**:
1. Postmark API key set?
2. FROM_EMAIL is verified in Postmark?
3. Check Railway logs for email errors

**Fix**:
```bash
# Verify Postmark setup
curl -X POST "https://api.postmarkapp.com/email" \
  -H "X-Postmark-Server-Token: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "From": "noreply@yourdomain.com",
    "To": "test@example.com",
    "Subject": "Test",
    "TextBody": "Test email"
  }'
```

### Database Connection Fails

**Symptom**: Backend crashes on startup

**Check**:
1. pgvector extension enabled?
2. Migrations applied?
3. DATABASE_URL set correctly?

**Fix**:
```bash
# Check extension
railway connect postgres
\dx
# Should show: vector

# Run migrations
railway run npx prisma migrate deploy
```

### Build Fails

**Symptom**: Deployment fails

**Check**:
1. Builds locally?
2. TypeScript errors?
3. Dependencies installed?

**Fix**:
```bash
# Test locally
npm run build

# Fix errors, commit, push
git add .
git commit -m "fix: Build errors"
git push
```

---

## Success Checklist

Before announcing to users:

- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Magic link authentication works
- [ ] Admin dashboard accessible
- [ ] User can complete onboarding
- [ ] Profile creation works
- [ ] Matching generates results
- [ ] Emails send successfully
- [ ] Sentry capturing errors
- [ ] CORS configured correctly
- [ ] Custom domains work (if configured)
- [ ] SSL certificates active (automatic)
- [ ] Database backups enabled (Railway auto-backups)
- [ ] Monitoring alerts configured

---

## Cost Summary

### MVP / Pilot (First Month)

**Free Tier**:
- Vercel: $0 (100 GB bandwidth)
- Railway: $5 credit (free tier)
- Postmark: $0 (100 emails/month)
- Sentry: $0 (5k errors/month)
- OpenAI: ~$1-5 (embeddings usage)

**Total**: ~$1-5/month

### Production (Steady State)

**Paid Tiers**:
- Vercel Pro: $20/month
- Railway: ~$10-20/month (compute + DB)
- Postmark: $10/month (10k emails)
- Sentry: $26/month (50k errors)
- OpenAI: ~$10-50/month (usage-based)

**Total**: ~$76-126/month for 100-1000 users

---

## Next Steps

1. **Week 1**: Monitor logs and Sentry for errors
2. **Week 2**: Configure SSO (SAML/OIDC) with IdP
3. **Week 3**: Load test with realistic traffic
4. **Month 1**: Review metrics and optimize

---

## Support Resources

**Documentation**:
- Detailed guides in `/docs` folder
- Frontend: `DEPLOYMENT_VERCEL_FRONTEND.md`
- Backend: `DEPLOYMENT_RAILWAY_BACKEND.md`

**Platform Support**:
- Vercel: https://vercel.com/support
- Railway: https://discord.gg/railway
- Issues: https://github.com/your-repo/issues

---

**Deployment Guide Version**: 1.0
**Last Updated**: 2025-10-23
**Tested With**: Grove MVP Phases 0-3 Complete
