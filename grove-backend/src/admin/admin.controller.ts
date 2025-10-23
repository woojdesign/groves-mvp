import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express';
import { OrgScoped } from '../common/decorators/org-scoped.decorator';

@Controller('admin')
@OrgScoped()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // User Management Endpoints
  @Get('users')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async getUsers(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.orgId!;
    return this.adminService.getOrgUsers(
      req.userRole!,
      orgId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('users')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async createUser(@Body() dto: CreateUserDto, @Req() req: Request) {
    const userId = req.userId!;
    const orgId = req.orgId!;
    return this.adminService.createUser(dto, userId, orgId, req);
  }

  @Put('users/:id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async updateUser(
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateUser(userId, dto, req.userId!, req.orgId!, req);
  }

  @Post('users/:id/suspend')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async suspendUser(@Param('id') userId: string, @Req() req: Request) {
    return this.adminService.suspendUser(userId, req.userId!, req.orgId!, req);
  }

  @Delete('users/:id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async deleteUser(@Param('id') userId: string, @Req() req: Request) {
    return this.adminService.deleteUser(userId, req.userId!, req.orgId!, req);
  }

  // Organization Management
  @Get('organization')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async getOrganization(@Req() req: Request) {
    return this.adminService.getOrganization(req.orgId!);
  }

  @Put('organization')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async updateOrganization(@Body() dto: any, @Req() req: Request) {
    return this.adminService.updateOrganization(req.orgId!, dto, req.userId!, req);
  }

  // Admin Actions Log
  @Get('actions')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async getAdminActions(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminActions(
      req.orgId!,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
