import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  ) {
    return this.profilesService.createProfile(user.id, dto);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.profilesService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, dto);
  }
}
