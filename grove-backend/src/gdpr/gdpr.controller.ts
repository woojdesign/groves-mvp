import {
  Controller,
  Get,
  Delete,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { GdprService } from './gdpr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RecordConsentDto } from './dto/record-consent.dto';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  /**
   * GET /api/users/me
   * Get current user information
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: { id: string }) {
    return this.gdprService.getCurrentUser(user.id);
  }

  /**
   * GET /api/users/me/export
   * Export all user data (GDPR Article 15 - Right to Access)
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  async exportData(@CurrentUser() user: { id: string }, @Req() req: Request) {
    return this.gdprService.exportUserData(user.id, req);
  }

  /**
   * DELETE /api/users/me
   * Permanently delete user account and all data (GDPR Article 17 - Right to Erasure)
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: { id: string }, @Req() req: Request) {
    return this.gdprService.deleteUserData(user.id, req);
  }

  /**
   * POST /api/users/me/consent
   * Record user consent for privacy policy or terms of service
   */
  @Post('consent')
  @HttpCode(HttpStatus.OK)
  async recordConsent(
    @CurrentUser() user: { id: string },
    @Body() dto: RecordConsentDto,
    @Req() req: Request,
  ) {
    return this.gdprService.recordConsent(user.id, dto.consentType, dto.version, req);
  }
}
