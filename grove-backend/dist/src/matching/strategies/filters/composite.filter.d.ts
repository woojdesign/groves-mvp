import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';
import { PriorMatchesFilter } from './prior-matches.filter';
import { BlockedUsersFilter } from './blocked-users.filter';
import { SameOrgFilter } from './same-org.filter';
export declare class CompositeFilterStrategy implements IFilterStrategy {
    private readonly priorMatchesFilter;
    private readonly blockedUsersFilter;
    private readonly sameOrgFilter;
    constructor(priorMatchesFilter: PriorMatchesFilter, blockedUsersFilter: BlockedUsersFilter, sameOrgFilter: SameOrgFilter);
    filter(sourceUserId: string, candidateUserIds: string[]): Promise<string[]>;
    getName(): string;
}
