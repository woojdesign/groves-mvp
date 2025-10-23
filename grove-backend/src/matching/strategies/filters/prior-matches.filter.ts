import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';

/**
 * Filters out users who have been matched with the source user before.
 * Checks both sides of the match relationship (userAId and userBId).
 * Privacy: Users should never see the same person twice.
 */
@Injectable()
export class PriorMatchesFilter implements IFilterStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]> {
    if (candidateUserIds.length === 0) {
      return [];
    }

    // Get all user IDs that have been matched with source user before
    // Check both directions: source as userA and source as userB
    const priorMatches = await this.prisma.match.findMany({
      where: {
        OR: [
          { userAId: sourceUserId },
          { userBId: sourceUserId },
        ],
      },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    // Build set of user IDs to exclude
    const excludeUserIds = new Set<string>();
    for (const match of priorMatches) {
      // Add the "other" user ID (not the source)
      const otherUserId =
        match.userAId === sourceUserId ? match.userBId : match.userAId;
      excludeUserIds.add(otherUserId);
    }

    // Filter out prior matches from candidates
    return candidateUserIds.filter((id) => !excludeUserIds.has(id));
  }

  getName(): string {
    return 'PriorMatchesFilter';
  }
}
