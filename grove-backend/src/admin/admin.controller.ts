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
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getOrgUsers(
      user.role,
      user.orgId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('users')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async createUser(@CurrentUser() user: any, @Body() dto: CreateUserDto, @Req() req: Request) {
    return this.adminService.createUser(dto, user.id, user.orgId, req);
  }

  @Put('users/:id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async updateUser(
    @CurrentUser() user: any,
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateUser(userId, dto, user.id, user.orgId, req);
  }

  @Post('users/:id/suspend')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async suspendUser(@CurrentUser() user: any, @Param('id') userId: string, @Req() req: Request) {
    return this.adminService.suspendUser(userId, user.id, user.orgId, req);
  }

  @Delete('users/:id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async deleteUser(@CurrentUser() user: any, @Param('id') userId: string, @Req() req: Request) {
    return this.adminService.deleteUser(userId, user.id, user.orgId, req);
  }

  // Organization Management
  @Get('organization')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async getOrganization(@CurrentUser() user: any) {
    return this.adminService.getOrganization(user.orgId);
  }

  @Put('organization')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async updateOrganization(@CurrentUser() user: any, @Body() dto: any, @Req() req: Request) {
    return this.adminService.updateOrganization(user.orgId, dto, user.id, req);
  }

  // Admin Actions Log
  @Get('actions')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  async getAdminActions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminActions(
      user.orgId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
