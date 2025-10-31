import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model =
      this.configService.get<string>('OPENAI_MODEL') ||
      'text-embedding-3-small';

    this.isConfigured = !(!apiKey || apiKey === 'sk-placeholder' || apiKey.includes('placeholder'));

    if (!this.isConfigured) {
      this.logger.warn(
        'OpenAI API key not configured. Using mock embeddings for development.',
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
    // Return mock embedding if OpenAI is not configured (for development)
    if (!this.isConfigured) {
      this.logger.debug(`Using mock embedding for development (text length: ${text.length})`);
      // Return a deterministic mock embedding based on text hash
      const hash = this.simpleHash(text);
      return this.generateMockEmbedding(hash);
    }

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
   * Generate a simple hash from a string
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate a deterministic mock embedding for development
   * Returns a 1536-dimensional vector (same as text-embedding-3-small)
   */
  private generateMockEmbedding(seed: number): number[] {
    const dimensions = 1536;
    const embedding: number[] = [];

    // Use seed to generate deterministic but varied values
    let random = seed;
    for (let i = 0; i < dimensions; i++) {
      random = (random * 1103515245 + 12345) & 0x7fffffff;
      embedding.push((random / 0x7fffffff) * 2 - 1); // Normalize to [-1, 1]
    }

    // Normalize to unit vector (like real embeddings)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
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

  /**
   * Generate persona content using GPT-4
   * @param prompt - The prompt to generate persona content
   * @returns Generated persona as JSON object
   */
  async generatePersonaContent(prompt: string): Promise<any> {
    // Return mock persona if OpenAI is not configured
    if (!this.isConfigured) {
      this.logger.debug('Using mock persona for development (OpenAI not configured)');
      return this.generateMockPersona();
    }

    try {
      this.logger.debug('Generating persona content with GPT-4o');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // gpt-4o supports JSON mode, gpt-4 does not
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 1.0, // Higher temperature for more diverse interpretations
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      const persona = JSON.parse(content);

      this.logger.log('Persona content generated successfully');
      return persona;
    } catch (error) {
      // Handle errors gracefully by falling back to mock
      this.logger.warn(`Failed to generate persona with OpenAI: ${error.message}. Using mock persona.`);
      return this.generateMockPersona();
    }
  }

  /**
   * Generate a mock persona for development
   */
  private generateMockPersona(): any {
    const uuid = Math.random().toString(36).substring(7);
    const templates = [
      {
        name: 'Marcus Johnson',
        nicheInterest: 'I watch a lot of cooking shows and try to recreate the recipes. Hit or miss results but it\'s fun!',
        project: 'Working through basics like knife skills and trying to nail down a good pasta carbonara',
        connectionType: 'friendship',
        preferences: 'Casual coffee chats work great for me',
      },
      {
        name: 'Emily Rodriguez',
        nicheInterest: 'Getting into film photography with a thrifted Canon AE-1. Love the unpredictability.',
        project: 'Shooting a roll of film every month and learning to develop at home',
        connectionType: 'friendship',
        preferences: 'Down for photo walks on weekends',
      },
      {
        name: 'David Chen',
        nicheInterest: 'Building mechanical keyboards with custom switches. Deep into the ergo split keyboard world.',
        project: 'Designing my first split keyboard with hot-swappable switches and QMK firmware',
        connectionType: 'collaboration',
        rabbitHole: 'Learning about switch characteristics, PCB design, and optimal thumb cluster layouts',
        preferences: 'Love geeking out over keyboards! Remote chats anytime.',
      },
      {
        name: 'Sofia Martinez',
        nicheInterest: 'I collect vintage vinyl records, mostly 70s and 80s rock. The hunt for rare albums is addicting.',
        project: 'Building a proper listening setup with decent speakers and finally organizing my collection',
        connectionType: 'knowledge_exchange',
        rabbitHole: 'Learning about pressing quality and different editions',
        preferences: 'Happy to swap recommendations! Evenings work best.',
      },
      {
        name: 'James Wilson',
        nicheInterest: 'I play video games casually, mostly indie games and roguelikes. Nothing too intense.',
        project: 'Trying to beat Hades without looking up guides',
        connectionType: 'friendship',
        preferences: 'Remote hangouts, flexible on time',
      },
      {
        name: 'Yuki Tanaka',
        nicheInterest: 'I\'ve been getting into baking sourdough on weekends. Still figuring out the whole starter thing.',
        project: 'Trying to get consistent results with my weekend loaves',
        connectionType: 'knowledge_exchange',
        rabbitHole: 'Reading about different flour types and hydration percentages',
        preferences: 'Weekend coffee chats work best!',
      },
      {
        name: 'Carlos Santos',
        nicheInterest: 'Running 5Ks and slowly working up to a 10K. Not fast but consistent.',
        project: 'Training for my first official 10K race in the spring',
        connectionType: 'friendship',
        preferences: 'Morning runs or coffee after work',
      },
      {
        name: 'Priya Singh',
        nicheInterest: 'Reading fantasy novels, especially Brandon Sanderson. I go through books way too fast.',
        project: 'Working through my massive TBR pile and trying not to buy more books (failing)',
        connectionType: 'friendship',
        rabbitHole: 'Tracking series timelines and fan theories',
        preferences: 'Book club vibes, lunch or coffee works',
      },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];

    return {
      ...template,
      name: template.name,
      email: `dev-persona-${Math.floor(10000 + Math.random() * 90000)}@test.grove.test`,
    };
  }
}
