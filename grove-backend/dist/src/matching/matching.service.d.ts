import type { IMatchingEngine } from './interfaces';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class MatchingService {
    private readonly matchingEngine;
    private readonly prisma;
    constructor(matchingEngine: IMatchingEngine, prisma: PrismaService);
    getMatchesForUser(userId: string, options?: GenerateMatchesRequestDto): Promise<MatchCandidateDto[]>;
    private extractSharedInterests;
}
