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

/**
 * TenantContextMiddleware
 *
 * Extracts tenant context (orgId, userId, userRole) from authenticated user
 * and attaches it to the Express Request object for use in controllers/services.
 *
 * ARCHITECTURE NOTE:
 * This middleware does NOT use AsyncLocalStorage for automatic Prisma filtering.
 * Instead, services must explicitly pass orgId to their Prisma queries.
 *
 * This approach is:
 * - More explicit and auditable (every query shows org filter)
 * - Simpler to understand and maintain
 * - Less prone to context pollution bugs
 *
 * See docs/MULTI_TENANCY.md for full architecture explanation.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract user from JWT (already validated by JwtAuthGuard)
    const user = (req as any).user;

    if (user) {
      // Attach tenant context to request object for controllers/services to use
      req.orgId = user.orgId;
      req.userId = user.id || user.sub;
      req.userRole = user.role;
    }

    next();
  }
}
