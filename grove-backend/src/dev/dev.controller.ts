import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DevService } from './dev.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ProductionDisabled } from '../common/decorators/production-disabled.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GeneratePresetDto } from './dto/generate-preset.dto';
import { GenerateCustomDto } from './dto/generate-custom.dto';
import { CreateManualPersonaDto } from './dto/create-manual-persona.dto';
import { BulkUploadDto } from './dto/bulk-upload.dto';

/**
 * DevController - Development dashboard for test persona management
 *
 * Security:
 * - @ProductionDisabled() - Blocks all routes when NODE_ENV === 'production'
 * - @Roles(Role.SUPER_ADMIN) - Only super admins can access
 *
 * Features:
 * - Generate test personas (preset, custom, manual, bulk)
 * - View embedding status
 * - Preview matches
 * - Manage test data
 */
@Controller('admin/dev')
@ProductionDisabled()
@Roles(Role.SUPER_ADMIN)
export class DevController {
  constructor(private devService: DevService) {}

  // Health check endpoint to verify dev dashboard is accessible
  @Get('health')
  async health() {
    return {
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      message: 'Dev Dashboard is accessible',
    };
  }

  // Persona Generation Endpoints

  @Post('personas/preset')
  async generatePreset(
    @Body() dto: GeneratePresetDto,
    @CurrentUser() user: any,
  ) {
    return this.devService.generatePreset(dto, user.orgId);
  }

  @Get('personas/jobs/:jobId')
  async getPersonaGenerationJobStatus(@Param('jobId') jobId: string) {
    return this.devService.getJobStatus(jobId);
  }

  @Post('personas/custom')
  async generateCustom(
    @Body() dto: GenerateCustomDto,
    @CurrentUser() user: any,
  ) {
    return this.devService.generateCustom(dto, user.orgId);
  }

  @Post('personas/manual')
  async createManual(
    @Body() dto: CreateManualPersonaDto,
    @CurrentUser() user: any,
  ) {
    return this.devService.createManual(dto, user.orgId);
  }

  @Post('personas/upload')
  async bulkUpload(
    @Body() dto: BulkUploadDto,
    @CurrentUser() user: any,
  ) {
    return this.devService.bulkUpload(dto, user.orgId);
  }

  // Status & Matching Endpoints

  @Get('personas')
  async listPersonas(@CurrentUser() user: any) {
    return this.devService.listPersonas(user.orgId);
  }

  @Get('personas/:id/embedding')
  async getEmbeddingStatus(@Param('id') userId: string) {
    return this.devService.getEmbeddingStatus(userId);
  }

  @Get('personas/:id/matches')
  async previewMatches(
    @Param('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.devService.previewMatches(userId, limitNum);
  }

  // Management Endpoints

  @Delete('personas/:id')
  async deletePersona(@Param('id') userId: string) {
    return this.devService.deletePersona(userId);
  }

  @Delete('personas')
  async deleteAllPersonas(@CurrentUser() user: any) {
    return this.devService.deleteAllPersonas(user.orgId);
  }

  @Get('personas/export')
  async exportPersonas(@CurrentUser() user: any) {
    return this.devService.exportPersonas(user.orgId);
  }
}
