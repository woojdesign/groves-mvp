import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { MatchingService } from './matching.service';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AcceptMatchResponseDto } from '../intros/dto/accept-match-response.dto';
import { PassMatchResponseDto } from '../intros/dto/pass-match-response.dto';

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
    @Req() req: Request,
  ): Promise<{ matches: MatchCandidateDto[]; total: number; hasMore: boolean }> {
    // Disable caching for matches endpoint since they can change
    const response = req.res;
    if (response) {
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
    }
    const matches = await this.matchingService.getMatchesForUser(user.id, query);
    return {
      matches,
      total: matches.length,
      hasMore: false, // For MVP, we return all matches at once
    };
  }

  /**
   * POST /api/matches/:matchId/accept
   * Accept a match (express interest).
   * Creates intro if other user has also accepted.
   */
  @Post(':matchId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptMatch(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { id: string; email: string },
    @Req() req: Request,
  ): Promise<AcceptMatchResponseDto> {
    return this.matchingService.acceptMatch(matchId, user.id, req);
  }

  /**
   * POST /api/matches/:matchId/pass
   * Pass on a match (decline interest).
   */
  @Post(':matchId/pass')
  @HttpCode(HttpStatus.OK)
  async passMatch(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<PassMatchResponseDto> {
    return this.matchingService.passMatch(matchId, user.id);
  }
}
