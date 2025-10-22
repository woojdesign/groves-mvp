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
    verifyMagicLink(dto: VerifyTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            hasCompletedOnboarding: boolean;
        };
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(user: any): Promise<{
        message: string;
    }>;
}
