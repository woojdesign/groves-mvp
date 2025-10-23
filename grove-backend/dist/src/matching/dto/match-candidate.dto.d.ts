export declare class MatchCandidateDto {
    id?: string;
    candidateId: string;
    name: string;
    score: number;
    reason: string;
    sharedInterests: string[];
    confidence: number;
    status?: string;
    expiresAt?: string;
}
