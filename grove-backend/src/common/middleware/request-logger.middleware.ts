import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 *
 * Logs all HTTP requests with:
 * - HTTP method and URL
 * - Status code
 * - Response time
 * - Client IP address
 * - User agent
 * - Security events (401, 403) highlighted
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'Unknown';
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // Build log message
      const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms - IP: ${ip} - UA: ${userAgent}`;

      // Log with appropriate level based on status code
      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }

      // Highlight security events (authentication/authorization failures)
      if (statusCode === 401) {
        this.logger.warn(`🔒 Unauthorized access attempt: ${method} ${originalUrl} - IP: ${ip}`);
      } else if (statusCode === 403) {
        this.logger.warn(`🚫 Forbidden access attempt: ${method} ${originalUrl} - IP: ${ip}`);
      }
    });

    next();
  }
}
