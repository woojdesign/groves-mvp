import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'embedding-generation',
    }),
    EmbeddingsModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
