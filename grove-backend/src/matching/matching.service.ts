import { Injectable, Inject } from '@nestjs/common';
import type { IMatchingEngine } from './interfaces';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Facade service for matching functionality.
 * Provides clean API for controllers while delegating to matching engine.
 * This layer can add caching, logging, and business logic.
 */
@Injectable()
export class MatchingService {
  constructor(
    @Inject('MATCHING_ENGINE') private readonly matchingEngine: IMatchingEngine,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get matches for a user using the matching engine.
   * Converts engine response to frontend-friendly DTOs.
   */
  async getMatchesForUser(
    userId: string,
    options: GenerateMatchesRequestDto = {},
  ): Promise<MatchCandidateDto[]> {
    // Generate matches using the engine
    const result = await this.matchingEngine.generateMatches({
      userId,
      limit: options.limit,
      minSimilarityScore: options.minSimilarityScore,
      diversityWeight: options.diversityWeight,
    });

    // Convert to DTOs with user information
    const matchDtos = await Promise.all(
      result.matches.map(async (match) => {
        // Get candidate user info
        const candidate = await this.prisma.user.findUnique({
          where: { id: match.candidateUserId },
          select: { id: true, name: true },
        });

        return {
          candidateId: match.candidateUserId,
          name: candidate?.name || 'Unknown User',
          score: match.similarityScore,
          reason: match.reasons.join('. '),
          sharedInterests: this.extractSharedInterests(match.reasons),
          confidence: match.finalScore,
        } as MatchCandidateDto;
      }),
    );

    return matchDtos;
  }

  /**
   * Extract shared interests from match reasons.
   * Simple implementation for MVP - Phase 5 will enhance this.
   */
  private extractSharedInterests(reasons: string[]): string[] {
    // For now, just return the reasons as interests
    // Phase 5 will implement proper interest extraction from profiles
    return reasons;
  }
}
