import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      orgId?: string;
      userId?: string;
      userRole?: string;
    }
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract user from JWT (already validated by JwtAuthGuard)
    const user = (req as any).user;

    if (user) {
      // Inject tenant context into request
      req.orgId = user.orgId;
      req.userId = user.id || user.sub;
      req.userRole = user.role;
    }

    next();
  }
}
