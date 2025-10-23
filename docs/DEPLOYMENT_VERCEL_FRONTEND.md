# Deploying Grove Frontend to Vercel

## Overview

This guide walks through deploying the Grove React frontend to Vercel while keeping the backend on a separate platform (Railway, Render, or Fly.io).

## Prerequisites

- Vercel account (free tier works)
- GitHub repository access
- Backend deployed and accessible via HTTPS

## Step 1: Prepare Frontend for Deployment

### 1.1 Update Environment Variables

The frontend needs to know where the backend API is. Update your local `.env` file:

```bash
# .env (frontend root)
VITE_API_URL=https://your-backend-domain.railway.app/api
VITE_SENTRY_DSN=your-sentry-frontend-dsn
```

### 1.2 Update CORS on Backend

Ensure your backend allows requests from your Vercel domain:

```typescript
// grove-backend/src/main.ts
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim());

// Add your Vercel domain
// Example: https://grove-mvp.vercel.app, https://grove.yourdomain.com
```

Set in backend environment:
```bash
ALLOWED_ORIGINS=https://grove-mvp.vercel.app,https://grove.yourdomain.com,http://localhost:5173
```

### 1.3 Verify Build Works Locally

```bash
# Test production build
npm run build

# Should output to dist/ folder
# Check for any build errors
```

## Step 2: Deploy to Vercel via GitHub

### 2.1 Push to GitHub

Ensure your code is pushed to GitHub (if not already):

```bash
git add .
git commit -m "chore: Prepare for Vercel deployment"
git push origin main
```

### 2.2 Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

### 2.3 Configure Build Settings

Vercel should auto-detect these, but verify:

```yaml
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2.4 Set Environment Variables

In Vercel project settings → Environment Variables:

**Production Environment**:
```
VITE_API_URL=https://your-backend-domain.railway.app/api
VITE_SENTRY_DSN=your-sentry-frontend-dsn-here
```

**Preview Environment** (optional for staging):
```
VITE_API_URL=https://your-backend-staging.railway.app/api
VITE_SENTRY_DSN=your-sentry-frontend-dsn-here
```

### 2.5 Deploy

Click "Deploy" - Vercel will:
1. Install dependencies
2. Run `npm run build`
3. Deploy to CDN
4. Provide deployment URL (e.g., `grove-mvp.vercel.app`)

## Step 3: Configure Custom Domain (Optional)

### 3.1 Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.grove.com`)
3. Follow DNS configuration instructions

### 3.2 Update DNS Records

Add these records at your DNS provider:

```
Type: CNAME
Name: app (or @ for root)
Value: cname.vercel-dns.com
```

### 3.3 Update Backend CORS

Add your custom domain to backend ALLOWED_ORIGINS:

```bash
ALLOWED_ORIGINS=https://app.grove.com,https://grove-mvp.vercel.app
```

## Step 4: Verify Deployment

### 4.1 Test Basic Functionality

1. Visit your Vercel URL
2. Try authentication (magic link)
3. Check browser console for API errors
4. Verify CORS is working (no CORS errors)

### 4.2 Test Admin Dashboard

1. Login as org_admin or super_admin
2. Navigate to `/admin`
3. Test user management
4. Check audit logs load

### 4.3 Monitor Sentry

1. Go to Sentry dashboard
2. Verify events are coming from Vercel domain
3. Check for any JavaScript errors

## Step 5: Enable Preview Deployments

Vercel automatically creates preview deployments for:
- Pull requests
- Branch pushes

**Access previews**:
- Each PR gets unique URL: `grove-mvp-git-feature-branch.vercel.app`
- Share with QA team for testing

## Troubleshooting

### Issue: API Requests Failing

**Symptom**: Network errors, 404s when calling backend

**Solution**:
```bash
# Check VITE_API_URL is correct
echo $VITE_API_URL

# Must be the full backend URL with /api
# Example: https://grove-backend.railway.app/api
```

### Issue: CORS Errors

**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
```bash
# Backend ALLOWED_ORIGINS must include Vercel domain
ALLOWED_ORIGINS=https://grove-mvp.vercel.app,https://app.grove.com

# Redeploy backend after changing
```

### Issue: Environment Variables Not Working

**Symptom**: `import.meta.env.VITE_API_URL` is undefined

**Solution**:
1. Check Vercel dashboard → Environment Variables
2. Must start with `VITE_` prefix
3. Redeploy after adding variables (click "Redeploy" in Deployments)

### Issue: Build Fails

**Symptom**: Vercel build errors

**Solution**:
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Fix any errors, commit, push
```

## Production Checklist

Before going live:

- [ ] Backend deployed and accessible via HTTPS
- [ ] VITE_API_URL points to production backend
- [ ] Backend ALLOWED_ORIGINS includes Vercel domain
- [ ] Sentry DSN configured for error tracking
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Test authentication flow end-to-end
- [ ] Test admin dashboard functionality
- [ ] Monitor Sentry for errors after deployment
- [ ] Set up Vercel alerts for build failures

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Sends deployment notification
```

## Cost Considerations

**Vercel Free Tier**:
- 100 GB bandwidth/month
- Unlimited deployments
- Custom domains
- SSL certificates
- Preview deployments

**Sufficient for**:
- MVP and pilot deployments
- Up to ~10,000 users/month
- Development and staging

**Upgrade to Pro ($20/month) when**:
- Need more bandwidth (1 TB)
- Need team collaboration
- Need advanced analytics
- Enterprise SSO for Vercel dashboard

## Next Steps

1. Deploy backend to Railway/Render (see DEPLOYMENT_RAILWAY_BACKEND.md)
2. Configure production environment variables
3. Test end-to-end in production
4. Set up monitoring and alerts
5. Share Vercel URL with stakeholders

## Support

**Vercel Documentation**: https://vercel.com/docs
**Vercel Discord**: Community support available
**Status Page**: https://vercel-status.com

---

**Deployment Date**: 2025-10-23
**Frontend Version**: Grove MVP v1.0
**Vercel Region**: Automatic (closest to users)
