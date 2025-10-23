export interface IMatchingStrategy {
    computeSimilarity(sourceUserId: string, candidateUserIds: string[]): Promise<Map<string, number>>;
    getName(): string;
}
