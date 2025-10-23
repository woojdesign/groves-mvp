import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller()
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @CurrentUser() user: User,
    @Body() dto: CreateProfileDto,
    @Req() req: Request,
  ) {
    return this.profilesService.createProfile(user.id, dto, req);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.profilesService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    return this.profilesService.updateProfile(user.id, dto, req);
  }

  @Get('profile/embedding-status')
  async getEmbeddingStatus(@CurrentUser() user: User) {
    const status = await this.profilesService.getEmbeddingStatus(user.id);
    return { status };
  }
}
