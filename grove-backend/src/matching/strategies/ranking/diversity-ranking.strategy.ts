import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IRankingStrategy,
  RankingCandidate,
} from '../../interfaces/ranking-strategy.interface';

/**
 * Diversity ranking strategy that boosts candidates with different backgrounds.
 * Promotes diversity based on:
 * - Different organization (+0.4 bonus)
 * - Different connection type preference (+0.3 bonus)
 * - Different geographic/domain diversity (+0.3 bonus)
 *
 * Final score = (similarity * (1 - diversityWeight)) + (diversityScore * diversityWeight)
 * Default diversity weight: 0.3 (70% similarity, 30% diversity)
 */
@Injectable()
export class DiversityRankingStrategy implements IRankingStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async rerank(
    sourceUserId: string,
    candidates: RankingCandidate[],
  ): Promise<RankingCandidate[]> {
    if (candidates.length === 0) {
      return [];
    }

    // Get source user's profile and organization
    const sourceUser = await this.prisma.user.findUnique({
      where: { id: sourceUserId },
      include: {
        profile: true,
        org: true,
      },
    });

    if (!sourceUser || !sourceUser.profile) {
      throw new Error(
        `Source user ${sourceUserId} not found or has no profile`,
      );
    }

    // Get candidate user profiles and organizations
    const candidateIds = candidates.map((c) => c.userId);
    const candidateUsers = await this.prisma.user.findMany({
      where: {
        id: { in: candidateIds },
      },
      include: {
        profile: true,
        org: true,
      },
    });

    // Create lookup map for faster access
    const candidateMap = new Map(candidateUsers.map((u) => [u.id, u]));

    // Default diversity weight: 30% diversity, 70% similarity
    const diversityWeight = 0.3;

    // Compute diversity scores and final scores
    const rankedCandidates = candidates.map((candidate) => {
      const candidateUser = candidateMap.get(candidate.userId);

      // Initialize diversity score
      let diversityScore = 0;

      if (candidateUser && candidateUser.profile) {
        // 1. Different organization (40% of diversity score)
        if (candidateUser.orgId !== sourceUser.orgId) {
          diversityScore += 0.4;
        }

        // 2. Different connection type preference (30% of diversity score)
        if (
          candidateUser.profile.connectionType !==
          sourceUser.profile!.connectionType
        ) {
          diversityScore += 0.3;
        }

        // 3. Different domain/geographic diversity (30% of diversity score)
        // Using email domain as proxy for geographic/organizational diversity
        if (candidateUser.org.domain !== sourceUser.org.domain) {
          diversityScore += 0.3;
        }
      }

      // Normalize diversity score to [0, 1]
      diversityScore = Math.min(diversityScore, 1.0);

      // Calculate weighted final score
      // Higher diversity weight = more emphasis on diversity
      const finalScore =
        candidate.similarityScore * (1 - diversityWeight) +
        diversityScore * diversityWeight;

      return {
        ...candidate,
        diversityScore,
        finalScore,
      };
    });

    // Sort by final score descending (highest scores first)
    return rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);
  }

  getName(): string {
    return 'DiversityRankingStrategy';
  }
}
