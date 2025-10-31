import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';

/**
 * Filters to ONLY include users from the same organization as the source user.
 * Purpose: For MVP, matches should be within the same organization only.
 * This prevents cross-organizational matching and keeps connections internal.
 *
 * Note: Original spec mentioned preventing "same team" matches, but organization
 * is the correct scope for now. Team-level filtering can be added later.
 */
@Injectable()
export class SameOrgFilter implements IFilterStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]> {
    if (candidateUserIds.length === 0) {
      return [];
    }

    // Get source user's organization
    const sourceUser = await this.prisma.user.findUnique({
      where: { id: sourceUserId },
      select: { orgId: true },
    });

    if (!sourceUser) {
      throw new Error(`Source user ${sourceUserId} not found`);
    }

    // Get candidate users and their organizations
    const candidateUsers = await this.prisma.user.findMany({
      where: {
        id: { in: candidateUserIds },
      },
      select: {
        id: true,
        orgId: true,
      },
    });

    // Filter to ONLY users from the SAME organization
    return candidateUsers
      .filter((candidate) => candidate.orgId === sourceUser.orgId)
      .map((candidate) => candidate.id);
  }

  getName(): string {
    return 'SameOrgFilter';
  }
}
