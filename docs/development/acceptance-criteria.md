# Grove MVP - Acceptance Criteria & Test Plan

**Version**: 1.0
**Date**: 2025-10-22
**Status**: Ready for Testing

---

## Overview

This document provides comprehensive acceptance criteria and manual testing procedures for the Grove MVP. All backend and frontend integration is complete and ready for end-to-end testing.

---

## Pre-Testing Setup

### 1. Start Backend Services

```bash
cd grove-backend

# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Run database migrations
npx prisma migrate deploy

# Seed test data (3 users)
npx prisma db seed

# Start backend API
npm run start:dev
```

**Expected Output**:
- Backend running on `http://localhost:4000`
- Health check: `http://localhost:4000/health` returns `{"status":"ok"}`

### 2. Configure Environment

Update `.env` file in `grove-backend/`:
```env
# Required for email testing
POSTMARK_API_KEY="your-real-api-key-here"

# Or use test mode (emails logged to console)
POSTMARK_API_KEY="test-key"
```

### 3. Start Frontend

```bash
# In root directory
npm install
npm run dev
```

**Expected Output**:
- Frontend running on `http://localhost:5173`
- No console errors

---

## Test Scenarios

### 🔐 AC-1: Authentication Flow (Magic Link)

#### AC-1.1: Request Magic Link

**Steps**:
1. Navigate to `http://localhost:5173`
2. Enter email: `alice@example.com`
3. Enter name: `Alice Test`
4. Click "Continue"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Success message: "Magic link sent to alice@example.com"
- ✅ Email sent (check Postmark logs or inbox)
- ✅ Email contains beautiful Grove-branded template
- ✅ Email contains "Sign in to Grove" button

**Acceptance Criteria**:
- [ ] Form submits successfully
- [ ] Loading state shown
- [ ] Success message displayed
- [ ] Email received (or logged if using test key)
- [ ] No console errors

---

#### AC-1.2: Magic Link Verification

**Steps**:
1. Find magic link in email or backend logs
2. Extract token from URL: `http://localhost:5173/auth/verify?token=...`
3. Click link or paste URL in browser

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Token verified successfully
- ✅ JWT tokens stored in localStorage
- ✅ Redirected to onboarding (if new user) or dashboard (if returning)
- ✅ No console errors

**Acceptance Criteria**:
- [ ] Token verification succeeds
- [ ] JWT tokens stored (`accessToken`, `refreshToken`)
- [ ] Correct redirect based on user state
- [ ] User data available in app state

---

#### AC-1.3: Rate Limiting

**Steps**:
1. Request magic link 4 times in quick succession for same email
2. Observe 4th request

**Expected Results**:
- ✅ First 3 requests succeed
- ✅ 4th request fails with rate limit error
- ✅ Error message: "Too many requests. Please try again in X minutes."
- ✅ Countdown timer shown

**Acceptance Criteria**:
- [ ] Rate limiting enforced (3 requests per 10 minutes)
- [ ] Clear error message shown
- [ ] Countdown timer accurate
- [ ] Can retry after cooldown period

---

#### AC-1.4: Invalid Email Domain

**Steps**:
1. Enter email from unauthorized domain: `test@unauthorized.com`
2. Click "Continue"

**Expected Results**:
- ✅ Success message shown (no enumeration)
- ✅ "Magic link sent to test@unauthorized.com"
- ✅ No email actually sent
- ✅ Backend logs show "Unallowed domain" warning

**Acceptance Criteria**:
- [ ] Returns success to prevent email enumeration
- [ ] No email sent to unauthorized domains
- [ ] Warning logged on backend
- [ ] User cannot proceed without allowed domain

---

### 📝 AC-2: Onboarding Flow

#### AC-2.1: Complete Onboarding

**Steps**:
1. Log in as new user
2. Navigate through 5 onboarding steps:
   - **Step 1**: Enter niche interest (min 20 chars)
   - **Step 2**: Enter current project (min 20 chars)
   - **Step 3**: Select connection type (collaboration/mentorship/friendship/knowledge_exchange)
   - **Step 4**: Optional rabbit hole (skip or enter)
   - **Step 5**: Optional preferences (skip or enter)
3. Click "Complete" on final step

**Expected Results**:
- ✅ Progress bar updates with each step
- ✅ Back button works to navigate previous steps
- ✅ Validation errors shown for too-short answers
- ✅ Loading spinner on "Complete"
- ✅ Profile saved to backend
- ✅ Navigate to matching animation
- ✅ Embedding generation job queued

**Acceptance Criteria**:
- [ ] All 5 steps navigable
- [ ] Validation works (min 20 chars)
- [ ] Profile submitted successfully
- [ ] Data persisted in database
- [ ] Embedding job queued
- [ ] Smooth transition to matching animation

**Test Data Example**:
```
Niche Interest: "I'm really into urban beekeeping and teaching people about pollinators in cities"
Project: "Building a community garden database to track crop yields across different neighborhoods"
Connection Type: "collaboration"
Rabbit Hole: "Recently went deep on permaculture principles and regenerative agriculture"
Preferences: "I prefer async communication first, then maybe a coffee chat"
```

---

#### AC-2.2: Validation Errors

**Steps**:
1. On Step 1, enter only 10 characters
2. Try to proceed to next step

**Expected Results**:
- ✅ Error message: "Please enter at least 20 characters"
- ✅ Cannot proceed to next step
- ✅ Input field highlighted in red

**Acceptance Criteria**:
- [ ] Min length validation enforced (20 chars)
- [ ] Max length enforced (500 chars)
- [ ] Clear error messages
- [ ] Cannot bypass validation

---

#### AC-2.3: Embedding Generation

**Steps**:
1. Complete onboarding
2. Wait 30-60 seconds
3. Check backend logs for embedding generation job

**Expected Results**:
- ✅ Job appears in BullMQ queue
- ✅ OpenAI API called with profile text
- ✅ 1536-dimension vector generated
- ✅ Embedding stored in database
- ✅ Job marked complete

**Acceptance Criteria**:
- [ ] Embedding job queued after profile creation
- [ ] OpenAI API called successfully
- [ ] Vector stored in embeddings table
- [ ] User ready for matching

**Verify in Database**:
```sql
SELECT * FROM embeddings WHERE user_id = 'USER_ID';
-- Should return 1 row with vector column populated
```

---

### 🤝 AC-3: Matching Flow

#### AC-3.1: View Matches

**Steps**:
1. Log in as user with completed profile
2. Navigate to dashboard
3. Observe matches displayed

**Expected Results**:
- ✅ Loading spinner while fetching
- ✅ 3-5 match cards displayed
- ✅ Each match shows:
  - Name
  - Similarity score (percentage)
  - Shared interest badge
  - Context explanation
  - Accept and Pass buttons

**Acceptance Criteria**:
- [ ] Matches fetched from backend API
- [ ] Real data (not mock)
- [ ] Scores accurate (0-100%)
- [ ] Reasons make sense
- [ ] Beautiful card animations

**Empty State Test**:
- [ ] If no matches, show "No matches yet" message
- [ ] Encourage user to check back later

---

#### AC-3.2: Accept Match (Single-Sided)

**Steps**:
1. Click "I'm interested" on a match card
2. Confirm action

**Expected Results**:
- ✅ Loading state on button
- ✅ API call to `POST /api/matches/:id/accept`
- ✅ Success message: "Your interest has been noted..."
- ✅ Match marked as accepted in database
- ✅ Card removed from list
- ✅ NO email sent (privacy - other user doesn't know)

**Acceptance Criteria**:
- [ ] Accept action recorded
- [ ] Match status updated to 'accepted_by_user'
- [ ] No notification to other user (privacy)
- [ ] Card smoothly animates out
- [ ] No errors in console

---

#### AC-3.3: Mutual Match (Both Accept)

**Setup**:
1. User A accepts match with User B
2. Log in as User B
3. User B accepts same match

**Expected Results**:
- ✅ Introduction created in database
- ✅ **Both users receive mutual introduction email**
- ✅ Email reveals contact information (names, emails)
- ✅ Email includes shared interests
- ✅ Email includes conversation starters
- ✅ Success modal: "It's a match!"

**Acceptance Criteria**:
- [ ] Intro record created (status: 'mutual')
- [ ] Both users receive email simultaneously
- [ ] Contact info revealed in email
- [ ] Email beautifully formatted
- [ ] Users can now email each other directly

**Verify in Database**:
```sql
SELECT * FROM intros WHERE status = 'mutual';
-- Should have intro record linking both users
```

---

#### AC-3.4: Pass on Match

**Steps**:
1. Click "Not for me" on match card
2. Confirm action

**Expected Results**:
- ✅ Match status updated to 'rejected'
- ✅ Card removed from list
- ✅ No notification to other user (privacy)
- ✅ Match hidden for both users
- ✅ Success message: "No worries! We'll find you better matches."

**Acceptance Criteria**:
- [ ] Pass action recorded
- [ ] Match hidden from both users
- [ ] No notification sent
- [ ] Cannot undo pass (privacy)

---

#### AC-3.5: Match Quality

**Steps**:
1. Review all matches shown
2. Check if reasons make sense
3. Verify similarity scores

**Expected Results**:
- ✅ High scores (70%+) for similar interests
- ✅ Reasons mention actual shared topics
- ✅ Diverse matches (different orgs if multiple orgs)
- ✅ No duplicate users
- ✅ No self-matches

**Acceptance Criteria**:
- [ ] Semantic similarity working
- [ ] Reasons are explainable
- [ ] Diversity re-ranking applied
- [ ] Filter strategies working (no duplicates, no same-org)

---

### 📧 AC-4: Email Templates

#### AC-4.1: Magic Link Email

**Review**:
- Professional Grove branding
- Clear call-to-action button
- Expiration notice (15 minutes)
- Fallback link for button failure

**Acceptance Criteria**:
- [ ] Beautiful HTML rendering
- [ ] Warm color palette matches brand
- [ ] Button clickable and functional
- [ ] Renders well on mobile and desktop
- [ ] Plain text fallback included

---

#### AC-4.2: Match Notification Email

**Review**:
- Match name and score
- Shared interest highlighted
- Context explanation
- Two action buttons: "I'm interested" and "Not for me"
- Privacy notice
- 7-day expiration

**Acceptance Criteria**:
- [ ] Both users receive identical email (mirrored)
- [ ] Neither knows the other received it
- [ ] Action buttons link to frontend
- [ ] Expires after 7 days

---

#### AC-4.3: Mutual Introduction Email

**Review**:
- Celebration header
- Both names and emails revealed
- Shared interests recap
- Conversation starters
- Encouragement to connect

**Acceptance Criteria**:
- [ ] Both users receive email
- [ ] Contact info visible
- [ ] Warm, encouraging tone
- [ ] Actionable next steps

---

### 🔒 AC-5: Privacy & Security

#### AC-5.1: Double Opt-In Privacy

**Test**:
1. User A accepts match
2. User B does NOT accept
3. Verify User B cannot see User A's action

**Expected Results**:
- ✅ User B sees match as "pending"
- ✅ User B does not know User A accepted
- ✅ No contact info revealed
- ✅ No notification sent to User B

**Acceptance Criteria**:
- [ ] Privacy preserved until mutual acceptance
- [ ] No "seen" or "interested" indicators
- [ ] Cannot view who passed

---

#### AC-5.2: JWT Token Security

**Test**:
1. Log in and receive JWT
2. Check localStorage for tokens
3. Wait 15+ minutes
4. Make API request

**Expected Results**:
- ✅ Access token expires after 15 minutes
- ✅ Refresh token automatically used
- ✅ New access token issued
- ✅ Request succeeds without re-login

**Acceptance Criteria**:
- [ ] Tokens stored securely (httpOnly would be better, but localStorage OK for MVP)
- [ ] Access token expires at 15 min
- [ ] Refresh token works for 7 days
- [ ] Auto-refresh on 401 errors

---

#### AC-5.3: Protected Routes

**Test**:
1. Log out or clear localStorage
2. Try to access `http://localhost:5173/dashboard`

**Expected Results**:
- ✅ Redirect to welcome page
- ✅ Cannot access protected routes
- ✅ No crash or errors

**Acceptance Criteria**:
- [ ] Protected routes check authentication
- [ ] Redirect to login if not authenticated
- [ ] No data leakage

---

### ⚡ AC-6: Performance & UX

#### AC-6.1: Loading States

**Test**: Observe all async operations

**Expected Results**:
- ✅ Loading spinner during API calls
- ✅ Buttons disabled during submission
- ✅ No flash of loading/content
- ✅ Smooth transitions

**Acceptance Criteria**:
- [ ] Loading states for all API calls
- [ ] User cannot double-submit forms
- [ ] Loading indicators accessible

---

#### AC-6.2: Error Handling

**Test**: Simulate errors (stop backend, invalid data, etc.)

**Expected Results**:
- ✅ Network error: "Unable to connect. Please try again."
- ✅ Retry button appears
- ✅ Validation error: Field-specific messages
- ✅ Server error: "Something went wrong. Please try again."

**Acceptance Criteria**:
- [ ] All errors caught and displayed
- [ ] Retry functionality works
- [ ] Error messages user-friendly
- [ ] No console errors (user-facing)

---

#### AC-6.3: Animations

**Test**: Navigate through all flows

**Expected Results**:
- ✅ All original animations preserved
- ✅ Smooth page transitions
- ✅ Match card animations
- ✅ Progress bar animations
- ✅ No jank or flickering

**Acceptance Criteria**:
- [ ] Framer Motion animations work
- [ ] No performance degradation
- [ ] Beautiful experience maintained

---

### 🧪 AC-7: Edge Cases

#### AC-7.1: No Embeddings Yet

**Test**:
1. Complete onboarding
2. Immediately request matches (before embedding generated)

**Expected Results**:
- ✅ Message: "We're processing your profile. Check back in a moment!"
- ✅ No matches shown yet
- ✅ Graceful handling

**Acceptance Criteria**:
- [ ] Handles users without embeddings
- [ ] Clear message about processing
- [ ] No errors

---

#### AC-7.2: No Matches Available

**Test**:
1. User with embedding but no suitable matches

**Expected Results**:
- ✅ Empty state shown
- ✅ Message: "No matches yet. We're working on it!"
- ✅ Encouragement to check back

**Acceptance Criteria**:
- [ ] Empty state component renders
- [ ] User-friendly message
- [ ] No errors

---

#### AC-7.3: Token Expiration During Session

**Test**:
1. Log in
2. Wait 15+ minutes without activity
3. Try to perform action

**Expected Results**:
- ✅ Auto-refresh triggered
- ✅ New access token issued
- ✅ Action proceeds without interruption
- ✅ User unaware of refresh

**Acceptance Criteria**:
- [ ] Token refresh seamless
- [ ] No re-login required
- [ ] No user disruption

---

### 📊 AC-8: Backend Health

#### AC-8.1: Database Integrity

**Verify**:
```sql
-- All tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
-- Should show: orgs, users, profiles, embeddings, matches, intros, feedback, safety_flags, events, auth_tokens

-- Users have profiles
SELECT COUNT(*) FROM users u
JOIN profiles p ON u.id = p.user_id;

-- Embeddings have vectors
SELECT COUNT(*) FROM embeddings
WHERE embedding IS NOT NULL;

-- Matches have correct statuses
SELECT status, COUNT(*) FROM matches
GROUP BY status;
```

**Acceptance Criteria**:
- [ ] All 10 tables exist
- [ ] Foreign keys enforced
- [ ] pgvector extension enabled
- [ ] Data integrity maintained

---

#### AC-8.2: Background Jobs

**Verify**:
1. Check BullMQ dashboard (if configured) or logs
2. Confirm embedding jobs processing
3. Check for failed jobs

**Expected**:
- ✅ Jobs appear in queue
- ✅ Jobs processed within 1 minute
- ✅ Success rate >95%
- ✅ Failed jobs retry (up to 3 times)

**Acceptance Criteria**:
- [ ] Embedding jobs run automatically
- [ ] Redis connection stable
- [ ] Job completion rate high

---

#### AC-8.3: API Response Times

**Benchmark**:
- GET /health: <50ms
- POST /api/auth/magic-link: <200ms
- POST /api/auth/verify: <500ms
- POST /api/onboarding: <300ms
- GET /api/matches: <1000ms (includes vector search)

**Acceptance Criteria**:
- [ ] Response times acceptable
- [ ] No timeouts
- [ ] Scales to 10+ concurrent users

---

## Success Metrics

### Functional Completeness

- [ ] 17/17 API endpoints working
- [ ] Authentication flow complete
- [ ] Onboarding flow complete
- [ ] Matching flow complete
- [ ] Email delivery working
- [ ] Database operations successful

### Quality Metrics

- [ ] Zero console errors
- [ ] Zero broken UI elements
- [ ] All animations smooth
- [ ] All loading states working
- [ ] All error states handled
- [ ] 98/98 tests passing (backend)

### User Experience

- [ ] Intuitive flow (no confusion)
- [ ] Beautiful design maintained
- [ ] Fast response times
- [ ] Clear error messages
- [ ] Privacy preserved

---

## Known Limitations (MVP)

1. **No feedback collection yet** (Phase 8 - optional)
2. **No safety reporting yet** (Phase 9 - optional)
3. **No admin dashboard yet** (Phase 10 - optional)
4. **No profile editing** (post-MVP)
5. **No settings page** (post-MVP)

These are planned enhancements beyond MVP scope.

---

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker ps`
- Check Redis is running: `docker ps`
- Check .env file has all required variables

### Frontend can't connect to backend
- Verify backend running on port 4000
- Check CORS enabled in backend
- Check frontend .env has correct API_URL

### Emails not sending
- Verify POSTMARK_API_KEY is set
- Check Postmark logs for delivery status
- Use test key for development (emails logged to console)

### Embeddings not generating
- Check Redis is running (BullMQ dependency)
- Check OpenAI API key valid
- Check backend logs for job errors

### Matches not appearing
- Verify user has embedding (SELECT * FROM embeddings WHERE user_id = ...)
- Check other users exist with embeddings
- Verify matching algorithm (check backend logs)

---

## Reporting Issues

If you find bugs during testing:

1. **Document**:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots/console logs

2. **Check**:
   - Backend logs for errors
   - Browser console for errors
   - Network tab for failed requests

3. **Report**:
   - Create issue with details
   - Include environment (OS, browser, versions)

---

## Sign-Off Checklist

### Pre-Production

- [ ] All acceptance criteria pass
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation complete

### Production Readiness

- [ ] AWS infrastructure provisioned
- [ ] Environment variables configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: Ready for Testing

Good luck with testing! 🚀
