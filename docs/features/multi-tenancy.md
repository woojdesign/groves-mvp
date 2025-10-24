# Multi-Tenancy Architecture

**Grove MVP** uses an **explicit service-layer filtering** approach for multi-tenant data isolation.

## Table of Contents

- [Overview](#overview)
- [Architecture Decision](#architecture-decision)
- [Implementation Pattern](#implementation-pattern)
- [Code Examples](#code-examples)
- [Testing Requirements](#testing-requirements)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

## Overview

Grove is a multi-tenant application where multiple organizations share the same database, but data must be strictly isolated between organizations. Each user belongs to exactly one organization (`orgId`), and users can only access data from their own organization.

## Architecture Decision

### Why Explicit Service-Layer Filtering?

We use **explicit service-layer filtering** where every Prisma query explicitly includes `orgId` in the `WHERE` clause.

**Example:**
```typescript
async getOrgUsers(orgId: string) {
  return this.prisma.user.findMany({
    where: { orgId },  // Explicit org filter
    include: { profile: true },
  });
}
```

### Alternative Approaches Considered

#### 1. AsyncLocalStorage with Automatic Prisma Middleware (Rejected)

**What it was:**
- Use Node.js AsyncLocalStorage to propagate `orgId` through async operations
- Prisma middleware automatically injects `WHERE orgId = ?` into all queries
- Services don't need to explicitly filter

**Why we rejected it:**
- **Complexity**: AsyncLocalStorage context must be carefully populated at request boundaries
- **Debugging difficulty**: "Magical" filtering is hard to trace and audit
- **NestJS challenges**: Dependency injection, interceptors, and guards complicate context propagation
- **Error-prone**: Context can fail to populate, leading to unfiltered queries (the original blocking bug)

#### 2. PostgreSQL Row-Level Security (Future Consideration)

**What it is:**
- Database-level policies that automatically filter rows based on session variables
- Example: `CREATE POLICY tenant_isolation ON users USING (org_id = current_setting('app.org_id'))`

**Why not now:**
- More complex to configure and maintain
- Requires setting PostgreSQL session variables on every connection
- Better as a **defense-in-depth layer** added later

**Status**: Consider for Phase 3 (Security Hardening)

### Benefits of Explicit Filtering

1. **Auditability**: Every query clearly shows org filtering in code reviews
2. **Simplicity**: No hidden context or middleware magic
3. **Maintainability**: New developers immediately understand the pattern
4. **Debuggability**: Easy to trace what org filter is applied
5. **Reliability**: No risk of context pollution or missing context

## Implementation Pattern

### 1. Request Context (Already Implemented)

`TenantContextMiddleware` extracts tenant context from JWT and attaches it to the Express Request:

```typescript
// grove-backend/src/common/middleware/tenant-context.middleware.ts
if (user) {
  req.orgId = user.orgId;
  req.userId = user.id || user.sub;
  req.userRole = user.role;
}
```

### 2. Controller Layer

Controllers extract `orgId` from request and pass it to services:

```typescript
// grove-backend/src/admin/admin.controller.ts
@Get('users')
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
async getUsers(@Req() req: Request) {
  const orgId = req.orgId!;  // Non-null assertion (validated by middleware)
  return this.adminService.getOrgUsers(req.userRole!, orgId);
}
```

### 3. Service Layer (Critical)

Services **MUST** explicitly filter by `orgId` in every Prisma query:

```typescript
// grove-backend/src/admin/admin.service.ts
async getOrgUsers(orgId: string, page = 1, limit = 50) {
  return this.prisma.user.findMany({
    where: { orgId },  // REQUIRED: Explicit org filter
    include: { profile: true },
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

### 4. Verification Before Updates/Deletes

Always verify the target resource belongs to the user's org before modification:

```typescript
async updateUser(userId: string, dto: UpdateUserDto, orgId: string) {
  // Step 1: Fetch user
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  // Step 2: Verify org ownership
  if (!user || user.orgId !== orgId) {
    throw new NotFoundException('User not found in your organization');
  }

  // Step 3: Perform update
  return this.prisma.user.update({
    where: { id: userId },
    data: { name: dto.name, status: dto.status },
  });
}
```

## Code Examples

### Correct Pattern: Explicit Filtering

```typescript
// CORRECT: Always filter by orgId
async findUsersByOrg(orgId: string) {
  return this.prisma.user.findMany({
    where: { orgId },
  });
}

// CORRECT: Verify org ownership before update
async deleteUser(userId: string, orgId: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.orgId !== orgId) {
    throw new NotFoundException('User not found');
  }

  return this.prisma.user.update({
    where: { id: userId },
    data: { status: 'deleted' },
  });
}
```

### Incorrect Patterns (Security Vulnerabilities)

```typescript
// WRONG: Missing org filter - allows cross-org access!
async findUser(userId: string) {
  return this.prisma.user.findUnique({
    where: { id: userId },  // No orgId check!
  });
}

// WRONG: No org verification before update
async updateUserName(userId: string, name: string) {
  return this.prisma.user.update({
    where: { id: userId },  // Org not verified!
    data: { name },
  });
}

// WRONG: Trusting client-provided orgId
async getUsers(@Query('orgId') orgId: string) {
  // User could pass ANY orgId!
  return this.prisma.user.findMany({ where: { orgId } });
}
```

### Tenant-Scoped Models

These models MUST always be filtered by `orgId`:

- `User` - Users belong to organizations
- `Profile` - Profiles belong to users (inherit orgId)
- `Match` - Matches between users in same org
- `Embedding` - AI embeddings for profiles
- `Feedback` - User feedback on matches
- `SafetyFlag` - Safety reports

### Non-Tenant Models

These models are global or don't need org filtering:

- `Org` - Organization records (filtered by org admin permissions)
- `AdminAction` - Audit logs (org_admin sees their org, super_admin sees all)

## Testing Requirements

### Unit Tests

Every service method that queries tenant-scoped models MUST have a test verifying org filtering:

```typescript
describe('AdminService', () => {
  it('should only return users from the specified org', async () => {
    // Create users in two different orgs
    const orgA = await createTestOrg({ name: 'Org A' });
    const orgB = await createTestOrg({ name: 'Org B' });

    await createTestUser({ orgId: orgA.id, email: 'user1@orga.com' });
    await createTestUser({ orgId: orgB.id, email: 'user2@orgb.com' });

    // Get users for Org A
    const result = await service.getOrgUsers(orgA.id);

    // Should only return Org A users
    expect(result.users).toHaveLength(1);
    expect(result.users[0].email).toBe('user1@orga.com');
  });
});
```

### Integration Tests

Test cross-org access attempts to ensure isolation:

```typescript
describe('Multi-Tenant Isolation (Integration)', () => {
  it('should prevent org_admin from accessing other org users', async () => {
    // Create two orgs with admins
    const orgAAdmin = await createTestUser({
      orgId: orgA.id,
      role: 'org_admin'
    });
    const orgBUser = await createTestUser({
      orgId: orgB.id,
      role: 'user'
    });

    // Org A admin tries to access Org B user
    const response = await request(app)
      .get(`/api/admin/users/${orgBUser.id}`)
      .set('Cookie', `accessToken=${orgAAdminToken}`)
      .expect(404);  // Should NOT find the user

    expect(response.body.message).toContain('not found in your organization');
  });

  it('should allow super_admin to access all orgs', async () => {
    const superAdmin = await createTestUser({
      orgId: platformOrgId,
      role: 'super_admin'
    });

    // Super admin can see users from all orgs
    const response = await request(app)
      .get('/api/admin/users')
      .set('Cookie', `accessToken=${superAdminToken}`)
      .expect(200);

    expect(response.body.users.length).toBeGreaterThan(1);
  });
});
```

## Security Considerations

### 1. Never Trust Client Input for orgId

Always use `req.orgId` (from JWT), never query parameters or body fields:

```typescript
// WRONG: Client controls orgId
async getUsers(@Query('orgId') orgId: string) {
  return this.prisma.user.findMany({ where: { orgId } });
}

// CORRECT: Use orgId from authenticated user
async getUsers(@Req() req: Request) {
  const orgId = req.orgId!;  // From JWT, not client input
  return this.prisma.user.findMany({ where: { orgId } });
}
```

### 2. Verify Ownership for All Updates/Deletes

Never assume a user can modify a resource just because they know its ID:

```typescript
// WRONG: Missing org verification
async deleteMatch(matchId: string) {
  return this.prisma.match.delete({ where: { id: matchId } });
}

// CORRECT: Verify match belongs to user's org
async deleteMatch(matchId: string, orgId: string) {
  const match = await this.prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match || match.orgId !== orgId) {
    throw new NotFoundException('Match not found');
  }

  return this.prisma.match.delete({ where: { id: matchId } });
}
```

### 3. Use Database Indexes

Ensure `orgId` is indexed for performance:

```prisma
model User {
  id    String @id @default(uuid())
  orgId String @map("org_id")
  // ...

  @@index([orgId])  // Speeds up WHERE orgId = ? queries
}
```

### 4. Audit Logs Should Capture orgId

All admin actions should log the orgId for audit trail:

```typescript
await this.prisma.adminAction.create({
  data: {
    adminId,
    action: 'delete_user',
    targetId: userId,
    orgId,  // REQUIRED for audit trail
    metadata: { reason: 'user requested deletion' },
  },
});
```

## Future Enhancements

### Phase 3: Add PostgreSQL Row-Level Security (Defense-in-Depth)

As a **secondary layer** of protection, consider adding database-level RLS:

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their org's data
CREATE POLICY tenant_isolation ON users
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY tenant_isolation ON profiles
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

**Implementation:**
- Set PostgreSQL session variable on connection: `SET app.current_org_id = '<orgId>'`
- RLS policies enforce org filtering even if application code forgets
- This is **defense-in-depth**, not a replacement for explicit filtering

**Benefits:**
- Bulletproof isolation (database enforces it)
- Catches application bugs (forgotten org filters)
- Compliance requirement for SOC2 Type II

**Trade-offs:**
- More complex to configure
- Requires session variable management
- Potential performance impact (database evaluates policies on every query)

## Developer Checklist

When adding a new feature that queries tenant-scoped models:

- [ ] Controller extracts `orgId` from `req.orgId` (from JWT)
- [ ] Service method accepts `orgId` as parameter
- [ ] All Prisma queries include `where: { orgId }` filter
- [ ] Update/delete operations verify org ownership before execution
- [ ] Unit tests verify org filtering works correctly
- [ ] Integration tests verify cross-org access is blocked
- [ ] Code review confirms no client-controlled orgId values

## References

- [AdminService](../grove-backend/src/admin/admin.service.ts) - Reference implementation
- [TenantContextMiddleware](../grove-backend/src/common/middleware/tenant-context.middleware.ts) - Request context extraction
- [PrismaService](../grove-backend/src/prisma/prisma.service.ts) - Database service (no automatic filtering)

---

**Last Updated**: 2025-10-23 (Phase 1 Security Fix)
**Status**: Production-ready with explicit filtering pattern
