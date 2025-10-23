import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ORG_SCOPED_KEY } from '../decorators/org-scoped.decorator';

@Injectable()
export class OrgFilterInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isOrgScoped = this.reflector.get<boolean>(
      ORG_SCOPED_KEY,
      context.getHandler(),
    );

    if (isOrgScoped) {
      const request = context.switchToHttp().getRequest();

      // Verify orgId is present in request context
      if (!request.orgId) {
        throw new ForbiddenException('Organization context required');
      }

      // Interceptor ensures orgId is available for service layer
    }

    return next.handle();
  }
}
