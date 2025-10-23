import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/**
 * CSRF Guard to prevent Cross-Site Request Forgery attacks.
 *
 * Validates that the CSRF token in the request header matches
 * the token in the cookie for all non-GET requests.
 *
 * Skips validation for:
 * - Public routes (marked with @Public() decorator)
 * - GET requests (CSRF not needed for idempotent operations)
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    // Skip CSRF for public routes and GET requests
    if (isPublic || request.method === 'GET') {
      return true;
    }

    const csrfToken = request.headers['x-csrf-token'] as string;
    const csrfCookie = request.cookies['csrf-token'];

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
