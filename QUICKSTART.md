# Grove Integration - Quick Start Guide

## 🚀 Running the Integrated App

### 1. Start Backend (Terminal 1)

```bash
cd grove-backend
npm run start:dev
```

Backend will run on `http://localhost:4000`

### 2. Start Frontend (Terminal 2)

```bash
cd /workspace
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Open Browser

Navigate to: `http://localhost:5173`

---

## 🧪 Testing the Integration

### Test Magic Link Flow

1. Enter email and name on welcome screen
2. Click "Join commonplace"
3. Check console logs for magic link URL
4. Copy the token from the magic link
5. Navigate to: `http://localhost:5173/auth/verify?token=YOUR_TOKEN`
6. Should redirect to onboarding

### Test Onboarding

1. Complete all 5 steps
2. Click "Complete" on final step
3. Should see matching animation
4. Should redirect to dashboard

### Test Matching

1. Dashboard should load matches
2. Click "I'd love to connect" to accept
3. Click "Maybe later" to pass
4. Should see next match

---

## 🐛 Troubleshooting

### Backend not responding

```bash
# Check if backend is running
curl http://localhost:4000/health
```

Should return: `{"status":"ok"}`

### CORS errors

Add to backend `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Magic link not working

Check backend logs for email service errors. For development, you can extract the token from the logs and manually construct the URL.

### Auth errors

Clear localStorage:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

---

## 📁 Key Files

- **API Client**: `src/lib/api.ts`
- **API Services**: `src/lib/apiService.ts`
- **Routes**: `src/main.tsx`
- **Auth**: `src/components/AuthCallback.tsx`
- **Config**: `src/config/env.ts`

---

## 📚 Further Reading

For comprehensive documentation:
- [Complete Documentation](/docs/README.md) - Full documentation index
- [System Architecture](/docs/development/architecture.md) - Technical architecture overview
- [API Specification](/docs/api/specification.md) - Complete API reference
- [Deployment Guides](/docs/deployment/) - Production deployment

---

## ✅ What's Integrated

- ✅ Magic link authentication
- ✅ JWT token management
- ✅ Onboarding submission
- ✅ Match fetching
- ✅ Accept/pass actions
- ✅ Error handling
- ✅ Loading states
- ✅ Protected routes

---

**Happy testing!** 🌿
