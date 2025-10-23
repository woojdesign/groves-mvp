import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-openidconnect';
import { OidcService } from '../oidc/oidc.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private oidcService: OidcService,
    private configService: ConfigService,
  ) {
    const oidcIssuer = configService.get<string>('OIDC_ISSUER') || '';
    super({
      issuer: oidcIssuer,
      authorizationURL: `${oidcIssuer}/authorize`,
      tokenURL: `${oidcIssuer}/token`,
      userInfoURL: `${oidcIssuer}/userinfo`,
      clientID: configService.get<string>('OIDC_CLIENT_ID') || '',
      clientSecret: configService.get<string>('OIDC_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('OIDC_CALLBACK_URL') || '',
      scope:
        configService.get<string>('OIDC_SCOPE') || 'openid profile email',
    });
  }

  async validate(
    issuer: string,
    profile: any,
    context: any,
    idToken: any,
    accessToken: any,
    refreshToken: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const email = profile.emails?.[0]?.value || profile.email;
      if (!email) {
        return done(
          new UnauthorizedException('Email not found in OIDC profile'),
          undefined,
        );
      }

      const orgDomain = email.split('@')[1];
      const user = await this.oidcService.validateOidcUser(profile, orgDomain);
      return done(null, user);
    } catch (error) {
      return done(error, undefined);
    }
  }
}
