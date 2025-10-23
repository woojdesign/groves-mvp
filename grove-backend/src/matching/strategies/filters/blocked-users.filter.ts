import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';

/**
 * Filters out users who have been reported/blocked by the source user.
 * Also filters out users who have reported/blocked the source user.
 * Privacy: Prevents matching with users involved in safety incidents.
 */
@Injectable()
export class BlockedUsersFilter implements IFilterStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]> {
    if (candidateUserIds.length === 0) {
      return [];
    }

    // Get all safety flags involving the source user (both as reporter and reported)
    const safetyFlags = await this.prisma.safetyFlag.findMany({
      where: {
        OR: [
          { reporterId: sourceUserId },
          { reportedId: sourceUserId },
        ],
      },
      select: {
        reporterId: true,
        reportedId: true,
      },
    });

    // Build set of user IDs to exclude
    const excludeUserIds = new Set<string>();
    for (const flag of safetyFlags) {
      // Exclude the "other" user in the safety flag
      const otherUserId =
        flag.reporterId === sourceUserId ? flag.reportedId : flag.reporterId;
      excludeUserIds.add(otherUserId);
    }

    // Filter out blocked users from candidates
    return candidateUserIds.filter((id) => !excludeUserIds.has(id));
  }

  getName(): string {
    return 'BlockedUsersFilter';
  }
}
