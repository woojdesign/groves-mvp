import type { IMatchingEngine } from './interfaces';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IntrosService } from '../intros/intros.service';
import { EmailService } from '../email/email.service';
import { AcceptMatchResponseDto } from '../intros/dto/accept-match-response.dto';
import { PassMatchResponseDto } from '../intros/dto/pass-match-response.dto';
export declare class MatchingService {
    private readonly matchingEngine;
    private readonly prisma;
    private readonly introsService;
    private readonly emailService;
    constructor(matchingEngine: IMatchingEngine, prisma: PrismaService, introsService: IntrosService, emailService: EmailService);
    getMatchesForUser(userId: string, options?: GenerateMatchesRequestDto): Promise<MatchCandidateDto[]>;
    private extractSharedInterests;
    acceptMatch(matchId: string, userId: string): Promise<AcceptMatchResponseDto>;
    passMatch(matchId: string, userId: string): Promise<PassMatchResponseDto>;
}
