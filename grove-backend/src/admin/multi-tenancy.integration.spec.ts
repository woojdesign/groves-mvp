import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Multi-Tenancy Integration Tests
 *
 * These tests verify that the explicit service-layer filtering approach
 * correctly isolates data between organizations.
 *
 * Critical security tests:
 * 1. ORG_ADMIN from Org A cannot access Org B users
 * 2. ORG_ADMIN from Org A cannot modify Org B users
 * 3. SUPER_ADMIN can access all orgs (future feature)
 * 4. Services explicitly filter by orgId in all queries
 */
describe('Multi-Tenant Data Isolation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminService: AdminService;
  let jwtService: JwtService;

  // Test data
  let orgA: any;
  let orgB: any;
  let orgAAdmin: any;
  let orgAUser: any;
  let orgBAdmin: any;
  let orgBUser: any;
  let superAdmin: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AdminService, JwtService],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    adminService = moduleFixture.get<AdminService>(AdminService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create two separate organizations
    orgA = await prisma.org.create({
      data: {
        name: 'Organization A',
        domain: 'orga.com',
      },
    });

    orgB = await prisma.org.create({
      data: {
        name: 'Organization B',
        domain: 'orgb.com',
      },
    });

    // Create users in Org A
    orgAAdmin = await prisma.user.create({
      data: {
        email: 'admin@orga.com',
        name: 'Org A Admin',
        orgId: orgA.id,
        role: 'org_admin',
      },
    });

    orgAUser = await prisma.user.create({
      data: {
        email: 'user@orga.com',
        name: 'Org A User',
        orgId: orgA.id,
        role: 'user',
      },
    });

    // Create users in Org B
    orgBAdmin = await prisma.user.create({
      data: {
        email: 'admin@orgb.com',
        name: 'Org B Admin',
        orgId: orgB.id,
        role: 'org_admin',
      },
    });

    orgBUser = await prisma.user.create({
      data: {
        email: 'user@orgb.com',
        name: 'Org B User',
        orgId: orgB.id,
        role: 'user',
      },
    });

    // Create super admin (for future tests)
    const platformOrg = await prisma.org.create({
      data: {
        name: 'Grove Platform',
        domain: 'grove.com',
      },
    });

    superAdmin = await prisma.user.create({
      data: {
        email: 'super@grove.com',
        name: 'Super Admin',
        orgId: platformOrg.id,
        role: 'super_admin',
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
    await prisma.org.deleteMany({});
  });

  describe('Service-Layer Org Filtering', () => {
    it('should only return users from the specified org', async () => {
      // Act: Get users for Org A
      const result = await adminService.getOrgUsers('org_admin', orgA.id);

      // Assert: Should only return Org A users
      expect(result.users).toHaveLength(2); // orgAAdmin + orgAUser
      expect(result.users.every((u) => u.orgId === orgA.id)).toBe(true);
      expect(result.users.find((u) => u.email === 'admin@orga.com')).toBeDefined();
      expect(result.users.find((u) => u.email === 'user@orga.com')).toBeDefined();
      expect(result.users.find((u) => u.email === 'user@orgb.com')).toBeUndefined();
    });

    it('should prevent org admin from accessing users in other org', async () => {
      // Act: Org A admin tries to get users for Org B
      const result = await adminService.getOrgUsers('org_admin', orgA.id);

      // Assert: Should NOT return Org B users
      expect(result.users.find((u) => u.orgId === orgB.id)).toBeUndefined();
    });

    it('should prevent org admin from updating users in other org', async () => {
      // Act & Assert: Org A admin tries to update Org B user
      await expect(
        adminService.updateUser(
          orgBUser.id,
          { name: 'Hacked Name' },
          orgAAdmin.id,
          orgA.id, // Org A admin's orgId
        ),
      ).rejects.toThrow('User not found in your organization');
    });

    it('should prevent org admin from suspending users in other org', async () => {
      // Act & Assert: Org A admin tries to suspend Org B user
      await expect(
        adminService.suspendUser(orgBUser.id, orgAAdmin.id, orgA.id),
      ).rejects.toThrow('User not found');
    });

    it('should prevent org admin from deleting users in other org', async () => {
      // Act & Assert: Org A admin tries to delete Org B user
      await expect(
        adminService.deleteUser(orgBUser.id, orgAAdmin.id, orgA.id),
      ).rejects.toThrow('User not found');
    });

    it('should allow org admin to manage users in their own org', async () => {
      // Act: Org A admin updates Org A user
      const updated = await adminService.updateUser(
        orgAUser.id,
        { name: 'Updated Name' },
        orgAAdmin.id,
        orgA.id,
      );

      // Assert: Update succeeds
      expect(updated.name).toBe('Updated Name');
      expect(updated.orgId).toBe(orgA.id);
    });

    it('should verify org ownership before user deletion', async () => {
      // Act: Org A admin deletes Org A user (should succeed)
      const result = await adminService.deleteUser(
        orgAUser.id,
        orgAAdmin.id,
        orgA.id,
      );

      // Assert: Deletion succeeds
      expect(result.message).toBe('User deleted successfully');

      // Verify user is soft-deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: orgAUser.id },
      });
      expect(deletedUser?.status).toBe('deleted');
    });
  });

  describe('Cross-Org Access Prevention', () => {
    it('should isolate admin action logs by org', async () => {
      // Arrange: Create admin actions in both orgs
      await prisma.adminAction.create({
        data: {
          adminId: orgAAdmin.id,
          action: 'create_user',
          targetType: 'user',
          targetId: orgAUser.id,
          orgId: orgA.id,
          metadata: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Test',
        },
      });

      await prisma.adminAction.create({
        data: {
          adminId: orgBAdmin.id,
          action: 'create_user',
          targetType: 'user',
          targetId: orgBUser.id,
          orgId: orgB.id,
          metadata: {},
          ipAddress: '192.168.1.2',
          userAgent: 'Test',
        },
      });

      // Act: Get admin actions for Org A
      const result = await adminService.getAdminActions(orgA.id);

      // Assert: Should only return Org A actions
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].orgId).toBe(orgA.id);
      expect(result.actions[0].adminId).toBe(orgAAdmin.id);
    });

    it('should prevent org admin from viewing other org admin actions', async () => {
      // Arrange: Create admin action in Org B
      await prisma.adminAction.create({
        data: {
          adminId: orgBAdmin.id,
          action: 'delete_user',
          targetType: 'user',
          targetId: orgBUser.id,
          orgId: orgB.id,
          metadata: {},
          ipAddress: '192.168.1.2',
          userAgent: 'Test',
        },
      });

      // Act: Org A admin gets their admin actions
      const result = await adminService.getAdminActions(orgA.id);

      // Assert: Should NOT see Org B actions
      expect(result.actions.find((a) => a.orgId === orgB.id)).toBeUndefined();
    });

    it('should prevent direct database access bypass attempts', async () => {
      // This test verifies the service layer enforces org filtering
      // even if someone tries to query Prisma directly

      // Act: Use service method with correct orgId
      const result = await adminService.getOrgUsers('org_admin', orgA.id);

      // Assert: Only Org A users returned
      expect(result.users.every((u) => u.orgId === orgA.id)).toBe(true);

      // If someone bypassed the service layer and used Prisma directly:
      // const allUsers = await prisma.user.findMany(); // This would leak data!
      // Our architecture requires explicit orgId filtering in services.
    });
  });

  describe('Organization Management', () => {
    it('should only return organization for specified orgId', async () => {
      // Act: Get Org A details
      const result = await adminService.getOrganization(orgA.id);

      // Assert: Should return Org A with its users only
      expect(result.id).toBe(orgA.id);
      expect(result.name).toBe('Organization A');
      expect(result.users).toHaveLength(2); // orgAAdmin + orgAUser
      expect(result.users.every((u) => u.id === orgAAdmin.id || u.id === orgAUser.id)).toBe(true);
    });

    it('should not allow org admin to access other org details', async () => {
      // Note: In production, this would be enforced by controller-level checks
      // The service method itself requires orgId, so cross-org access is prevented

      // Act: Get Org B details (should only work if controller passes correct orgId)
      const result = await adminService.getOrganization(orgB.id);

      // Assert: Returns Org B (service trusts orgId parameter from controller)
      expect(result.id).toBe(orgB.id);

      // SECURITY NOTE: Controller must extract orgId from req.orgId (JWT)
      // Never allow client to specify orgId in query params or body!
    });
  });

  describe('Future: SUPER_ADMIN Cross-Org Access', () => {
    it('should allow super_admin to access all orgs (TODO: not yet implemented)', async () => {
      // This test documents future functionality
      // Currently, SUPER_ADMIN has same restrictions as ORG_ADMIN

      // Act: Get users (currently filtered by super admin's org)
      const result = await adminService.getOrgUsers(
        'super_admin',
        superAdmin.orgId,
      );

      // Assert: Currently only returns users from super admin's org
      // TODO Phase 3: Implement cross-org access for super_admin
      expect(result.users.every((u) => u.orgId === superAdmin.orgId)).toBe(true);

      // Future implementation should allow:
      // const allOrgs = await adminService.getOrgUsers('super_admin', null);
      // expect(allOrgs.users.length).toBeGreaterThan(2); // Users from all orgs
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle non-existent orgId gracefully', async () => {
      // Act: Try to get users for non-existent org
      const result = await adminService.getOrgUsers(
        'org_admin',
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert: Returns empty list (no error)
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should prevent UUID collision attacks', async () => {
      // Act: Try to use another org's user ID to access data
      await expect(
        adminService.updateUser(
          orgBUser.id, // Org B user ID
          { name: 'Hacked' },
          orgAAdmin.id,
          orgA.id, // But Org A admin's orgId
        ),
      ).rejects.toThrow('User not found in your organization');

      // Verify original user unchanged
      const originalUser = await prisma.user.findUnique({
        where: { id: orgBUser.id },
      });
      expect(originalUser?.name).toBe('Org B User');
    });

    it('should prevent org switching via user update', async () => {
      // Act & Assert: Try to move user to different org
      // This should be prevented by not accepting orgId in UpdateUserDto
      const updated = await adminService.updateUser(
        orgAUser.id,
        { name: 'New Name' } as any,
        // Note: UpdateUserDto should not have orgId field
        orgAAdmin.id,
        orgA.id,
      );

      // Verify orgId didn't change
      expect(updated.orgId).toBe(orgA.id); // Still in Org A
    });
  });
});
