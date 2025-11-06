import { Module } from '@nestjs/common';
import { MetaPersonaService } from './meta-persona.service';

@Module({
  providers: [MetaPersonaService],
  exports: [MetaPersonaService],
})
export class MetaPersonasModule {}
