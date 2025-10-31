import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../openai/openai.service';
import { SeedDataService } from './seed-data.service';
import { GeneratePresetDto } from './dto/generate-preset.dto';
import { GenerateCustomDto } from './dto/generate-custom.dto';
import { CreateManualPersonaDto } from './dto/create-manual-persona.dto';
import { BulkUploadDto } from './dto/bulk-upload.dto';
import {
  PersonaResponse,
  GeneratePersonasResponse,
} from './dto/persona-response.dto';
import { EmbeddingJobPayload } from '../jobs/embedding-generation.processor';

/**
 * DevService - Business logic for test persona generation and management
 *
 * Responsibilities:
 * - Generate test personas using AI
 * - Create users/profiles with isTestData flag
 * - Query embedding status
 * - Preview matches (dev personas only)
 * - Delete and export test data
 */
@Injectable()
export class DevService {
  private readonly logger = new Logger(DevService.name);

  constructor(
    private prisma: PrismaService,
    private openaiService: OpenaiService,
    private seedDataService: SeedDataService,
    @InjectQueue('embedding-generation')
    private embeddingQueue: Queue<EmbeddingJobPayload>,
  ) {}

  /**
   * Generate personas from preset templates
   */
  async generatePreset(
    dto: GeneratePresetDto,
    orgId: string,
  ): Promise<GeneratePersonasResponse> {
    this.logger.log(`Generating personas from preset template: ${dto.template}`);

    const config = this.getPresetConfig(dto.template);

    // Generate personas in a single batch for efficiency
    const personas = await this.generatePersonaBatch(
      config.count,
      config.intensityLevel,
      config.categories,
    );

    // Create all personas in database
    const created = await this.createPersonas(personas, orgId);

    return {
      success: true,
      count: created.length,
      personas: created,
      message: `Successfully generated ${created.length} ${dto.template} personas`,
    };
  }

  /**
   * Generate personas with custom parameters
   */
  async generateCustom(
    dto: GenerateCustomDto,
    orgId: string,
  ): Promise<GeneratePersonasResponse> {
    this.logger.log(
      `Generating ${dto.count} custom personas with intensity levels: ${dto.intensityLevels.join(', ')}`,
    );

    const personas: CreateManualPersonaDto[] = [];

    // If multiple intensity levels, generate batches per level
    // Otherwise generate single batch
    if (dto.intensityLevels.length > 1) {
      // Distribute personas across intensity levels
      const distribution = this.distributeCount(
        dto.count,
        dto.intensityLevels.length,
      );

      for (let i = 0; i < dto.intensityLevels.length; i++) {
        const intensityLevel = dto.intensityLevels[i];
        const count = distribution[i];

        const batch = await this.generatePersonaBatch(
          count,
          intensityLevel,
          dto.categories,
          dto.customPrompt,
        );
        personas.push(...batch);
      }
    } else {
      // Single intensity level - one batch
      const personas = await this.generatePersonaBatch(
        dto.count,
        dto.intensityLevels[0],
        dto.categories,
        dto.customPrompt,
      );
      return {
        success: true,
        count: personas.length,
        personas: await this.createPersonas(personas, orgId),
        message: `Successfully generated ${personas.length} custom personas`,
      };
    }

    // Create all personas in database
    const created = await this.createPersonas(personas, orgId);

    return {
      success: true,
      count: created.length,
      personas: created,
      message: `Successfully generated ${created.length} custom personas`,
    };
  }

  /**
   * Create a single manual persona
   */
  async createManual(
    dto: CreateManualPersonaDto,
    orgId: string,
  ): Promise<PersonaResponse> {
    this.logger.log(`Creating manual persona: ${dto.email}`);

    const personas = await this.createPersonas([dto], orgId);
    return personas[0];
  }

  /**
   * Bulk upload personas from JSON/CSV
   */
  async bulkUpload(
    dto: BulkUploadDto,
    orgId: string,
  ): Promise<GeneratePersonasResponse> {
    this.logger.log(`Bulk uploading ${dto.personas.length} personas`);

    const created = await this.createPersonas(dto.personas, orgId);

    return {
      success: true,
      count: created.length,
      personas: created,
      message: `Successfully uploaded ${created.length} personas`,
    };
  }

  /**
   * Helper: Get preset template configuration
   */
  private getPresetConfig(template: string): {
    count: number;
    intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed';
    categories?: string[];
  } {
    const configs = {
      casual_10: { count: 10, intensityLevel: 'casual' as const },
      engaged_10: { count: 10, intensityLevel: 'engaged' as const },
      deep_10: { count: 10, intensityLevel: 'deep' as const },
      mixed_10: { count: 10, intensityLevel: 'mixed' as const },
      diverse_50: {
        count: 50,
        intensityLevel: 'mixed' as const,
        categories: [
          'Creative',
          'Tech',
          'Outdoor',
          'Food',
          'Wellness',
          'Maker',
        ],
      },
    };

    return configs[template];
  }

  /**
   * Helper: Generate multiple personas in a single batch using seed data
   */
  private async generatePersonaBatch(
    count: number,
    intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
    categories?: string[],
    customPrompt?: string,
  ): Promise<CreateManualPersonaDto[]> {
    this.logger.log(`Generating batch of ${count} personas with ${intensityLevel} intensity`);

    // Optimal sub-batch size for quality (10 personas per API call)
    const SUB_BATCH_SIZE = 10;

    // Get all diverse names and interests from seed data upfront
    const allNames = this.seedDataService.getRandomNames(count);
    const allInterests = this.seedDataService.getRandomInterests(count, categories);

    // If count <= SUB_BATCH_SIZE, generate in one go
    if (count <= SUB_BATCH_SIZE) {
      return this.generateSubBatch(
        allNames,
        allInterests,
        intensityLevel,
        customPrompt,
        [],
      );
    }

    // Split into sub-batches for better quality
    this.logger.log(`Splitting into sub-batches of ${SUB_BATCH_SIZE} for optimal quality`);
    const allPersonas: CreateManualPersonaDto[] = [];
    const usedPhrases: Set<string> = new Set();

    for (let i = 0; i < count; i += SUB_BATCH_SIZE) {
      const subBatchSize = Math.min(SUB_BATCH_SIZE, count - i);
      const subNames = allNames.slice(i, i + subBatchSize);
      const subInterests = allInterests.slice(i, i + subBatchSize);

      this.logger.log(`Generating sub-batch ${Math.floor(i / SUB_BATCH_SIZE) + 1}/${Math.ceil(count / SUB_BATCH_SIZE)} (${subBatchSize} personas)`);

      try {
        const subBatch = await this.generateSubBatch(
          subNames,
          subInterests,
          intensityLevel,
          customPrompt,
          Array.from(usedPhrases),
        );
        allPersonas.push(...subBatch);

        // Extract common phrases from this sub-batch to avoid in next batch
        this.extractCommonPhrases(subBatch, usedPhrases);
      } catch (error) {
        this.logger.error(`Sub-batch ${Math.floor(i / SUB_BATCH_SIZE) + 1} failed: ${error.message}`);
        // Add fallback personas for this sub-batch
        const fallbackPersonas = subNames.map((name, idx) => ({
          name: name.fullName,
          email: `dev-persona-${Math.floor(10000 + Math.random() * 90000)}@test.grove.test`,
          interests: `I'm interested in ${subInterests[idx] || 'various hobbies'}`,
          project: 'Exploring this interest in my free time',
          connectionType: 'friendship' as const,
          preferences: 'Flexible on meeting times',
        }));
        allPersonas.push(...fallbackPersonas);
      }
    }

    this.logger.log(`Anti-pattern tracking: avoided ${usedPhrases.size} repeated phrases across batches`);
    return allPersonas;
  }

  /**
   * Extract common phrase patterns from generated personas to avoid repetition
   */
  private extractCommonPhrases(personas: CreateManualPersonaDto[], usedPhrases: Set<string>): void {
    const patterns = [
      /^(I (?:dabble|mess around|tinker) (?:in|with))/i,
      /^(I've been (?:into|learning|exploring|getting into))/i,
      /^(I (?:like|love|enjoy|really enjoy))/i,
      /^(I'm (?:passionate about|interested in|a (?:big )?fan of|into))/i,
      /^(Been into)/i,
      /^(Pretty new to)/i,
      /(capturing candid moments)/i,
      /(It's (?:relaxing|rewarding|fascinating|challenging))/i,
    ];

    for (const persona of personas) {
      const text = persona.interests?.toLowerCase() || '';
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          usedPhrases.add(match[1].toLowerCase());
        }
      }
    }
  }

  /**
   * Helper: Generate a sub-batch of personas (internal use)
   */
  private async generateSubBatch(
    names: Array<{ fullName: string }>,
    interests: string[],
    intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
    customPrompt?: string,
    avoidPhrases: string[] = [],
  ): Promise<CreateManualPersonaDto[]> {
    // Build seed-constrained prompt
    const prompt = this.buildSeedConstrainedPrompt(
      names,
      interests,
      intensityLevel,
      customPrompt,
      avoidPhrases,
    );

    try {
      // Use OpenAI to generate natural language descriptions
      const result = await this.openaiService.generatePersonaContent(prompt);

      // Parse result - should be array of personas
      const personas = Array.isArray(result) ? result : result.personas || [result];

      return personas.map((p, i) => ({
        name: p.name || names[i]?.fullName || `Person ${i}`,
        email: p.email || `dev-persona-${Math.floor(10000 + Math.random() * 90000)}@test.grove.test`,
        interests: p.interests || interests[i] || 'General interests',
        project: p.project || 'Working on personal projects',
        connectionType: p.connectionType || 'friendship',
        deepDive: p.deepDive,
        preferences: p.preferences,
      }));
    } catch (error) {
      this.logger.error(`Sub-batch generation failed: ${error.message}`);
      throw error; // Re-throw so parent can handle with fallback
    }
  }

  /**
   * Helper: Generate a single persona using AI
   */
  private async generateSinglePersona(
    intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
    categories?: string[],
    customPrompt?: string,
  ): Promise<CreateManualPersonaDto> {
    // Use batch generation with count=1
    const batch = await this.generatePersonaBatch(1, intensityLevel, categories, customPrompt);
    return batch[0];
  }

  /**
   * Helper: Build seed-constrained prompt for batch generation
   */
  private buildSeedConstrainedPrompt(
    names: Array<{ fullName: string }>,
    interests: string[],
    intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
    customPrompt?: string,
    avoidPhrases: string[] = [],
  ): string {
    if (customPrompt) {
      return customPrompt;
    }

    const intensityGuide = {
      casual: 'Casual, not obsessed. Simple language. E.g., "I enjoy X on weekends"',
      engaged: 'Actively pursuing, moderate depth. E.g., "Training for X", "Learning Y"',
      deep: 'Deep expertise with technical details. E.g., "Restoring vintage X", "Mastering Y technique"',
      mixed: 'Mix of casual (40%), engaged (40%), and deep (20%)',
    };

    const personaList = names.map((name, i) => `- ${name.fullName}: ${interests[i]}`).join('\n');

    const avoidSection = avoidPhrases.length > 0
      ? `\nIMPORTANT - AVOID THESE OVERUSED PHRASES (already used in previous batches):
${avoidPhrases.map(p => `- "${p}"`).join('\n')}

Use completely different sentence structures and vocabulary. Be creative!\n`
      : '';

    return `Generate realistic employee profiles for these ${names.length} people with these pre-assigned interests.
${avoidSection}

ASSIGNED NAMES & INTERESTS:
${personaList}

INTENSITY LEVEL: ${intensityGuide[intensityLevel]}

CRITICAL RULES:
- Use the EXACT names provided above
- Base each persona on their assigned interest
- Write in FIRST PERSON ("I enjoy", "I'm learning", not "they enjoy")
- BE REALISTIC: Not everyone is super passionate or deeply invested - some people are casual hobbyists and that's fine!
- Vary the connection types across the batch
- Generate unique 5-digit numbers for emails
- Give each person their own voice - some people are enthusiastic, some are low-key, some are just getting started

LENGTH VARIANCE (CRITICAL - mix these within the batch):
- BRIEF (20-50 chars): ~20% of personas - Minimal effort. E.g., "I like painting."
- SHORT (60-100 chars): ~30% of personas - Basic info. E.g., "I've been into gardening for a couple years now."
- MEDIUM (120-180 chars): ~30% of personas - Moderate detail. E.g., "I've been restoring vintage motorcycles for 5 years. Started with a 1972 Honda CB350 and got hooked on the mechanical intricacy."
- LONG (200-300 chars): ~15% of personas - Very detailed, earnest. Someone really trying to engage and find connections.
- VERY LONG (300-400 chars): ~5% of personas - Super detailed, passionate. These people REALLY want to connect with the right person.

DO NOT make all descriptions the same length. The variation is important! Include at least a few truly long, earnest descriptions from people who are genuinely invested in finding connections.

TONE VARIETY (mix these naturally - use DIFFERENT structures for each person):
- Casual/chill: "Started trying X recently", "Got introduced to X through a friend"
- Matter-of-fact: "X is my weekend thing", "Picked up X a few years back"
- Enthusiastic: "Can't get enough of X these days!", "X has opened up a whole new world for me"
- Understated: "X is something I do", "X keeps me occupied"
- Creative: "My mornings start with X", "X is how I decompress after work"
- Time-based: "Five years into X and still discovering new things", "Just hit my 6-month mark with X"

Return a JSON array with ${names.length} objects, each with:
- name: Use EXACT name from list above
- email: dev-persona-[unique-5-digit-number]@test.grove.test
- interests: First-person description of their interests (plural encouraged!) with UNIQUE voice (50-200 chars, conversational and specific). Can mention multiple interests naturally.
- project: What they're currently working on - be specific! (50-200 chars)
- connectionType: "collaboration" | "mentorship" | "friendship" | "knowledge_exchange"
- deepDive: (optional) What they're diving deep into right now - add this for engaged/deep intensity
- preferences: (optional) Meeting preferences - be specific about times/formats

Example format - notice the EXTREME LENGTH VARIANCE (brief → very long):
{
  "personas": [
    {
      "name": "Sarah Chen",
      "email": "dev-persona-67215@test.grove.test",
      "interests": "Hiking and photography.",
      "project": "Local trails",
      "connectionType": "friendship"
    },
    {
      "name": "Marcus Johnson",
      "email": "dev-persona-48392@test.grove.test",
      "interests": "I like cooking and watching food documentaries. Trying new pasta recipes lately.",
      "project": "Perfecting carbonara",
      "connectionType": "friendship"
    },
    {
      "name": "Lisa Park",
      "email": "dev-persona-52817@test.grove.test",
      "interests": "Started guitar and songwriting a few months ago. Still working on basic chords but enjoying the learning process.",
      "project": "Working through beginner song book",
      "connectionType": "knowledge_exchange"
    },
    {
      "name": "David Kim",
      "email": "dev-persona-83921@test.grove.test",
      "interests": "I've been into classic cars and automotive history for years. Restoring a 1967 Mustang in my garage has been an incredible journey learning mechanical systems from scratch, sourcing authentic parts, and understanding the engineering philosophy of that era. Also enjoy vintage racing documentaries.",
      "project": "Currently rebuilding the engine block and tracking down an original carburetor. Also documenting the entire process for other enthusiasts.",
      "connectionType": "mentorship",
      "deepDive": "Deep diving into period-correct restoration techniques and connecting with the vintage Mustang community",
      "preferences": "Love to meet on weekends at car shows or over coffee to talk shop. Always happy to help newcomers to the hobby."
    },
    {
      "name": "Priya Sharma",
      "email": "dev-persona-82471@test.grove.test",
      "interests": "Birdwatching has completely changed how I experience nature. What started three years ago as a casual weekend activity has evolved into this beautiful practice of patience, observation, and connection with the environment. I've documented over 150 species across different habitats - from urban parks to remote wetlands. There's something meditative about waiting in stillness for that perfect moment when a rare species appears. I'm particularly fascinated by migration patterns and have been tracking seasonal changes in our local bird populations. Would love to connect with others who share this passion or are curious about getting started.",
      "project": "Currently working on a photo journal documenting year-round bird diversity in urban environments and mentoring newcomers through our local Audubon chapter",
      "connectionType": "collaboration",
      "deepDive": "Studying the impact of climate change on migratory bird patterns and participating in citizen science projects",
      "preferences": "Happy to do early morning birding walks, virtual coffee chats about field techniques, or just share tips and sightings. I'm usually free on weekends and some weekday mornings."
    }
  ]
}`;
  }

  /**
   * Helper: Build AI prompt based on intensity level (legacy, for single generation)
   */
  private buildPersonaPrompt(
    intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
    categories?: string[],
  ): string {
    const intensityGuide = {
      casual:
        'Casual interest level - common hobbies without deep expertise (e.g., "I enjoy hiking on weekends", "Getting into cooking"). Keep it simple and relatable.',
      engaged:
        'Engaged interest level - active pursuit with moderate depth (e.g., "Training for a half marathon", "Learning to make pasta from scratch"). Show commitment but not obsession.',
      deep:
        'Deep niche expertise - specialized knowledge with technical depth (e.g., "Restoring vintage Soviet cameras", "Maintaining three sourdough starters"). Include specific techniques, equipment, or methodologies.',
      mixed:
        'Mixed intensity - randomly choose between casual (40%), engaged (40%), or deep (20%) interest levels for variety.',
    };

    const categoriesStr = categories?.length
      ? `Focus on these categories: ${categories.join(', ')}.`
      : 'Choose from diverse categories: Creative arts, Tech, Outdoor, Food, Wellness, Maker culture, Sports, Music, Gaming, Reading, DIY, Collecting, etc.';

    return `Generate a realistic employee profile for a connection-matching platform.

${intensityGuide[intensityLevel]}

${categoriesStr}

IMPORTANT INSTRUCTIONS:
- Use DIVERSE names: Mix of ethnicities, avoid clustering on "A" names or "Patel" surnames. Use names like: Emily, Marcus, Sofia, James, Yuki, Carlos, etc.
- Write in FIRST PERSON (use "I", "my", "me") - NOT third person. Example: "I love baking" not "They love baking"
- VARY the interests widely - don't cluster around sustainability/urban gardening/tech
- Include mundane hobbies too: watching shows, walking dogs, weekend trips, casual gaming
- Make some people less interesting - not everyone has a fascinating hobby
- Use natural, conversational language

EXAMPLES OF GOOD FIRST-PERSON WRITING:
- "I've been getting into baking sourdough on weekends. Still figuring out the starter thing."
- "Building mechanical keyboards with custom switches. Deep into the ergo split keyboard world."
- "I watch a lot of cooking shows and try to recreate recipes. Hit or miss results!"
- "I really like mechanical engineering - it's really useful in working on cars. But on the side I spend a bunch of time birdwatching because nature is important."

Return a JSON object with these fields:
- name: Full name (DIVERSE names, avoid "A" clustering, mix ethnicities)
- email: Unique email (use format: dev-persona-[5-digit-random]@test.grove.test)
- interests: Interests (plural encouraged!) in FIRST PERSON - can naturally mention multiple things they're finding interesting (50-500 chars)
- project: Current project/goal in FIRST PERSON (50-500 chars)
- connectionType: One of: "collaboration", "mentorship", "friendship", "knowledge_exchange"
- deepDive: (optional) What they're exploring in FIRST PERSON (max 500 chars)
- preferences: (optional) Meeting preferences in FIRST PERSON (max 500 chars)

Make it feel authentic - real people have varied interests and commitment levels. Not everyone is passionate about sustainability or tech.`;
  }

  /**
   * Helper: Generate persona using AI with custom prompt
   */
  private async generatePersonaWithCustomPrompt(
    customPrompt: string,
  ): Promise<CreateManualPersonaDto> {
    try {
      const persona = await this.openaiService.generatePersonaContent(customPrompt);
      const uuid = Math.random().toString(36).substring(7);

      return {
        name: persona.name || `Generated ${uuid}`,
        email: persona.email || `dev-persona-${uuid}@test.grove.test`,
        interests: persona.interests || 'AI-generated interest',
        project: persona.project || 'AI-generated project',
        connectionType: persona.connectionType || 'collaboration',
        deepDive: persona.deepDive,
        preferences: persona.preferences,
      };
    } catch (error) {
      this.logger.error(`Failed to generate persona with custom prompt: ${error.message}`);
      // Fallback to mock
      const uuid = Math.random().toString(36).substring(7);
      return {
        name: `Test Persona ${uuid}`,
        email: `dev-persona-${uuid}@test.grove.test`,
        interests: 'Custom generated interest from prompt',
        project: 'Custom generated project',
        connectionType: 'collaboration',
        deepDive: 'Custom rabbit hole',
        preferences: 'Flexible schedule',
      };
    }
  }

  /**
   * Helper: Generate persona using AI
   */
  private async generatePersonaWithAI(
    prompt: string,
  ): Promise<CreateManualPersonaDto> {
    try {
      // Use OpenAI to generate persona content
      const persona = await this.openaiService.generatePersonaContent(prompt);
      const uuid = Math.random().toString(36).substring(7);

      return {
        name: persona.name || `Generated ${uuid}`,
        email: persona.email || `dev-persona-${uuid}@test.grove.test`,
        interests: persona.interests || 'AI-generated interest',
        project: persona.project || 'AI-generated project',
        connectionType: persona.connectionType || 'collaboration',
        deepDive: persona.deepDive,
        preferences: persona.preferences,
      };
    } catch (error) {
      this.logger.error(`Failed to generate persona with AI: ${error.message}`);
      // Fallback to mock persona
      const mockPersona = await this.openaiService.generatePersonaContent('');
      return {
        name: mockPersona.name,
        email: mockPersona.email,
        interests: mockPersona.interests,
        project: mockPersona.project,
        connectionType: mockPersona.connectionType,
        deepDive: mockPersona.deepDive,
        preferences: mockPersona.preferences,
      };
    }
  }

  /**
   * Helper: Create multiple personas in database
   */
  private async createPersonas(
    personas: CreateManualPersonaDto[],
    orgId: string,
  ): Promise<PersonaResponse[]> {
    const created: PersonaResponse[] = [];

    for (const persona of personas) {
      // Check if email already exists
      const existing = await this.prisma.user.findUnique({
        where: { email: persona.email },
      });

      if (existing) {
        this.logger.warn(`Persona with email ${persona.email} already exists, skipping`);
        continue;
      }

      // Create user with isTestData flag
      const user = await this.prisma.user.create({
        data: {
          email: persona.email,
          name: persona.name,
          orgId,
          role: 'user',
          status: 'active',
          isTestData: true, // Critical: Mark as test data
        },
      });

      // Create profile with isTestData flag
      const profile = await this.prisma.profile.create({
        data: {
          userId: user.id,
          interests: persona.interests,
          project: persona.project,
          connectionType: persona.connectionType,
          deepDive: persona.deepDive,
          preferences: persona.preferences,
          isTestData: true, // Critical: Mark as test data
        },
      });

      // Queue embedding generation
      await this.embeddingQueue.add(
        {
          userId: user.id,
          profileId: profile.id,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      this.logger.log(`Created test persona: ${persona.email} (User ID: ${user.id})`);

      // Check embedding status
      const embedding = await this.prisma.embedding.findUnique({
        where: { userId: user.id },
      });

      created.push({
        id: user.id,
        name: user.name,
        email: user.email,
        interests: profile.interests,
        project: profile.project,
        connectionType: profile.connectionType,
        deepDive: profile.deepDive || undefined,
        preferences: profile.preferences || undefined,
        embeddingStatus: embedding ? 'generated' : 'pending',
        createdAt: user.createdAt,
      });
    }

    return created;
  }

  /**
   * List all test personas with embedding status
   */
  async listPersonas(orgId: string): Promise<PersonaResponse[]> {
    this.logger.log('Listing all test personas');

    const users = await this.prisma.user.findMany({
      where: {
        orgId,
        isTestData: true,
      },
      include: {
        profile: true,
        embedding: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      interests: user.profile?.interests || '',
      project: user.profile?.project || '',
      connectionType: user.profile?.connectionType || '',
      deepDive: user.profile?.deepDive || undefined,
      preferences: user.profile?.preferences || undefined,
      embeddingStatus: user.embedding ? 'generated' : 'pending',
      createdAt: user.createdAt,
    }));
  }

  /**
   * Get detailed embedding status for a persona
   */
  async getEmbeddingStatus(userId: string) {
    const embedding = await this.prisma.embedding.findUnique({
      where: { userId },
    });

    if (!embedding) {
      return {
        status: 'pending',
        message: 'Embedding generation is queued',
      };
    }

    return {
      status: 'generated',
      dimensions: 1536,
      createdAt: embedding.createdAt,
      interestsText: embedding.interestsText,
    };
  }

  /**
   * Preview potential matches for a dev persona (dev-only matching)
   */
  async previewMatches(userId: string, limit: number = 10) {
    this.logger.log(`Previewing matches for persona ${userId}`);

    // Get the user's embedding
    const userEmbedding = await this.prisma.embedding.findUnique({
      where: { userId },
    });

    if (!userEmbedding) {
      return {
        userId,
        matches: [],
        message: 'No embedding found. Embedding must be generated first.',
      };
    }

    // Find similar test personas using cosine similarity
    // Note: This uses raw SQL with pgvector for similarity search
    const matches = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        name: string;
        email: string;
        niche_interest: string;
        similarity_score: number;
      }>
    >`
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        p.niche_interest,
        1 - (e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id = ${userId})) as similarity_score
      FROM users u
      INNER JOIN profiles p ON p.user_id = u.id
      INNER JOIN embeddings e ON e.user_id = u.id
      WHERE u.id != ${userId}
        AND u.is_test_data = true
        AND u.status = 'active'
      ORDER BY e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id = ${userId})
      LIMIT ${limit}
    `;

    return {
      userId,
      matches: matches.map((match) => ({
        userId: match.user_id,
        name: match.name,
        email: match.email,
        interests: match.niche_interest,
        similarityScore: Number(match.similarity_score.toFixed(4)),
      })),
    };
  }

  /**
   * Delete a single test persona
   */
  async deletePersona(userId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting test persona ${userId}`);

    // Verify it's test data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.isTestData) {
      return {
        success: false,
        message: 'Cannot delete: User is not test data',
      };
    }

    // Delete user (cascades to profile, embedding, matches, etc.)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`Deleted test persona ${userId}`);

    return {
      success: true,
      message: `Successfully deleted persona ${user.email}`,
    };
  }

  /**
   * Delete all test personas for an org
   */
  async deleteAllPersonas(orgId: string): Promise<{ success: boolean; count: number; message: string }> {
    this.logger.log(`Deleting all test personas for org ${orgId}`);

    const result = await this.prisma.user.deleteMany({
      where: {
        orgId,
        isTestData: true,
      },
    });

    this.logger.log(`Deleted ${result.count} test personas`);

    return {
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} test personas`,
    };
  }

  /**
   * Export all test personas as JSON
   */
  async exportPersonas(orgId: string) {
    this.logger.log(`Exporting test personas for org ${orgId}`);

    const personas = await this.listPersonas(orgId);

    return {
      exportedAt: new Date().toISOString(),
      count: personas.length,
      personas: personas.map((p) => ({
        name: p.name,
        email: p.email,
        interests: p.interests,
        project: p.project,
        connectionType: p.connectionType,
        deepDive: p.deepDive,
        preferences: p.preferences,
        embeddingStatus: p.embeddingStatus,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Helper: Distribute count across N categories
   */
  private distributeCount(total: number, categories: number): number[] {
    const base = Math.floor(total / categories);
    const remainder = total % categories;
    const distribution = Array(categories).fill(base);

    // Distribute remainder
    for (let i = 0; i < remainder; i++) {
      distribution[i]++;
    }

    return distribution;
  }
}
