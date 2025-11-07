import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DevService } from './dev.service';
import { PersonaGenerationJobPayload } from './persona-generation.job-types';

@Processor('persona-generation')
export class PersonaGenerationProcessor {
  private readonly logger = new Logger(PersonaGenerationProcessor.name);

  constructor(private readonly devService: DevService) {}

  @Process()
  async handle(job: Job<PersonaGenerationJobPayload>) {
    this.logger.log(
      `Starting persona generation job ${job.id} (template=${job.data.template}, count=${job.data.count})`,
    );

    try {
      await job.progress(5);
      const result = await this.devService.handlePersonaGenerationJob(job.data, job);
      this.logger.log(`Persona generation job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
      this.logger.error(`Persona generation job ${job.id} failed: ${message}`);
      throw error;
    }
  }
}


