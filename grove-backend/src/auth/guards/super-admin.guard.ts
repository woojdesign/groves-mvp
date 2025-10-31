import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * SuperAdminGuard - Restricts access to super admin users only
 * Used for dev/admin endpoints that should only be accessible by super admins
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Allow if user is super admin
    if (user && user.role === 'super_admin') {
      return true;
    }

    // For development/testing, allow in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    return false;
  }
}
