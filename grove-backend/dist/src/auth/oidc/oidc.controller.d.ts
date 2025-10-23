import type { Request, Response } from 'express';
import { OidcService } from './oidc.service';
export declare class OidcController {
    private oidcService;
    constructor(oidcService: OidcService);
    oidcLogin(req: Request): Promise<void>;
    oidcCallback(req: Request, res: Response): Promise<void>;
}
