import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { OidcService } from './oidc.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth/oidc')
export class OidcController {
  constructor(private oidcService: OidcService) {}

  @Public()
  @Get('login')
  @UseGuards(AuthGuard('oidc'))
  async oidcLogin(@Req() req: Request) {
    // Redirects to OIDC provider
  }

  @Public()
  @Get('callback')
  @UseGuards(AuthGuard('oidc'))
  async oidcCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (req as any).user;
    const result = await this.oidcService.createOidcSession(user, res);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/callback?success=true`);
  }
}
