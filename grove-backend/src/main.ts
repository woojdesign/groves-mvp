import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Apply JWT guard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Set API prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Grove Backend API running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
}
bootstrap();
