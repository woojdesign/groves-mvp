import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { SamlService } from './saml.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth/saml')
export class SamlController {
  constructor(private samlService: SamlService) {}

  @Public()
  @Get('login')
  @UseGuards(AuthGuard('saml'))
  async samlLogin(@Req() req: Request) {
    // Redirects to IdP login page
  }

  @Public()
  @Post('callback')
  @UseGuards(AuthGuard('saml'))
  async samlCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (req as any).user;
    const result = await this.samlService.createSamlSession(user, res);

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/callback?success=true`);
  }

  @Public()
  @Get('metadata')
  async getMetadata(@Res() res: Response) {
    // Generate SAML service provider metadata for IdP configuration
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${process.env.SAML_ISSUER}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${process.env.SAML_CALLBACK_URL}"
        index="0" />
  </SPSSODescriptor>
</EntityDescriptor>`;

    res.set('Content-Type', 'application/xml');
    return res.send(metadata);
  }
}
