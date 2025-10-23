import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';
export declare class MockFilterStrategy implements IFilterStrategy {
    filter(sourceUserId: string, candidateUserIds: string[]): Promise<string[]>;
    getName(): string;
}
