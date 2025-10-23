import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Global exception filter for Prisma errors.
 * Prevents leaking database schema details in error responses.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Log the actual error for debugging (but don't expose to client)
    this.logger.error(
      `Prisma error ${exception.code} on ${request.method} ${request.url}`,
      exception.stack,
    );

    // Map Prisma errors to HTTP status codes without leaking schema details
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An error occurred while processing your request';

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        break;
      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'The requested record was not found';
        break;
      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
        break;
      case 'P2000':
        // Value too long for column
        status = HttpStatus.BAD_REQUEST;
        message = 'Input value is too long';
        break;
      case 'P2001':
        // Record not found in where condition
        status = HttpStatus.NOT_FOUND;
        message = 'The requested record was not found';
        break;
      case 'P2014':
        // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'The change violates a required relation';
        break;
      case 'P2015':
        // Related record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Related record not found';
        break;
      default:
        // For unknown errors, don't leak internal details
        this.logger.error(
          `Unhandled Prisma error code: ${exception.code}`,
          exception,
        );
        message = 'An error occurred while processing your request';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
