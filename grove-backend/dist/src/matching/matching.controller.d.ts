import { MatchingService } from './matching.service';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
export declare class MatchingController {
    private readonly matchingService;
    constructor(matchingService: MatchingService);
    getMatches(user: {
        id: string;
        email: string;
    }, query: GenerateMatchesRequestDto): Promise<MatchCandidateDto[]>;
}
