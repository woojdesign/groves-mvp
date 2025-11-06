# Staging Environment - Quick Deploy Guide

**Timeline**: ~2 hours
**Prerequisites**: Railway account, Vercel account (you have both ✓)

## Part 1: Railway Backend (60 min)

### Step 1: Create Railway Project (5 min)
1. Go to https://railway.app
2. Click "New Project" → "Provision PostgreSQL"
3. Name: `grove-staging-db`
4. Click "New" → "Empty Service" → Name: `grove-staging-backend`

### Step 2: Configure PostgreSQL (10 min)
1. Click on PostgreSQL service
2. Click "Variables" tab
3. Copy `DATABASE_URL` (format: `postgresql://user:pass@host:port/db`)
4. Click "Settings" → Enable "Public Networking" (for pgvector setup)
5. In terminal, connect to install pgvector:
```bash
# Railway will show connection string, use it:
psql <DATABASE_URL_FROM_RAILWAY>
```
6. In psql prompt:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
\dx  -- verify pgvector is listed
\q
```

### Step 3: Add Redis (5 min)
1. In Railway project, click "New" → "Database" → "Add Redis"
2. Name: `grove-staging-redis`
3. Click "Variables" tab
4. Copy `REDIS_URL` (format: `redis://default:pass@host:port`)

### Step 4: Configure Backend Environment Variables (15 min)
1. Click on `grove-staging-backend` service
2. Click "Variables" tab
3. Click "Raw Editor" and paste:

```bash
# Database
DATABASE_URL=<paste from PostgreSQL service>
REDIS_URL=<paste from Redis service>

# Node
NODE_ENV=staging

# Server
PORT=4000
FRONTEND_URL=https://grove-staging.vercel.app

# Auth (generate new secrets for staging!)
JWT_SECRET=<generate with: openssl rand -base64 32>
MAGIC_LINK_SECRET=<generate with: openssl rand -base64 32>
SESSION_SECRET=<generate with: openssl rand -base64 32>

# OpenAI (use your existing key or create staging-specific)
OPENAI_API_KEY=<your key>
OPENAI_MODEL=text-embedding-3-small

# Email (for magic links - configure SendGrid/Resend)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<your sendgrid api key>
SMTP_FROM=noreply@yourdomain.com

# Feature Flags
ENABLE_DEV_DASHBOARD=true
ALLOW_TEST_DATA_GENERATION=true
```

4. Click "Save"

### Step 5: Deploy Backend Code (15 min)
1. In Railway, click "Settings" tab on backend service
2. Connect GitHub repo or use CLI:

**Option A: GitHub (recommended)**
- Click "Connect Repo" → Select your Grove repo
- Root Directory: `grove-backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Click "Deploy"

**Option B: Railway CLI**
```bash
cd /workspace/grove-backend
npm install -g @railway/cli
railway login
railway link  # select grove-staging-backend
railway up
```

### Step 6: Run Database Migrations (10 min)
1. Wait for deployment to finish (check "Deployments" tab)
2. Click "Settings" → "Deploy" → "Custom Start Command"
3. Temporarily change to: `npm run migration:deploy && npm run seed && npm run start:prod`
4. Click "Redeploy" (this will run migrations + seed data + start)
5. Check logs for "Database migration complete" and "Seeded X users"
6. After successful deployment, change start command back to: `npm run start:prod`

### Step 7: Verify Backend (5 min)
1. Click "Settings" → "Networking" → "Generate Domain"
2. Copy the Railway URL (e.g., `grove-staging-backend.railway.app`)
3. Test health endpoint:
```bash
curl https://<your-railway-url>/health
# Should return: {"status":"ok","database":"connected"}
```

## Part 2: Vercel Frontend (30 min)

### Step 1: Create Vercel Project (5 min)
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your Grove GitHub repo
4. Project name: `grove-staging`
5. **DO NOT DEPLOY YET** - click "Edit" on Environment Variables first

### Step 2: Configure Frontend Environment Variables (10 min)
Click "Environment Variables" and add:

```bash
VITE_API_URL=https://<your-railway-backend-url>
VITE_ENV=staging
```

**Important**: Make sure to use the Railway backend URL from Part 1, Step 7

### Step 3: Configure Build Settings (5 min)
1. Root Directory: leave blank (monorepo root)
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`

### Step 4: Deploy (5 min)
1. Click "Deploy"
2. Wait for build to complete (~2-3 min)
3. You'll get a URL like: `grove-staging.vercel.app`

### Step 5: Update Backend CORS (5 min)
1. Go back to Railway
2. Click on backend service → "Variables"
3. Update `FRONTEND_URL` to match your Vercel URL:
```bash
FRONTEND_URL=https://grove-staging.vercel.app
```
4. Redeploy backend

## Part 3: Verification & Testing (30 min)

### Step 1: Test Authentication Flow (10 min)
1. Visit `https://grove-staging.vercel.app`
2. Enter email: `test@example.com`
3. Check backend logs in Railway for magic link token
4. Use token to log in
5. Verify redirect to onboarding

### Step 2: Test Dev Dashboard (10 min)
1. Create super admin user in Railway backend:
```bash
# In Railway backend service → "Settings" → "Deploy" → One-off Command:
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: 'test@example.com' },
  data: { role: 'SUPER_ADMIN' }
}).then(() => console.log('Super admin created')).finally(() => prisma.\$disconnect());
"
```

2. Visit `https://grove-staging.vercel.app/admin/dev`
3. Generate 10 test personas
4. Verify personas display with full interests/project/deepDive
5. Test "Preview Matches" - should show similarity scores

### Step 3: Test Core Matching Flow (10 min)
1. Complete onboarding as regular user
2. Submit profile with interests/project
3. Check Railway backend logs for embedding generation
4. Wait ~30 seconds for background job
5. Check that matches appear on dashboard

## Quick Reference

### Railway URLs
- Backend: `https://<project>.railway.app`
- PostgreSQL: Internal (use DATABASE_URL)
- Redis: Internal (use REDIS_URL)

### Vercel URL
- Frontend: `https://grove-staging.vercel.app`

### Admin Access
- Create super admin via Railway CLI or one-off command
- Dev dashboard: `/admin/dev`

### Monitoring
- Backend logs: Railway dashboard → service → "Logs"
- Frontend logs: Vercel dashboard → project → "Logs"
- Database: Railway → PostgreSQL service → "Query"

### Cost Estimate (Free Tier)
- Railway: $5/month (500 hours included)
- Vercel: Free (hobby tier)
- Total: ~$5/month

## Troubleshooting

### Backend won't start
- Check logs in Railway for errors
- Verify DATABASE_URL and REDIS_URL are correct
- Ensure pgvector extension is installed

### Frontend can't reach backend
- Verify VITE_API_URL matches Railway backend URL
- Check CORS: FRONTEND_URL in backend must match Vercel URL
- Test backend health endpoint directly

### Embeddings not generating
- Verify OPENAI_API_KEY is valid
- Check Redis connection (embedding jobs use Bull queue)
- Look for errors in Railway backend logs

### Magic links not working
- Check SMTP configuration
- For testing: Use Railway logs to get magic link tokens directly
- Verify JWT_SECRET and MAGIC_LINK_SECRET are set

## Next Steps After Staging

1. Test with cofounder
2. Collect feedback
3. Set up custom domain (optional)
4. Configure production-grade email service
5. Set up monitoring (Sentry, LogRocket)
6. Plan production deployment

## Security Notes for Staging

- ✓ Use different secrets than local dev
- ✓ Use different database than production
- ✓ Enable dev dashboard (ENABLE_DEV_DASHBOARD=true)
- ✓ Allow test data generation for testing
- ✗ Don't use production API keys
- ✗ Don't expose staging URLs publicly until ready

## Getting Help

If stuck:
1. Check Railway logs: service → "Logs" tab
2. Check Vercel logs: deployment → "Function Logs"
3. Verify environment variables match this guide
4. Review full deployment guides:
   - `/workspace/docs/deployment/railway-backend-deployment.md`
   - `/workspace/docs/deployment/vercel-frontend-deployment.md`
