import type { Request } from 'express';
import { MatchingService } from './matching.service';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { AcceptMatchResponseDto } from '../intros/dto/accept-match-response.dto';
import { PassMatchResponseDto } from '../intros/dto/pass-match-response.dto';
export declare class MatchingController {
    private readonly matchingService;
    constructor(matchingService: MatchingService);
    getMatches(user: {
        id: string;
        email: string;
    }, query: GenerateMatchesRequestDto): Promise<MatchCandidateDto[]>;
    acceptMatch(matchId: string, user: {
        id: string;
        email: string;
    }, req: Request): Promise<AcceptMatchResponseDto>;
    passMatch(matchId: string, user: {
        id: string;
        email: string;
    }): Promise<PassMatchResponseDto>;
}
