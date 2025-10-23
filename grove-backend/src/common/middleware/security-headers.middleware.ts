import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 *
 * Adds comprehensive security headers to all responses:
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-XSS-Protection: Enable browser XSS filter
 * - Content-Security-Policy: Control resource loading
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Restrict browser features
 * - Strict-Transport-Security: Force HTTPS (production only)
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter in older browsers (legacy but harmless)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy
    // Restricts resources to same origin, inline styles allowed for React
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';",
    );

    // Referrer Policy
    // Only send origin when navigating to same origin
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    // Disable potentially dangerous browser features
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=()',
    );

    // HTTP Strict Transport Security (HSTS)
    // Only enable in production to force HTTPS
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    next();
  }
}
