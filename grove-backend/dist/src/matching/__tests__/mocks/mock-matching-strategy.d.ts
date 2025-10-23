import { IMatchingStrategy } from '../../interfaces/matching-strategy.interface';
export declare class MockMatchingStrategy implements IMatchingStrategy {
    computeSimilarity(sourceUserId: string, candidateUserIds: string[]): Promise<Map<string, number>>;
    getName(): string;
}
