---
doc_type: research
date: 2025-10-25T20:44:30+00:00
title: "Login Screen and Authentication Flow in Grove Frontend"
research_question: "How does the login screen and authentication flow work in the Grove frontend? What screens exist for user login, how does the app differentiate between first-time and returning users, and what is the complete magic link flow?"
researcher: Sean Kim

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-25
last_updated_by: Sean Kim

tags:
  - authentication
  - frontend
  - login
  - magic-link
  - onboarding
  - ux
  - routing
status: complete

related_docs:
  - thoughts/research/2025-10-24-authentication-authorization-and-security-implementation.md
---

# Research: Login Screen and Authentication Flow in Grove Frontend

**Date**: October 25, 2025, 20:44 UTC
**Researcher**: Sean Kim
**Git Commit**: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
**Branch**: main
**Repository**: workspace

## Research Question

How does the login screen and authentication flow work in the Grove frontend? What screens exist for user login, how does the app differentiate between first-time and returning users, and what is the complete magic link flow?

## Summary

The Grove frontend implements a **passwordless magic link authentication flow** with intelligent routing based on user onboarding status. There is **no separate login vs. signup screen** - the same Welcome page handles both first-time and returning users. The system uses React Router for routing and httpOnly cookies for session management.

The key insight: **the backend determines user status** (new vs. returning, onboarded vs. not) during magic link verification and returns a `hasCompletedOnboarding` flag. The frontend's `AuthCallback` component uses this flag to route users appropriately.

### Key Components

1. **Welcome Page** (`/`) - Combined login/signup screen with email + name input
2. **Auth Callback** (`/auth/verify`) - Magic link verification and routing logic
3. **Onboarding** (`/onboarding`) - Profile setup for new users
4. **Dashboard** (`/dashboard`) - Main app interface for authenticated users

### User Experience

**First-time users**: Welcome → Email sent → Click magic link → AuthCallback → **Onboarding** → Dashboard

**Returning users**: Welcome → Email sent → Click magic link → AuthCallback → **Dashboard** (skips onboarding)

---

## Detailed Findings

### 1. Current Login Experience: The Welcome Page

The Grove frontend has a **single unified entry point** for all users at the root route (`/`).

#### Component: Welcome (`src/components/Welcome.tsx`)

**Location**: `/workspace/src/components/Welcome.tsx`

**What it looks like** (lines 64-174):
- Premium glass-card design with gradient background
- Sprout logo and "commonplace" branding
- Two input fields: **name** and **work email**
- Single "Join commonplace" button
- No distinction between "login" and "sign up"

**Key UX Elements**:
```typescript
<Input
  id="name"
  type="text"
  placeholder="Alex Chen"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>

<Input
  id="email"
  type="email"
  placeholder="alex@yourcompany.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

**Important**: Both fields are **always required**, even for returning users. This creates a UX issue where returning users must re-enter their name.

#### Magic Link Request Flow (lines 25-62)

When user submits the form:

1. **Validation**: Checks both email and name are provided (line 27)
2. **API Call**: Sends only email to backend via `requestMagicLink(email)` (line 34)
   - Note: Name is NOT sent to backend at this stage
3. **Success State**: Shows "Check your email" message (lines 154-166)
4. **Error Handling**: Displays specific error messages for:
   - 403: "Your email domain is not authorized" (line 51)
   - 429: "Too many requests" (line 53)
   - Other: Generic error message (line 57)

**Backend API**: `POST /api/auth/magic-link` with payload `{ email: string }`

**Critical UX Issue**: The name field is collected but **not used** during magic link request. It's only preserved in local state for the old dev mode flow (line 42).

---

### 2. First-time vs. Returning Users: Backend Determines Status

**Key Finding**: The frontend does NOT differentiate between first-time and returning users on the Welcome screen. The backend makes this determination during magic link verification.

#### Backend User Lookup (`grove-backend/src/auth/auth.service.ts` lines 137-163)

When a user verifies their magic link token:

```typescript
// Get or create user
let user = await this.prisma.user.findUnique({
  where: { email: authToken.email },
  include: { profile: true },
});

if (!user) {
  // Create new user (first-time user)
  user = await this.prisma.user.create({
    data: {
      email: authToken.email,
      name: '',  // Name is EMPTY for new users!
      orgId: org.id,
      status: 'active',
    },
    include: { profile: true },
  });
}
```

**Critical Discovery**: When a new user is created, `name: ''` is set to an **empty string**. This means:
- First-time users have no name in the database initially
- They must provide their name during onboarding
- The name field on the Welcome page is essentially discarded for magic link flow

#### Onboarding Status Detection (lines 210-218)

The backend returns user data with an onboarding flag:

```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name || '',
    hasCompletedOnboarding: !!user.profile,  // TRUE if profile exists
  },
};
```

**Decision Logic**:
- `hasCompletedOnboarding: true` → User has a profile → **Returning user**
- `hasCompletedOnboarding: false` → User has no profile → **First-time user**

---

### 3. Magic Link Flow: Complete Trace

#### Step 1: User Enters Email on Welcome Page

**Component**: `Welcome.tsx` (lines 101-152)

**User Action**: User fills in name and email, clicks "Join commonplace"

**Frontend Behavior**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !name) return;

  setLoading(true);
  setError(null);

  // Request magic link from backend
  await requestMagicLink(email);

  // Show success state
  setSent(true);
};
```

**API Call**: `POST /api/auth/magic-link` via `src/lib/apiService.ts` (lines 33-38)

**Backend Processing** (`grove-backend/src/auth/auth.service.ts`):
1. Validates email domain against `orgs` table (lines 33-47)
2. Generates 64-byte secure random token (line 50)
3. Stores token in `auth_tokens` table with 15-minute expiration (lines 57-64)
4. Sends email with magic link: `{FRONTEND_URL}/auth/verify?token={token}` (lines 67-71)
5. Returns success message to frontend

**Success Screen** (`Welcome.tsx` lines 154-166):
```tsx
<GlassCard variant="premium" withGlow={false} className="p-12 text-center">
  <IconBadge icon={Mail} size="lg" className="inline-flex mb-6" />
  <p className="mb-3 text-lg">Check your email</p>
  <p className="text-sm text-muted-foreground/80 leading-relaxed">
    We sent a magic link to <span className="text-foreground">{email}</span>
  </p>
</GlassCard>
```

---

#### Step 2: User Clicks Magic Link

**Email Link Format**: `https://your-frontend.com/auth/verify?token=<128-char-hex-string>`

**Route Triggered**: `/auth/verify` in React Router

**Component Loaded**: `AuthCallback.tsx`

---

#### Step 3: Auth Callback Verifies Token

**Component**: `AuthCallback.tsx` (`/workspace/src/components/AuthCallback.tsx`)

**Purpose**: Verifies magic link token and routes user based on onboarding status

**Execution Flow** (lines 28-67):

```typescript
useEffect(() => {
  const token = searchParams.get('token');

  if (!token) {
    setState('error');
    setError({
      statusCode: 400,
      message: 'Invalid or missing verification token',
      error: 'Bad Request',
    });
    return;
  }

  verifyMagicLink(token);
}, [searchParams]);

const verifyMagicLink = async (token: string) => {
  try {
    setState('verifying');

    const response = await verifyToken(token);
    const { user } = response;

    setUserName(user.name);
    setState('success');

    // Wait a moment to show success message, then redirect
    setTimeout(() => {
      if (user.hasCompletedOnboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }, 1500);
  } catch (err) {
    console.error('Token verification failed:', err);
    setState('error');
    setError(err as ApiError);
  }
};
```

**Backend API Call**: `POST /api/auth/verify` via `verifyToken(token)` (lines 43-51 in `apiService.ts`)

**Backend Processing** (`grove-backend/src/auth/auth.service.ts` lines 79-219):
1. Looks up token in database (lines 98-106)
2. Validates token is not used and not expired
3. Marks token as used (one-time use) (lines 131-134)
4. Finds or creates user account (lines 137-163)
5. Generates JWT access token (15min) and refresh token (7d) (lines 183-189)
6. Sets httpOnly cookies with tokens (lines 194-206)
7. Returns user data with `hasCompletedOnboarding` flag (lines 210-218)

**UI States**:
- **Verifying** (lines 84-88): Shows loading spinner with "Verifying your magic link..."
- **Success** (lines 90-100): Shows checkmark with "Welcome back, {name}!" and "Redirecting you now..."
- **Error** (lines 102-127): Shows error message with retry button

---

#### Step 4: Routing Decision

**Decision Point**: Line 56-60 in `AuthCallback.tsx`

```typescript
setTimeout(() => {
  if (user.hasCompletedOnboarding) {
    navigate('/dashboard');
  } else {
    navigate('/onboarding');
  }
}, 1500);
```

**Path A - First-time User** (`hasCompletedOnboarding: false`):
- User is redirected to `/onboarding`
- Onboarding component loads
- User completes 5-step onboarding questionnaire
- After completion, navigates to `/matching` then `/dashboard`

**Path B - Returning User** (`hasCompletedOnboarding: true`):
- User is redirected to `/dashboard`
- Dashboard component loads
- User sees their matches immediately

---

### 4. Welcome/Landing Page Details

**Route**: `/` (root)

**Component**: `Welcome.tsx`

**Design Elements**:
- Full-screen centered layout with gradient background
- Sprout logo in circular badge with gradient (lines 72-80)
- "commonplace" h1 heading (line 81)
- Tagline: "Spark meaningful connections with people in your organization who share your interests and curiosities" (lines 82-84)

**Form Structure** (lines 101-152):
- Glass card with backdrop blur effect
- Two input fields (name and email)
- Privacy notice: "Your answers are private — only used to find better matches" (lines 136-138)
- Premium gradient button with shimmer effect (lines 141-151)

**Visual Design**:
- Rounded corners (rounded-2xl)
- Glassmorphism aesthetic
- Animated gradients
- Motion/Framer Motion animations for smooth transitions
- Color scheme: accent/secondary gradients on muted background

**Accessibility**:
- Proper form labels with `htmlFor` attributes
- Required field validation
- Error message announcements
- Focus states with ring effects

---

### 5. Auth Callback Route: `/auth/verify`

**Component**: `AuthCallback.tsx` (`/workspace/src/components/AuthCallback.tsx`)

**Route Configuration** (`src/main.tsx` line 47):
```typescript
<Route path="/auth/verify" element={<AuthCallback />} />
```

**Note**: This route is **public** (not wrapped in `ProtectedRoute`)

**What Happens Here**:

1. **Token Extraction** (line 29):
   ```typescript
   const token = searchParams.get('token');
   ```

2. **Validation** (lines 31-39):
   - If no token, shows error immediately
   - If token exists, calls `verifyMagicLink()`

3. **Backend Verification** (line 48):
   ```typescript
   const response = await verifyToken(token);
   ```
   - Backend API: `POST /api/auth/verify` with `{ token: string }`
   - Backend validates token, finds/creates user, sets cookies
   - Returns: `{ user: { id, email, name, hasCompletedOnboarding } }`

4. **Session Established**:
   - httpOnly cookies are set automatically by browser
   - `accessToken` cookie (15min expiration)
   - `refreshToken` cookie (7d expiration)
   - Frontend never sees these tokens (XSS protection)

5. **User Data Processing** (lines 51-52):
   ```typescript
   const { user } = response;
   setUserName(user.name);
   ```

6. **Success Animation** (lines 55-61):
   - Shows success message for 1.5 seconds
   - Then navigates based on `user.hasCompletedOnboarding`

7. **Error Handling** (lines 62-67):
   - Catches API errors
   - Shows error message with retry button
   - Link to request new magic link

**Error Recovery** (lines 111-126):
```tsx
{state === 'error' && (
  <motion.div>
    <p className="text-sm text-muted-foreground/70 mb-4">
      Your magic link may have expired or is invalid.
    </p>
    <button onClick={() => navigate('/')}>
      Request a new magic link
    </button>
  </motion.div>
)}
```

---

### 6. Onboarding Flow Integration

**Component**: `Onboarding.tsx` (`/workspace/src/components/Onboarding.tsx`)

**Route**: `/onboarding` (wrapped in `ProtectedRoute`)

**Route Configuration** (`src/main.tsx` lines 48-55):
```typescript
<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  }
/>
```

**When Shown**: Only for users where `hasCompletedOnboarding: false`

#### Onboarding Steps (lines 22-60)

The onboarding consists of 5 questions:

1. **Niche Interest** (textarea): "What's a niche interest you could talk about for an hour?"
2. **Project** (textarea): "What's a project or topic you're excited to explore this year?"
3. **Connection Type** (radio): "What kind of connection are you open to right now?"
   - Make friends
   - Share a hobby
   - Swap ideas
   - Professional peer
4. **Rabbit Hole** (textarea, optional): "Optional fun: a recent rabbit hole or obsession."
5. **Preferences** (textarea, optional): "Anything that would make a first chat easier?"

#### Name Handling Discovery

**Critical Finding**: The onboarding component receives a `userName` prop (line 18):

```typescript
interface OnboardingProps {
  userName?: string;
  onComplete?: (responses: Record<string, string>) => void;
}
```

**Display** (line 145):
```tsx
<p className="text-sm sm:text-base text-muted-foreground/90">
  Welcome, {userName}
</p>
```

**Problem**: This `userName` is passed from the parent route, but for new users created via magic link, `user.name` is an **empty string** in the database. The onboarding screen would show "Welcome, " with no name.

**Where Name Should Come From**:
- For new users, there's no mechanism to capture the name they entered on the Welcome page
- The Welcome page's name input is not sent to the backend
- The backend creates users with `name: ''`

**Gap Identified**: The name entered on the Welcome page is lost for magic link users.

#### Onboarding Submission (lines 83-122)

After completing all questions:

```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);

    const onboardingData: OnboardingResponses = {
      niche_interest: responses.niche_interest || '',
      project: responses.project || '',
      connection_type: responses.connection_type as any,
      rabbit_hole: responses.rabbit_hole || undefined,
      preferences: responses.preferences || undefined,
    };

    const result = await submitOnboarding(onboardingData);

    // Navigate to matching animation then dashboard
    navigate('/matching');
  } catch (err) {
    // Error handling
  }
};
```

**Backend API**: `POST /api/onboarding` with onboarding responses

**Backend Processing**:
1. Creates `Profile` record for user
2. Queues embedding generation for matching
3. Marks user as having completed onboarding (`hasCompletedOnboarding: true`)

**Navigation**: After successful submission, navigates to `/matching` (line 106)

---

### 7. User Experience Issues

After thorough analysis, here are the UX issues identified in the current flow:

#### Issue 1: Name Field on Welcome Page is Unused

**Problem**:
- Welcome page collects both name and email
- Only email is sent to backend for magic link
- Name input is discarded
- New users are created with `name: ''` (empty string)

**Impact**:
- Returning users must re-enter their name every time
- First-time users lose the name they entered
- Creates confusion about whether the app remembers users

**Code Evidence**:
- `Welcome.tsx` line 34: `await requestMagicLink(email)` - only sends email
- `auth.service.ts` line 157: `name: ''` - new users have empty name
- `Welcome.tsx` line 27: `if (!email || !name) return` - unnecessarily requires name

**Expected Behavior**:
- Returning users shouldn't need to enter name
- OR: Name should be sent with onboarding data, not at login

---

#### Issue 2: No Distinction Between Login and Signup

**Problem**:
- Same form for first-time and returning users
- No way to tell which action user is taking
- Name field required even for returning users

**Impact**:
- Confusion: "Am I logging in or signing up?"
- Extra friction for returning users
- Poor UX compared to standard login/signup flows

**Alternative Approaches**:
- Option A: Remove name field from Welcome page entirely, collect during onboarding
- Option B: Add "Returning user?" link to skip name field
- Option C: Email-only on Welcome page, collect name during onboarding for new users

---

#### Issue 3: Missing Name on Onboarding Welcome Message

**Problem**:
- Onboarding shows "Welcome, {userName}" (line 145)
- For new magic link users, `userName` is empty
- Results in "Welcome, " with no name

**Impact**:
- Impersonal experience for new users
- Looks like a bug

**Solution Needed**:
- Either capture name before onboarding
- Or change greeting to "Welcome!" without name
- Or update backend to accept name during onboarding submission

---

#### Issue 4: Returning Users See Name Field but It's Not Used

**Problem**:
- Returning users enter name on Welcome page
- Backend already has their name from previous session
- Entered name is ignored
- Creates false impression of updating profile

**Impact**:
- Wasted user effort
- Confusion about data persistence

**Evidence**:
- `auth.service.ts` lines 137-163: User lookup doesn't update name
- No API to update name during login

---

#### Issue 5: No Loading State Feedback During Email Send

**Problem**:
- Button shows "Sending magic link..." (line 148)
- But no indication of what happens if it fails silently
- Error banner shown but could be missed

**Impact**:
- User uncertainty about whether email was sent
- May repeatedly click button

**Current State**: Actually handles this reasonably well with:
- Loading state on button (line 148)
- Error banner with dismiss option (lines 93-99)
- Success state with clear "Check your email" message (lines 154-166)

**Not a critical issue**, but could add email confirmation animation.

---

#### Issue 6: Auth Callback Shows User Name That May Be Empty

**Problem**:
- Success message shows "Welcome back, {userName}!" (line 94)
- For new users, `userName` is empty string
- Shows "Welcome back, !" for first-time users

**Impact**:
- Impersonal experience
- Grammatically incorrect
- "Welcome back" implies returning user, confusing for new users

**Code**:
```typescript
<p className="mb-3 text-lg">Welcome back{userName ? `, ${userName}` : ''}!</p>
```

**Current Handling**: Uses conditional to hide name if empty, but message still says "Welcome back!" for new users.

**Better Message**:
- New users: "Welcome to commonplace!"
- Returning users: "Welcome back, {name}!"

---

### 8. Authentication Routing Architecture

**Routing Library**: React Router v6 (`react-router-dom`)

**Route Configuration**: `src/main.tsx` (lines 43-95)

#### Route Structure

**Public Routes** (no authentication required):
```typescript
<Route path="/" element={<Welcome />} />
<Route path="/auth/verify" element={<AuthCallback />} />
```

**Protected Routes** (authentication required):
```typescript
<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  }
/>

<Route
  path="/matching"
  element={
    <ProtectedRoute>
      <MatchingAnimation onComplete={() => window.location.href = '/dashboard'} />
    </ProtectedRoute>
  }
/>

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Admin Routes** (role-based):
```typescript
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  <Route index element={<AdminDashboardPage />} />
  <Route path="users" element={<UsersPage />} />
  <Route path="audit-logs" element={<AuditLogsPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

#### ProtectedRoute Component

**Location**: `src/components/ProtectedRoute.tsx`

**Implementation** (lines 10-21):
```typescript
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // With httpOnly cookies, authentication is handled automatically
  // If the user is not authenticated, API calls will return 401
  // and the axios interceptor will redirect to /

  // We just render the children - the API layer handles auth checks
  return <>{children}</>;
}
```

**Key Design**:
- No client-side auth check
- Relies on API 401 responses
- Axios interceptor handles redirects

#### Axios Interceptor: Authentication Enforcement

**Location**: `src/lib/api.ts` (lines 74-82)

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - Session expired, redirect to login
    if (error.response?.status === 401) {
      // Clear any client-side state if needed
      window.location.href = '/';
      return Promise.reject(error);
    }
    // ... other error handling
  }
);
```

**How It Works**:
1. User navigates to protected route (e.g., `/dashboard`)
2. Component renders and makes API call (e.g., `getMatches()`)
3. API request includes httpOnly cookies automatically
4. If not authenticated (no valid cookie), backend returns 401
5. Axios interceptor catches 401, redirects to `/` (Welcome page)

**Session Management**:
- JWT access token (15min) and refresh token (7d) in httpOnly cookies
- Cookies sent automatically with every API request
- No localStorage or client-side token management
- XSS protection: JavaScript cannot access tokens

---

### 9. Complete User Journey Diagrams

#### First-Time User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User visits site                                             │
│    URL: /                                                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Welcome Component Renders                                    │
│    - Shows name + email input fields                           │
│    - User enters "Jane Doe" and "jane@acme.com"               │
│    - Clicks "Join commonplace"                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/auth/magic-link                         │
│    Payload: { email: "jane@acme.com" }                         │
│    Note: NAME IS NOT SENT TO BACKEND                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Backend: auth.service.ts requestMagicLink()                 │
│    - Validates domain exists in orgs table                     │
│    - Generates 64-byte random token                            │
│    - Stores token in auth_tokens table (15min expiry)          │
│    - Sends email with link:                                    │
│      https://app.com/auth/verify?token=abc123...               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Welcome Component Shows Success                              │
│    "Check your email"                                           │
│    "We sent a magic link to jane@acme.com"                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ (User checks email)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. User Clicks Magic Link                                       │
│    Browser navigates to: /auth/verify?token=abc123...          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. AuthCallback Component Loads                                 │
│    - Extracts token from URL                                    │
│    - Shows "Verifying your magic link..." spinner              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Frontend: POST /api/auth/verify                             │
│    Payload: { token: "abc123..." }                             │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Backend: auth.service.ts verifyMagicLink()                  │
│    - Validates token (not used, not expired)                   │
│    - Marks token as used                                        │
│    - Searches for user by email: NOT FOUND                     │
│    - Creates new user:                                          │
│      { email: "jane@acme.com", name: "", orgId: "...",        │
│        status: "active" }                                       │
│    - Generates JWT tokens (access: 15min, refresh: 7d)         │
│    - Sets httpOnly cookies                                      │
│    - Returns: { user: { id, email, name: "",                  │
│                          hasCompletedOnboarding: false } }     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. AuthCallback Processes Response                             │
│     - Shows "Welcome back!" (should say "Welcome!")            │
│     - Waits 1.5 seconds                                        │
│     - Checks: hasCompletedOnboarding === false                 │
│     - Navigates to: /onboarding                                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. Onboarding Component Loads                                  │
│     - Shows "Welcome, " (name is empty - UX ISSUE)            │
│     - 5-step questionnaire                                     │
│     - User fills out profile                                   │
│     - Submits: POST /api/onboarding                            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. Backend Creates Profile                                     │
│     - profile.create({ userId, nicheInterest, project, ... })  │
│     - Now: hasCompletedOnboarding = true                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 13. Navigate to /matching → /dashboard                          │
│     User sees their matches                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Returning User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User visits site                                             │
│    URL: /                                                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Welcome Component Renders                                    │
│    - Shows name + email input fields                           │
│    - User enters "Jane Doe" and "jane@acme.com"               │
│      (same info as before - UX ISSUE: name not needed)        │
│    - Clicks "Join commonplace"                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/auth/magic-link                         │
│    Payload: { email: "jane@acme.com" }                         │
│    Note: NAME IS IGNORED                                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Backend: Sends magic link email                             │
│    Same as first-time flow                                     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User Clicks Magic Link                                       │
│    Browser navigates to: /auth/verify?token=xyz789...          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Frontend: POST /api/auth/verify                             │
│    Payload: { token: "xyz789..." }                             │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Backend: auth.service.ts verifyMagicLink()                  │
│    - Validates token                                            │
│    - Searches for user by email: FOUND                         │
│    - Loads existing user with profile                          │
│    - Generates JWT tokens                                       │
│    - Sets httpOnly cookies                                      │
│    - Returns: { user: { id, email, name: "Jane Doe",          │
│                          hasCompletedOnboarding: true } }      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. AuthCallback Processes Response                              │
│    - Shows "Welcome back, Jane Doe!"                           │
│    - Waits 1.5 seconds                                         │
│    - Checks: hasCompletedOnboarding === true                   │
│    - Navigates to: /dashboard                                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Dashboard Component Loads                                    │
│    - Makes API call: GET /api/matches                          │
│    - httpOnly cookies sent automatically                        │
│    - Backend validates JWT token                               │
│    - Returns user's matches                                    │
│    - User sees dashboard immediately                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 10. Session Management & Security

#### httpOnly Cookie Architecture

**Location**: API configuration in `src/lib/api.ts`

**Cookie Configuration** (lines 15-22):
```typescript
const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  withCredentials: true,  // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Backend Cookie Setting** (`grove-backend/src/auth/auth.service.ts` lines 194-206):
```typescript
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,  // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
});
```

**Security Benefits**:
- **httpOnly**: JavaScript cannot access tokens (XSS protection)
- **secure**: HTTPS-only in production (MITM protection)
- **sameSite: strict**: CSRF protection
- **Short expiration**: 15-minute access tokens limit exposure window

#### CSRF Protection

**CSRF Token Flow**:

1. **Token Initialization** (`src/lib/api.ts` lines 32-41):
   ```typescript
   export async function initCsrf(): Promise<void> {
     try {
       const response = await axios.get(`${config.apiBaseUrl}/auth/csrf-token`, {
         withCredentials: true,
       });
       csrfToken = response.data.csrfToken;
     } catch (error) {
       console.error('Failed to initialize CSRF token:', error);
     }
   }
   ```

2. **App Initialization** (`src/main.tsx` lines 40-42):
   ```typescript
   initCsrf().then(() => {
     createRoot(document.getElementById("root")!).render(
       <BrowserRouter>
         {/* routes */}
       </BrowserRouter>
     );
   });
   ```

3. **Request Interceptor** (lines 54-68 in `api.ts`):
   ```typescript
   api.interceptors.request.use(
     (config: InternalAxiosRequestConfig) => {
       // Add CSRF token to non-GET requests
       if (csrfToken && config.method && config.method.toLowerCase() !== 'get') {
         if (config.headers) {
           config.headers['X-CSRF-Token'] = csrfToken;
         }
       }
       return config;
     }
   );
   ```

**Backend Validation** (`grove-backend/src/common/guards/csrf.guard.ts`):
- Validates CSRF token on all non-GET requests
- Compares header token with cookie token
- Throws 403 if mismatch

---

## Code References

### Frontend Components
- `/workspace/src/components/Welcome.tsx` - Landing/login page (email + name input)
- `/workspace/src/components/AuthCallback.tsx` - Magic link verification and routing
- `/workspace/src/components/Onboarding.tsx` - Profile setup for new users
- `/workspace/src/components/Dashboard.tsx` - Main app interface
- `/workspace/src/components/ProtectedRoute.tsx` - Route wrapper for authentication
- `/workspace/src/main.tsx` - Route configuration and app initialization

### Frontend Services
- `/workspace/src/lib/apiService.ts` - API service functions
  - `requestMagicLink(email)` - line 33
  - `verifyToken(token)` - line 43
  - `submitOnboarding(responses)` - line 78
- `/workspace/src/lib/api.ts` - Axios instance and interceptors
  - CSRF initialization - line 32
  - 401 redirect interceptor - line 74

### Frontend Types
- `/workspace/src/types/api.ts` - TypeScript interfaces
  - `User` interface with `hasCompletedOnboarding` - line 11
  - `AuthResponse` - line 22
  - `MagicLinkRequest` / `MagicLinkResponse` - lines 27-34
  - `VerifyTokenRequest` - line 36
  - `OnboardingResponses` - line 54

### Backend Services
- `/workspace/grove-backend/src/auth/auth.service.ts` - Authentication logic
  - `requestMagicLink(email)` - line 27
  - `verifyMagicLink(token, res, req)` - line 79
  - User creation with empty name - line 157
  - `hasCompletedOnboarding` determination - line 216

### Backend Controllers
- `/workspace/grove-backend/src/auth/auth.controller.ts` - Auth endpoints
  - `POST /auth/magic-link` - line 29
  - `POST /auth/verify` - line 37
  - `GET /auth/csrf-token` - line 48

---

## Architecture Patterns

### 1. Passwordless Authentication
- No passwords stored in database
- Magic link tokens are single-use and expire in 15 minutes
- Secure random tokens (64 bytes = 128 hex chars)

### 2. Smart Routing Based on Backend State
- Frontend doesn't maintain user state
- Backend determines user status during verification
- `hasCompletedOnboarding` flag drives routing decisions
- Single source of truth: database profile existence

### 3. httpOnly Cookie Session Management
- Tokens never exposed to JavaScript
- Automatic inclusion in API requests
- XSS protection by design
- API layer handles authentication, not components

### 4. Protected Routes via API 401 Responses
- No client-side auth checks in ProtectedRoute
- Components render optimistically
- API returns 401 if not authenticated
- Axios interceptor redirects to login

### 5. Unified Entry Point
- No separate login/signup pages
- Same form handles both flows
- Backend differentiates based on user existence
- Reduces frontend complexity but creates UX confusion

---

## UX Issues Summary

### Critical Issues

1. **Name Field Collected But Not Used**
   - Returning users re-enter name unnecessarily
   - First-time users lose their entered name
   - Backend creates users with empty name

2. **Confusing Login vs. Signup**
   - No visual distinction between first-time and returning users
   - Same form for both flows
   - Unclear whether "Join commonplace" means login or signup

3. **Empty Name on Onboarding Welcome**
   - "Welcome, " with no name for new users
   - Impersonal experience

### Moderate Issues

4. **"Welcome back" for First-Time Users**
   - Auth callback says "Welcome back!" even for new users
   - Grammatically incorrect when name is empty

5. **Wasted User Effort**
   - Returning users enter name that's ignored
   - Creates false impression of updating profile

### Minor Issues

6. **Name Prop Not Passed to Onboarding**
   - Onboarding expects `userName` prop
   - No mechanism to pass it from Welcome page
   - Results in empty greeting

---

## Historical Context (from thoughts/)

This research builds upon the existing authentication documentation:

- `thoughts/research/2025-10-24-authentication-authorization-and-security-implementation.md` - Comprehensive backend auth documentation
  - Magic link implementation details
  - JWT token management
  - Security architecture
  - httpOnly cookie strategy

The backend authentication is well-designed and secure. The UX issues exist primarily in the frontend's handling of user data during the magic link flow.

---

## Related Research

- `thoughts/research/2025-10-24-authentication-authorization-and-security-implementation.md` - Backend authentication architecture
- `thoughts/reviews/2025-10-22-GROVE-AUTH-phase-2-review-authentication.md` - Phase 2 authentication review
- `thoughts/reviews/2025-10-24-TECH-DEBT-phase-2-review-conditional-auth-strategies.md` - Conditional auth strategies

---

## Open Questions

1. **Name Collection Strategy**: Should name be:
   - Collected during onboarding instead of Welcome page?
   - Sent with magic link request?
   - Made optional for returning users?

2. **Login vs. Signup UI**: Should there be:
   - Separate login and signup flows?
   - Email-only Welcome page?
   - "Returning user?" toggle?

3. **Onboarding Greeting**: How to handle empty name?
   - Remove name from greeting?
   - Collect name as first onboarding step?
   - Pass name from Welcome page through URL params?

4. **Session Restoration**: Should returning users be auto-logged-in if they have valid cookies?
   - Check for accessToken cookie on Welcome page?
   - Redirect to dashboard if already authenticated?

5. **Name Updates**: Should returning users be able to update their name during login?
   - Add API endpoint to update user.name?
   - Show name field only if user.name is empty?

---

## Conclusion

The Grove frontend implements a **passwordless magic link authentication flow** with intelligent backend-driven routing. The system correctly differentiates between first-time and returning users using the `hasCompletedOnboarding` flag from the backend's user profile check.

However, there are **significant UX issues** related to the name field on the Welcome page:
- It's required for all users but only used in dev mode
- Returning users must re-enter their name unnecessarily
- First-time users have their entered name discarded
- The backend creates new users with an empty name string

The **root cause** is a disconnect between the Welcome page's unified login/signup form and the backend's magic link flow, which doesn't accept name during authentication. The name field should either be removed from the Welcome page and collected during onboarding, or the backend should accept and store name during magic link verification.

The authentication security and session management are **well-implemented** with httpOnly cookies, CSRF protection, and proper token expiration. The routing architecture is sound, using backend state as the single source of truth for user status. The main improvements needed are in the user-facing login form and onboarding greeting to create a more polished, less confusing experience.
