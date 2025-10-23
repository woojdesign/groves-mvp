export interface IFilterStrategy {
    filter(sourceUserId: string, candidateUserIds: string[]): Promise<string[]>;
    getName(): string;
}
