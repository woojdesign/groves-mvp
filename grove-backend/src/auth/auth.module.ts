import { Module, DynamicModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SamlStrategy } from './strategies/saml.strategy';
import { OidcStrategy } from './strategies/oidc.strategy';
import { SamlService } from './saml/saml.service';
import { SamlController } from './saml/saml.controller';
import { OidcService } from './oidc/oidc.service';
import { OidcController } from './oidc/oidc.controller';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthConfig } from './auth.config';

@Module({})
export class AuthModule {
  static registerAsync(): DynamicModule {
    const providers: any[] = [
      AuthService,
      JwtStrategy,
    ];

    const controllers: any[] = [AuthController];

    // Conditionally add SAML
    if (AuthConfig.isSamlEnabled()) {
      console.log('✅ SAML authentication enabled');
      providers.push(SamlService, SamlStrategy);
      controllers.push(SamlController);
    } else {
      console.log('⚠️  SAML authentication disabled (not configured)');
    }

    // Conditionally add OIDC
    if (AuthConfig.isOidcEnabled()) {
      console.log('✅ OIDC authentication enabled');
      providers.push(OidcService, OidcStrategy);
      controllers.push(OidcController);
    } else {
      console.log('⚠️  OIDC authentication disabled (not configured)');
    }

    return {
      module: AuthModule,
      imports: [
        PassportModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const jwtSecret = config.get<string>('JWT_SECRET');

            // Validate JWT secret strength
            if (!jwtSecret || jwtSecret.length < 32) {
              throw new Error(
                'JWT_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32'
              );
            }

            // Prevent using default/example secrets
            if (jwtSecret.includes('CHANGE_ME') || jwtSecret.includes('your-super-secret')) {
              throw new Error(
                'JWT_SECRET cannot use default/example value. Generate with: openssl rand -base64 32'
              );
            }

            return {
              secret: jwtSecret,
              signOptions: { expiresIn: '15m' },
            };
          },
        }),
        EmailModule,
        PrismaModule,
      ],
      controllers,
      providers,
      exports: [AuthService],
    };
  }
}
