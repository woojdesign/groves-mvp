import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-saml';
import { SamlService } from '../saml/saml.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(
    private samlService: SamlService,
    private configService: ConfigService,
  ) {
    super({
      entryPoint: configService.get<string>('SAML_ENTRY_POINT') || '',
      issuer: configService.get<string>('SAML_ISSUER') || 'grove-mvp',
      callbackUrl: configService.get<string>('SAML_CALLBACK_URL') || '',
      cert: configService.get<string>('SAML_CERT') || '',
      acceptedClockSkewMs: 5000,
      identifierFormat:
        'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    });
  }

  async validate(profile: Profile): Promise<any> {
    const orgDomain = profile.email?.split('@')[1];
    if (!orgDomain) {
      throw new UnauthorizedException(
        'Email domain not found in SAML assertion',
      );
    }

    const user = await this.samlService.validateSamlUser(profile, orgDomain);
    return user;
  }
}
