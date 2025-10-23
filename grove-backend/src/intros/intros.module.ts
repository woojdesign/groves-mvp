import { Module } from '@nestjs/common';
import { IntrosService } from './intros.service';
import { IntrosController } from './intros.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [IntrosService],
  controllers: [IntrosController],
  exports: [IntrosService],
})
export class IntrosModule {}
