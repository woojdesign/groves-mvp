import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { SeedDataService } from './seed-data.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenaiModule } from '../openai/openai.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MatchingModule } from '../matching/matching.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    PrismaModule,
    OpenaiModule,
    ProfilesModule,
    MatchingModule,
    JobsModule,
  ],
  controllers: [DevController],
  providers: [DevService, SeedDataService],
  exports: [DevService],
})
export class DevModule {}
