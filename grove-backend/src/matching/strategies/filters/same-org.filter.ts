import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';

/**
 * Filters out users from the same organization as the source user.
 * Purpose: Promote cross-organizational connections and diversity.
 * MVP constraint: Users should only be matched with people from different orgs.
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

    // Filter out users from the same organization
    return candidateUsers
      .filter((candidate) => candidate.orgId !== sourceUser.orgId)
      .map((candidate) => candidate.id);
  }

  getName(): string {
    return 'SameOrgFilter';
  }
}
