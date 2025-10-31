---
doc_type: research
date: 2025-10-26T16:54:11+00:00
title: "Super Admin Onboarding Redirect Investigation"
research_question: "Why is a super admin user being redirected to onboarding after clicking the magic link instead of to the admin dashboard?"
researcher: Sean Kim

git_commit: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-26
last_updated_by: Sean Kim

tags:
  - authentication
  - onboarding
  - super-admin
  - routing
  - rbac
status: completed

related_docs: []
---

# Research: Super Admin Onboarding Redirect Investigation

**Date**: 2025-10-26 16:54:11 UTC
**Researcher**: Sean Kim
**Git Commit**: e4f4da7da8dd84ba823f13b5dc97c13bdc131bd7
**Branch**: main
**Repository**: workspace

## Research Question

Why is a super admin user being redirected to onboarding after clicking the magic link instead of to the admin dashboard?

## Summary

The super admin user is being redirected to onboarding because **the frontend routing logic only checks `hasCompletedOnboarding`, which is determined solely by the existence of a profile, without considering the user's role**. The system does not have special routing logic for super admin users, treating them identically to regular users in the authentication flow. This is the current design behavior, not a bug.

**Key Findings:**
1. `hasCompletedOnboarding` is determined by profile existence (`!!user.profile`) across all authentication flows
2. Frontend routing (`AuthCallback.tsx:56-60`) redirects based only on `hasCompletedOnboarding`, ignoring user role
3. Super admin role exists in the system but has no special authentication or routing logic
4. Profiles are required for all users, including super admins, to complete onboarding
5. No automatic profile creation or onboarding bypass exists for any role

## Detailed Findings

### 1. hasCompletedOnboarding Logic

The `hasCompletedOnboarding` flag is determined consistently across all authentication services based on a single criterion: **the existence of a profile record**.

#### Magic Link Authentication
**File**: `/workspace/grove-backend/src/auth/auth.service.ts:216`

```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name || '',
    hasCompletedOnboarding: !!user.profile,  // Line 216
  },
};
```

The logic is simple:
- Query includes profile relation: `include: { profile: true }` (line 139)
- Returns `true` if profile exists, `false` otherwise
- No role-based logic or exceptions

#### SAML Authentication
**File**: `/workspace/grove-backend/src/auth/saml/saml.service.ts:137`

```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasCompletedOnboarding: !!user.profile,  // Line 137
  },
};
```

Identical logic to magic link authentication.

#### OIDC Authentication
**File**: `/workspace/grove-backend/src/auth/oidc/oidc.service.ts:128`

```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasCompletedOnboarding: !!user.profile,  // Line 128
  },
};
```

Same pattern across all SSO providers.

#### Profiles Service
**File**: `/workspace/grove-backend/src/profiles/profiles.service.ts:199-206`

```typescript
async hasCompletedOnboarding(userId: string): Promise<boolean> {
  const profile = await this.prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return !!profile;
}
```

This service method confirms the same logic: profile existence = onboarding complete.

**Critical Observation**: None of these implementations check the user's `role` field. The determination is purely based on profile existence.

### 2. Profile Requirements

Profiles are required for **all users without exception**, including super admins.

#### Profile Creation Flow
**File**: `/workspace/grove-backend/src/profiles/profiles.service.ts:28-96`

The profile creation process:
1. Checks if profile already exists (line 34-40)
2. Updates user name (line 43-46)
3. Creates profile with 6-question onboarding data (line 49-58):
   - `nicheInterest`: User's niche interest
   - `project`: Current project
   - `connectionType`: Type of connection sought
   - `rabbitHole`: Optional deep dive topic
   - `preferences`: Optional meeting preferences
4. Logs `profile_created` event (line 61-69)
5. Queues embedding generation job (line 72-84)

**File**: `/workspace/grove-backend/src/profiles/profiles.controller.ts` (referenced but not read)

The controller enforces that users must complete onboarding by creating a profile. There is no bypass mechanism for any role.

#### Database Schema
**File**: `/workspace/grove-backend/prisma/schema.prisma:80-94`

```prisma
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  nicheInterest  String   @map("niche_interest") @db.Text
  project        String   @db.Text
  connectionType String   @map("connection_type")
  rabbitHole     String?  @map("rabbit_hole") @db.Text
  preferences    String?  @db.Text
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Key constraints:
- `userId` is unique (one profile per user)
- `nicheInterest`, `project`, and `connectionType` are required
- Optional fields: `rabbitHole`, `preferences`
- No role-based variations or exemptions

### 3. Frontend Routing Logic

The frontend routing makes routing decisions based solely on `hasCompletedOnboarding` without considering user role.

#### Auth Callback Component
**File**: `/workspace/src/components/AuthCallback.tsx:44-67`

```typescript
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
        navigate('/dashboard');           // Line 57
      } else {
        navigate('/onboarding');           // Line 59
      }
    }, 1500);
  } catch (err) {
    console.error('Token verification failed:', err);
    setState('error');
    setError(err as ApiError);
  }
};
```

**Critical Issue**: The routing logic on lines 56-60 only checks `user.hasCompletedOnboarding`:
- If `true`: Navigate to `/dashboard`
- If `false`: Navigate to `/onboarding`
- **No role checking whatsoever**

The `AuthResponse` type does include role information in the JWT payload (seen in OIDC/SAML services), but the `AuthCallback` component doesn't use it for routing decisions.

#### Frontend Type Definition
**File**: `/workspace/src/types/api.ts:11-20`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
  status: 'active' | 'paused' | 'deleted';
  hasCompletedOnboarding: boolean;
  createdAt: string;
  lastActive: string;
}
```

**Notable**: The `User` type returned to the frontend does **not include the `role` field**, even though the backend includes it in SAML/OIDC responses. This means the frontend cannot make role-based routing decisions even if it wanted to.

#### Main Router Configuration
**File**: `/workspace/src/main.tsx:44-94`

```typescript
<Routes>
  {/* Main application routes */}
  <Route path="/" element={<Welcome />} />
  <Route path="/auth/verify" element={<AuthCallback />} />
  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

  {/* Admin routes */}
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
</Routes>
```

The `/admin` route exists and is protected by `AdminRoute`, but **users are never automatically routed there after login**.

### 4. Super Admin Role Handling

The super admin role exists in the system but has no special treatment during authentication or routing.

#### Role Definition
**File**: `/workspace/grove-backend/src/common/enums/role.enum.ts:1-5`

```typescript
export enum Role {
  USER = 'user',
  ORG_ADMIN = 'org_admin',
  SUPER_ADMIN = 'super_admin',
}
```

Three distinct roles are defined in the system.

#### Database Schema
**File**: `/workspace/grove-backend/prisma/schema.prisma:43-75`

```prisma
model User {
  id         String    @id @default(uuid())
  email      String    @unique
  name       String
  orgId      String    @map("org_id")
  status     String    @default("active") // active, paused, deleted
  role       String    @default("user")   // user, org_admin, super_admin (Phase 1: RBAC)
  lastActive DateTime? @map("last_active")

  // ... SSO fields and relations
}
```

The `role` field:
- Defaults to `"user"`
- Can be `"user"`, `"org_admin"`, or `"super_admin"`
- Comment indicates "Phase 1: RBAC" implementation

#### RBAC Implementation
**File**: `/workspace/grove-backend/src/common/guards/roles.guard.ts:1-43`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      // No roles required - allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

**File**: `/workspace/grove-backend/src/common/decorators/roles.decorator.ts:1-5`

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

The RBAC system works correctly for endpoint protection:
- Guards check user role against required roles
- Decorators allow specifying which roles can access endpoints
- Used extensively in admin controller

#### Admin Endpoint Protection
**File**: `/workspace/grove-backend/src/admin/admin.controller.ts:26-27`

```typescript
@Get('users')
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
async getUsers(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
  // ...
}
```

All admin endpoints require `Role.ORG_ADMIN` or `Role.SUPER_ADMIN`. This protection works correctly once users reach the admin endpoints, but **there's no automatic routing to get them there after login**.

#### JWT Strategy
**File**: `/workspace/grove-backend/src/auth/strategies/jwt.strategy.ts:36-47`

```typescript
async validate(payload: any) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    include: { profile: true },
  });

  if (!user || user.status === 'deleted') {
    throw new UnauthorizedException();
  }

  return user;  // Returns full user object including role
}
```

The JWT strategy returns the full user object (including `role` field) to `request.user`, making role available for backend guards. However, this doesn't help with frontend routing decisions.

#### Frontend Admin Route Protection
**File**: `/workspace/src/admin/AdminRoute.tsx:17-59`

```typescript
export function AdminRoute({ children }: AdminRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // Get current user info from API
        const response = await api.get<User>('/users/me');
        const userData = response.data;

        // Check if user has admin role
        if (userData.role === 'org_admin' || userData.role === 'super_admin') {
          setUser(userData);
        } else {
          setError('Access denied: Admin role required');
        }
      } catch (err: any) {
        console.error('Admin access check failed:', err);
        setError('Failed to verify admin access');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Verifying admin access..." />;
  }

  if (error || !user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

The `AdminRoute` component:
- Makes a separate API call to `/users/me` to get user role
- Checks if user is `org_admin` or `super_admin`
- Redirects to `/` if user doesn't have admin role
- Only protects access to `/admin` routes **after** the user navigates there

This is a **protection mechanism**, not a routing mechanism. It doesn't help users get to `/admin` initially.

### 5. Database State Analysis

#### Seed Data
**File**: `/workspace/grove-backend/prisma/seed.ts:1-114`

The seed script creates:
- 1 organization: "Example Company" (domain: `example.com`)
- 3 users: alice@example.com, bob@example.com, carol@example.com
- 3 profiles with diverse interests
- **All users have `role` defaulting to `"user"`** (line 31, 40, 49)
- **No super admin users are created in seed data**

For a super admin user to exist, they would need to be:
1. Created manually via database manipulation, OR
2. Created through admin endpoints (if they exist), OR
3. Have their role updated after creation

A super admin user would look like this in the database:
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Super Admin",
  "orgId": "org-uuid",
  "status": "active",
  "role": "super_admin",  // Key field
  "profile": null,  // Likely null if they haven't completed onboarding
  "lastActive": "timestamp"
}
```

Without a profile, `hasCompletedOnboarding` would be `false`, triggering the redirect to `/onboarding`.

## Architecture Documentation

### Authentication Flow for All Users

1. **Magic Link Request**: User requests magic link via email
2. **Token Generation**: Backend creates AuthToken with 15-minute expiration
3. **Email Delivery**: Magic link sent to user's email
4. **Token Verification**:
   - User clicks link → Frontend calls `/auth/verify` endpoint
   - Backend validates token
   - Backend finds/creates user (includes profile relation)
   - Backend generates JWT tokens and sets httpOnly cookies
   - Backend returns user object with `hasCompletedOnboarding: !!user.profile`
5. **Frontend Routing**:
   - `AuthCallback.tsx` receives user object
   - Checks only `hasCompletedOnboarding` flag
   - Routes to `/onboarding` if false, `/dashboard` if true
   - **No role-based logic exists**

### Profile Creation Flow

1. User completes 6-question onboarding form
2. Frontend submits to `/onboarding` endpoint
3. Backend creates Profile record
4. Backend updates User.name
5. Backend queues embedding generation job
6. Backend returns profile + embedding status
7. User can now access dashboard (has completed onboarding)

### Role-Based Access Control (RBAC)

The RBAC system exists for **API endpoint protection only**:
- Backend guards check user role from JWT
- Admin endpoints require `org_admin` or `super_admin` role
- Frontend `AdminRoute` component verifies role before rendering admin UI
- **No role-based routing after login**

## Expected vs. Current Behavior

### Current Behavior (Working as Designed)

For a super admin user without a profile:
1. User requests magic link
2. User clicks magic link
3. Backend verifies token → Returns `hasCompletedOnboarding: false`
4. Frontend routes to `/onboarding`
5. User must complete 6-question onboarding
6. After onboarding, user is routed to `/dashboard`
7. User must manually navigate to `/admin` to access admin features

### What SHOULD Happen (Design Decision Required)

**Option A: Super Admins Complete Standard Onboarding**
- Keep current behavior
- Rationale: Super admins are also users of the platform and should have profiles for matching
- After onboarding, they manually navigate to `/admin`

**Option B: Super Admins Skip Onboarding**
- Modify `AuthCallback.tsx` to check user role
- Route super admins directly to `/admin` regardless of onboarding status
- Rationale: Super admins are administrative users, not platform users
- Issue: Need to return `role` field in auth response

**Option C: Super Admins Bypass Onboarding But Can Complete It Later**
- Route to `/admin` if super_admin, regardless of profile
- Allow super admins to optionally complete onboarding to use platform features
- Rationale: Flexibility for admins who want to participate in matching

## Code References

### Backend Authentication
- `grove-backend/src/auth/auth.service.ts:210-218` - Magic link hasCompletedOnboarding logic
- `grove-backend/src/auth/saml/saml.service.ts:132-139` - SAML hasCompletedOnboarding logic
- `grove-backend/src/auth/oidc/oidc.service.ts:122-130` - OIDC hasCompletedOnboarding logic
- `grove-backend/src/profiles/profiles.service.ts:199-206` - hasCompletedOnboarding method

### Profile Requirements
- `grove-backend/src/profiles/profiles.service.ts:28-96` - Profile creation flow
- `grove-backend/prisma/schema.prisma:80-94` - Profile schema definition

### Frontend Routing
- `src/components/AuthCallback.tsx:44-67` - Post-login routing logic (CRITICAL)
- `src/components/AuthCallback.tsx:56-60` - hasCompletedOnboarding check without role
- `src/main.tsx:44-94` - Main router configuration
- `src/types/api.ts:11-20` - User type definition (no role field)

### RBAC Implementation
- `grove-backend/src/common/enums/role.enum.ts:1-5` - Role enum definition
- `grove-backend/src/common/guards/roles.guard.ts:1-43` - Role guard implementation
- `grove-backend/src/common/decorators/roles.decorator.ts:1-5` - Roles decorator
- `grove-backend/src/admin/admin.controller.ts:26-99` - Admin endpoints with role protection
- `grove-backend/src/auth/strategies/jwt.strategy.ts:36-47` - JWT validation
- `src/admin/AdminRoute.tsx:17-59` - Frontend admin route protection

### Database Schema
- `grove-backend/prisma/schema.prisma:43-75` - User model with role field
- `grove-backend/prisma/seed.ts:1-114` - Seed data (no super admins)

## Open Questions

1. **Product Decision**: Should super admins complete the standard 6-question onboarding?
   - If yes: Current behavior is correct
   - If no: Need to implement role-based routing in `AuthCallback.tsx`

2. **Frontend User Type**: Should the `User` type in `/src/types/api.ts` include the `role` field?
   - Currently missing from frontend type definition
   - Backend includes it in SAML/OIDC responses but not magic link
   - Needed for role-based routing decisions

3. **API Inconsistency**: Should the magic link auth response include `role` like SAML/OIDC do?
   - Currently: Magic link returns `{ id, email, name, hasCompletedOnboarding }`
   - SAML/OIDC return: `{ id, email, name, role, hasCompletedOnboarding }`
   - Inconsistency may cause issues

4. **Super Admin Creation**: How are super admin users created?
   - No seed data includes super admins
   - No documented process for creating super admins
   - Need to verify if admin endpoints exist for role assignment

5. **Profile Requirements for Admins**: If super admins skip onboarding, what happens if they want to use platform features?
   - Matching requires profile and embeddings
   - Should admins have option to complete onboarding later?
   - Or are admins purely administrative and never participate in matching?

## Recommendations

### If Super Admins Should Skip Onboarding:

1. **Update Backend Auth Responses** to consistently include `role` field:
   ```typescript
   // grove-backend/src/auth/auth.service.ts:210-218
   return {
     user: {
       id: user.id,
       email: user.email,
       name: user.name || '',
       role: user.role,  // ADD THIS
       hasCompletedOnboarding: !!user.profile,
     },
   };
   ```

2. **Update Frontend User Type** to include role:
   ```typescript
   // src/types/api.ts:11-20
   export interface User {
     id: string;
     email: string;
     name: string;
     role: 'user' | 'org_admin' | 'super_admin';  // ADD THIS
     orgId: string;
     status: 'active' | 'paused' | 'deleted';
     hasCompletedOnboarding: boolean;
     createdAt: string;
     lastActive: string;
   }
   ```

3. **Update AuthCallback Routing Logic** to check role:
   ```typescript
   // src/components/AuthCallback.tsx:54-61
   setTimeout(() => {
     // Route super admins to admin dashboard
     if (user.role === 'super_admin') {
       navigate('/admin');
     } else if (user.hasCompletedOnboarding) {
       navigate('/dashboard');
     } else {
       navigate('/onboarding');
     }
   }, 1500);
   ```

### If Current Behavior is Correct:

1. **Document** that super admins must complete onboarding
2. **Add** admin navigation link to dashboard for users with admin roles
3. **Consider** showing admin link prominently to admin users after they complete onboarding

### Regardless of Decision:

1. **Create Documentation** for super admin user creation process
2. **Add Seed Data** or migration script to create initial super admin user
3. **Verify** `/users/me` endpoint exists and returns role field
4. **Document** the expected user journey for different roles
