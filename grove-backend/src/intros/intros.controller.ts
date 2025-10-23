import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntrosService } from './intros.service';
import { IntroResponseDto } from './dto/intro-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Controller for introduction endpoints.
 * Handles retrieval of mutual introductions.
 */
@Controller('intros')
@UseGuards(JwtAuthGuard)
export class IntrosController {
  constructor(private readonly introsService: IntrosService) {}

  /**
   * GET /api/intros
   * Get active introductions for the authenticated user.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getIntros(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<{ intros: IntroResponseDto[] }> {
    const intros = await this.introsService.getActiveIntros(user.id);
    return { intros };
  }
}
