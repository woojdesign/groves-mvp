import { IntrosService } from './intros.service';
import { IntroResponseDto } from './dto/intro-response.dto';
export declare class IntrosController {
    private readonly introsService;
    constructor(introsService: IntrosService);
    getIntros(user: {
        id: string;
        email: string;
    }): Promise<{
        intros: IntroResponseDto[];
    }>;
}
