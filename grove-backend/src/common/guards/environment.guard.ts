import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PRODUCTION_DISABLED_KEY } from '../decorators/production-disabled.decorator';

/**
 * EnvironmentGuard - Blocks access to routes in production environment
 *
 * Usage: Apply @ProductionDisabled() decorator to controllers or routes
 * that should only be accessible in development/staging environments.
 *
 * Example:
 * @Controller('admin/dev')
 * @ProductionDisabled()
 * export class DevController { ... }
 */
@Injectable()
export class EnvironmentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isProductionDisabled = this.reflector.getAllAndOverride<boolean>(
      PRODUCTION_DISABLED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isProductionDisabled) {
      // No environment restriction - allow access
      return true;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      throw new ForbiddenException(
        'This feature is disabled in production environment',
      );
    }

    return true;
  }
}
