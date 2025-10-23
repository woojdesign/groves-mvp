import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Controller for matching endpoints.
 * Handles match generation and retrieval.
 */
@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * GET /api/matches
   * Get matches for the authenticated user.
   * Returns a list of match candidates with scores and explanations.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMatches(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: GenerateMatchesRequestDto,
  ): Promise<MatchCandidateDto[]> {
    return this.matchingService.getMatchesForUser(user.id, query);
  }
}
