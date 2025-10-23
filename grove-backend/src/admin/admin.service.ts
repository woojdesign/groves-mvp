import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // User Management
  async createUser(dto: CreateUserDto, adminId: string, orgId: string) {
    // Create user in admin's organization
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        orgId,
        role: dto.role || 'user',
        ssoProvider: dto.ssoProvider || 'magic_link',
      },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId,
        action: 'create_user',
        targetType: 'user',
        targetId: user.id,
        orgId,
        metadata: { email: dto.email },
        ipAddress: '0.0.0.0', // TODO: Get from request
        userAgent: 'API',
      },
    });

    return user;
  }

  async getOrgUsers(adminRole: string, orgId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { orgId },
        include: { profile: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { orgId } }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(
    userId: string,
    dto: UpdateUserDto,
    adminId: string,
    orgId: string,
  ) {
    // Verify user belongs to same org
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.orgId !== orgId) {
      throw new NotFoundException('User not found in your organization');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        status: dto.status,
        role: dto.role,
      },
    });

    await this.prisma.adminAction.create({
      data: {
        adminId,
        action: 'update_user',
        targetType: 'user',
        targetId: userId,
        orgId,
        metadata: dto as any,
        ipAddress: '0.0.0.0',
        userAgent: 'API',
      },
    });

    return updated;
  }

  async suspendUser(userId: string, adminId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.orgId !== orgId) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'paused' },
    });

    await this.prisma.adminAction.create({
      data: {
        adminId,
        action: 'suspend_user',
        targetType: 'user',
        targetId: userId,
        orgId,
        metadata: {},
        ipAddress: '0.0.0.0',
        userAgent: 'API',
      },
    });

    return updated;
  }

  async deleteUser(userId: string, adminId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.orgId !== orgId) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'deleted' },
    });

    await this.prisma.adminAction.create({
      data: {
        adminId,
        action: 'delete_user',
        targetType: 'user',
        targetId: userId,
        orgId,
        metadata: {},
        ipAddress: '0.0.0.0',
        userAgent: 'API',
      },
    });

    return { message: 'User deleted successfully' };
  }

  // Organization Management
  async getOrganization(orgId: string) {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            role: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async updateOrganization(orgId: string, dto: any, adminId: string) {
    const org = await this.prisma.org.update({
      where: { id: orgId },
      data: {
        name: dto.name,
        ssoEnabled: dto.ssoEnabled,
        ssoProvider: dto.ssoProvider,
      },
    });

    await this.prisma.adminAction.create({
      data: {
        adminId,
        action: 'update_org',
        targetType: 'org',
        targetId: orgId,
        orgId,
        metadata: { changes: dto },
        ipAddress: '0.0.0.0',
        userAgent: 'API',
      },
    });

    return org;
  }

  // Admin Actions Log
  async getAdminActions(orgId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      this.prisma.adminAction.findMany({
        where: { orgId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAction.count({ where: { orgId } }),
    ]);

    return {
      actions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
