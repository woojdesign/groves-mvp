import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 requests per 10 minutes
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(
    @Body() dto: VerifyTokenDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.verifyMagicLink(dto.token, res, req);
  }

  @Public()
  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const token = randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { csrfToken: token };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.logout(user.id, res, req);
  }
}
