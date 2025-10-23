import { Injectable } from '@nestjs/common';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';
import { PriorMatchesFilter } from './prior-matches.filter';
import { BlockedUsersFilter } from './blocked-users.filter';
import { SameOrgFilter } from './same-org.filter';

/**
 * Composite filter that chains multiple filter strategies together.
 * Applies filters sequentially: prior matches -> blocked users -> same org.
 * Each filter reduces the candidate pool until all criteria are satisfied.
 */
@Injectable()
export class CompositeFilterStrategy implements IFilterStrategy {
  constructor(
    private readonly priorMatchesFilter: PriorMatchesFilter,
    private readonly blockedUsersFilter: BlockedUsersFilter,
    private readonly sameOrgFilter: SameOrgFilter,
  ) {}

  async filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]> {
    let filtered = candidateUserIds;

    // Apply filters sequentially
    // Order matters: cheaper filters first (database query optimization)
    filtered = await this.priorMatchesFilter.filter(sourceUserId, filtered);
    filtered = await this.blockedUsersFilter.filter(sourceUserId, filtered);
    filtered = await this.sameOrgFilter.filter(sourceUserId, filtered);

    return filtered;
  }

  getName(): string {
    return 'CompositeFilterStrategy';
  }
}
