import type { Request, Response } from 'express';
import { SamlService } from './saml.service';
export declare class SamlController {
    private samlService;
    constructor(samlService: SamlService);
    samlLogin(req: Request): Promise<void>;
    samlCallback(req: Request, res: Response): Promise<void>;
    getMetadata(res: Response): Promise<Response<any, Record<string, any>>>;
}
