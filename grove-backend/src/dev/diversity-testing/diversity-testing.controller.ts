import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { DiversityTestingService } from './diversity-testing.service';
import { AnalyzePersonasDto } from './dto/analyze-request.dto';
import { QuickDiversityMetricsDto } from './dto/diversity-metrics.dto';

@ApiTags('dev/diversity-testing')
@Controller('dev/diversity-testing')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class DiversityTestingController {
  constructor(private diversityTestingService: DiversityTestingService) {}

  @Post('analyze/quick')
  @ApiOperation({ summary: 'Run quick diversity analysis (Tier 1)' })
  @ApiResponse({ status: 200, type: QuickDiversityMetricsDto })
  async analyzeQuick(@Body() dto: AnalyzePersonasDto): Promise<QuickDiversityMetricsDto> {
    return this.diversityTestingService.analyzeQuick(dto);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two batches' })
  async compare(
    @Query('baseline') baseline: string,
    @Query('experiment') experiment: string,
  ): Promise<any> {
    return this.diversityTestingService.compare(baseline, experiment);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List all saved batches' })
  async listBatches(): Promise<{ batches: string[] }> {
    const batches = await this.diversityTestingService['storageService'].list();
    return { batches };
  }
}
