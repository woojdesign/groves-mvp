import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model =
      this.configService.get<string>('OPENAI_MODEL') ||
      'text-embedding-3-small';

    if (!apiKey || apiKey === 'sk-placeholder') {
      this.logger.warn(
        'OpenAI API key not configured. Embeddings will fail until a valid key is provided.',
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-placeholder',
    });
  }

  /**
   * Generate an embedding vector for the given text using OpenAI API
   * @param text - The text to generate an embedding for
   * @returns The embedding vector (1536 dimensions for text-embedding-3-small)
   * @throws Error if the API call fails
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.debug(`Generating embedding for text (length: ${text.length})`);

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;
      const usage = response.usage;

      this.logger.log(
        `Embedding generated successfully. Tokens used: ${usage.total_tokens}, Dimensions: ${embedding.length}`,
      );

      return embedding;
    } catch (error) {
      // Handle rate limiting
      if (error.status === 429) {
        this.logger.error('OpenAI API rate limit exceeded', error.message);
        throw new Error(
          'Rate limit exceeded. Please try again in a few moments.',
        );
      }

      // Handle authentication errors
      if (error.status === 401) {
        this.logger.error('OpenAI API authentication failed', error.message);
        throw new Error('Invalid OpenAI API key');
      }

      // Handle other errors
      this.logger.error('Failed to generate embedding', error.message);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Preprocess and concatenate profile fields into a single text string
   * @param nicheInterest - The user's niche interest
   * @param project - The user's current project
   * @param rabbitHole - Optional rabbit hole the user is exploring
   * @returns Formatted text ready for embedding generation
   */
  preprocessProfileText(
    nicheInterest: string,
    project: string,
    rabbitHole?: string,
  ): string {
    const parts = [
      `Interest: ${nicheInterest.trim()}`,
      `Project: ${project.trim()}`,
    ];

    if (rabbitHole && rabbitHole.trim()) {
      parts.push(`Exploring: ${rabbitHole.trim()}`);
    }

    return parts.join('. ');
  }
}
