import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
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
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
