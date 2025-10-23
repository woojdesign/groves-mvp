import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            orgId?: string;
            userId?: string;
            userRole?: string;
        }
    }
}
export declare class TenantContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
