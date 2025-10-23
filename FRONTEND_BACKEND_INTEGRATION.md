# Grove Frontend-Backend Integration

## Overview

The Grove MVP frontend has been successfully integrated with the backend APIs. All components now make real API calls instead of using mock data.

## What Changed

### New Files Created

#### API Infrastructure
- **`src/lib/api.ts`** - Axios client with JWT token management, request/response interceptors, and automatic token refresh
- **`src/lib/apiService.ts`** - High-level service functions for all API endpoints
- **`src/types/api.ts`** - TypeScript interfaces for all API requests/responses
- **`src/config/env.ts`** - Environment configuration (API base URL, timeouts)

#### UI Components
- **`src/components/ui/loading-spinner.tsx`** - Loading spinner with variants (LoadingSpinner, LoadingOverlay, LoadingCard)
- **`src/components/ui/error-message.tsx`** - Error display with retry functionality (ErrorMessage, ErrorBanner)
- **`src/components/ui/empty-state.tsx`** - Empty state component for no data scenarios
- **`src/lib/utils.ts`** - Utility function for className merging (cn)

#### New Components
- **`src/components/AuthCallback.tsx`** - Handles magic link verification from email
- **`src/components/ProtectedRoute.tsx`** - Route wrapper for authentication checks

### Updated Components

#### `src/components/Welcome.tsx`
- Added real magic link request via `requestMagicLink()` API
- Loading states during API call
- Error handling with user-friendly messages
- Rate limiting and validation error display

#### `src/components/Onboarding.tsx`
- Submits onboarding data to backend via `submitOnboarding()` API
- Maps frontend form data to API format
- Loading states and error handling
- Navigation to matching animation after success
- Handles connection type mapping (friendly labels → API values)

#### `src/components/Dashboard.tsx`
- Fetches real matches from backend via `getMatches()` API
- Loading state while fetching matches
- Error handling with retry functionality
- Empty state when no matches available
- Proper match progression after actions

#### `src/components/MatchCard.tsx`
- Real accept/pass actions via `acceptMatch()` and `passMatch()` APIs
- Mutual match detection and celebration UI
- Loading states during API calls
- Error handling with dismiss functionality
- Different overlays for single vs mutual matches

#### `src/main.tsx`
- Complete routing structure with React Router
- Protected routes for authenticated pages
- Auth callback route for magic link verification
- Legacy `/dev` route for backward compatibility

### Authentication Flow

1. **Welcome Screen (`/`)**
   - User enters email and name
   - Frontend calls `POST /api/auth/magic-link`
   - Success message shown

2. **Magic Link Email**
   - User clicks link in email
   - Redirects to `/auth/verify?token=...`

3. **Auth Callback (`/auth/verify`)**
   - Frontend calls `POST /api/auth/verify` with token
   - Receives JWT tokens (access + refresh)
   - Stores tokens in localStorage
   - Redirects to `/onboarding` or `/dashboard` based on `hasCompletedOnboarding`

4. **Protected Routes**
   - All routes except `/` and `/auth/verify` check for valid JWT
   - Automatic token refresh when expired (using refresh token)
   - Redirect to `/` if not authenticated

### API Integration Details

#### Token Management
- **Access Token**: Stored in `localStorage` as `grove_access_token`
- **Refresh Token**: Stored in `localStorage` as `grove_refresh_token`
- **Auto-injection**: Access token automatically added to all requests via interceptor
- **Auto-refresh**: When access token expires (401), automatically refreshes using refresh token
- **Logout**: Clears tokens from localStorage

#### Error Handling
- **Network errors**: Displayed with retry button
- **Validation errors**: Displayed with specific field messages
- **Rate limiting**: User-friendly message with wait time
- **Auth errors**: Automatic redirect to welcome screen

#### Loading States
- **Welcome**: "Sending magic link..." during submission
- **Onboarding**: "Submitting..." during final submission
- **Dashboard**: "Finding your matches..." while fetching
- **Match actions**: "Connecting..." during accept/pass

## Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy from example
cp .env.example .env

# Edit with your backend URL
VITE_API_BASE_URL=http://localhost:4000/api
```

### Environment Variables

- **`VITE_API_BASE_URL`**: Backend API base URL
  - Development: `http://localhost:4000/api`
  - Production: `https://api.commonplace.app/api`

## Running the Integrated Application

### Prerequisites

1. **Backend must be running** on `http://localhost:4000`
2. **Database must be set up** with proper migrations
3. **Email service (Postmark)** must be configured for magic links

### Start Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
```

### Start Backend

```bash
cd grove-backend
npm run start:dev
```

### Access Application

Open browser to `http://localhost:5173` (Vite default)

## Testing the Integration

### Manual Testing Checklist

#### 1. Authentication Flow
- [ ] Enter email and name on welcome screen
- [ ] Verify "Check your email" message appears
- [ ] Check email for magic link
- [ ] Click magic link
- [ ] Verify redirect to onboarding (new user) or dashboard (existing user)
- [ ] Verify JWT tokens stored in localStorage

#### 2. Onboarding Flow
- [ ] Complete all 5 onboarding steps
- [ ] Verify data persists when navigating back
- [ ] Verify final submission works
- [ ] Verify redirect to matching animation
- [ ] Check backend database for profile record

#### 3. Matching Flow
- [ ] Verify matches load on dashboard
- [ ] Verify loading spinner shows while fetching
- [ ] Click "pass" on a match
- [ ] Verify next match appears
- [ ] Click "accept" on a match
- [ ] Verify acceptance confirmation shows
- [ ] Test mutual match (requires 2 users)

#### 4. Error Handling
- [ ] Test with backend offline (should show error with retry)
- [ ] Test with invalid email domain (should show 403 error)
- [ ] Test with expired magic link (should show error)
- [ ] Test rate limiting (3 magic link requests in 10 minutes)

#### 5. Token Management
- [ ] Test automatic token refresh (wait 15 minutes, make request)
- [ ] Test logout (should clear tokens and redirect)
- [ ] Test accessing protected route without login (should redirect)

### Common Issues

#### "Network Error" on API calls
- **Cause**: Backend not running or wrong URL
- **Fix**: Ensure backend is running on `http://localhost:4000`

#### "403 Forbidden" on magic link
- **Cause**: Email domain not authorized
- **Fix**: Add organization to backend database or use authorized domain

#### "401 Unauthorized" on protected routes
- **Cause**: No valid JWT token
- **Fix**: Complete authentication flow from welcome screen

#### Magic link not received
- **Cause**: Postmark not configured or email blocked
- **Fix**: Check backend logs, verify Postmark API key, check spam folder

## API Endpoints Used

### Authentication
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify` - Verify token and get JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Onboarding & Profile
- `POST /api/onboarding` - Submit onboarding responses
- `GET /api/profile` - Get current user profile
- `PATCH /api/profile` - Update profile (future)

### Matching
- `GET /api/matches?status=pending&limit=10` - Get pending matches
- `POST /api/matches/:id/accept` - Accept a match
- `POST /api/matches/:id/pass` - Pass on a match

## TypeScript Types

All API types are defined in `src/types/api.ts`:

- `User`, `AuthResponse`
- `Profile`, `OnboardingResponses`
- `Match`, `MatchesResponse`, `MatchActionResponse`
- `ApiError`, `RateLimitError`

## Development Notes

### Backward Compatibility

The old state machine version of App.tsx is still accessible at `/dev` for development and testing purposes.

### DevMenu

The DevMenu component still works in the new routing structure when accessing `/dev`.

### Animations

All original animations and beautiful UI are preserved. Only the data layer changed.

## Next Steps

### Recommended Enhancements

1. **Add user profile page** - View/edit profile after onboarding
2. **Add introductions view** - Show mutual matches and intro emails
3. **Add feedback flow** - Submit feedback after meetings
4. **Add settings page** - Pause matching, notification preferences
5. **Add intro fetching** - Display active introductions from `GET /api/intros`
6. **Improve token refresh** - Proactive refresh before expiry
7. **Add retry logic** - Automatic retry for transient failures
8. **Add optimistic updates** - Instant UI feedback before API response

### Performance Optimizations

1. **Code splitting** - Use dynamic imports for routes
2. **API response caching** - Cache matches for short duration
3. **Debounce API calls** - Prevent duplicate requests
4. **Lazy load images** - Defer non-critical image loading

## Troubleshooting

### Clear localStorage

If experiencing auth issues:

```javascript
// In browser console
localStorage.clear()
// Then refresh page
```

### Check API connectivity

```bash
# Test backend health
curl http://localhost:4000/health

# Should return: {"status":"ok", ...}
```

### View network requests

Open browser DevTools → Network tab → Filter by "api" to see all API calls and responses.

## Summary

The Grove MVP frontend is now fully integrated with the backend:

✅ Authentication with magic links
✅ JWT token management with auto-refresh
✅ Onboarding data submission
✅ Real match fetching and actions
✅ Comprehensive error handling
✅ Loading states throughout
✅ Protected routes
✅ All animations preserved
✅ Beautiful UI maintained

The integration is complete and ready for testing!
