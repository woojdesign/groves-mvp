# Vercel Configuration Explained

This document explains the configuration in `/vercel.json`.

## Current Configuration

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Configuration Details

### Rewrites

**Purpose**: Enable client-side routing for React Router.

**How it Works**:
- All requests (`(.*)`) are rewritten to `/index.html`
- This allows React Router to handle routing on the client side
- Without this, direct navigation to `/profile` would return 404

**Example**:
- User visits `https://grove.app/matches`
- Vercel serves `index.html`
- React Router renders the Matches page

## Additional Configuration (If Needed)

### Environment Variables

Set in Vercel dashboard:
```
VITE_API_URL=https://api.grove.app
VITE_ENV=production
```

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Headers (Security - Future)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

**Last Updated**: 2025-10-24
**Related**: [Vercel Deployment Guide](/docs/deployment/vercel.md)
