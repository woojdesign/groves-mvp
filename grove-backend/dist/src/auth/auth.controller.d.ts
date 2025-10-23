import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    requestMagicLink(dto: MagicLinkRequestDto): Promise<{
        message: string;
        expiresIn: string;
    }>;
    verifyMagicLink(dto: VerifyTokenDto, res: Response, req: Request): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            hasCompletedOnboarding: boolean;
        };
    }>;
    getCsrfToken(res: Response): {
        csrfToken: string;
    };
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(user: any, res: Response, req: Request): Promise<{
        message: string;
    }>;
}
