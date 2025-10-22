import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create or update an embedding for a user
   * Uses raw SQL because Prisma doesn't natively support pgvector type
   * @param userId - The user ID
   * @param vector - The embedding vector (1536 dimensions)
   * @returns The created/updated embedding record
   */
  async createEmbedding(userId: string, vector: number[]): Promise<any> {
    try {
      this.logger.debug(
        `Storing embedding for user ${userId} (${vector.length} dimensions)`,
      );

      // Convert vector to pgvector format: [1,2,3,...]
      const vectorString = `[${vector.join(',')}]`;

      // Use raw SQL to insert/update embedding with ON CONFLICT
      // This handles both new embeddings and updates to existing ones
      const result = await this.prisma.$executeRaw`
        INSERT INTO embeddings (id, user_id, vector, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${userId}::uuid,
          ${vectorString}::vector,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          vector = ${vectorString}::vector,
          updated_at = NOW()
        RETURNING id, user_id, created_at, updated_at
      `;

      this.logger.log(`Embedding stored successfully for user ${userId}`);

      // Fetch the embedding record to return
      const embedding = await this.prisma.embedding.findUnique({
        where: { userId },
      });

      return embedding;
    } catch (error) {
      this.logger.error(
        `Failed to store embedding for user ${userId}`,
        error.message,
      );
      throw new Error(`Embedding storage failed: ${error.message}`);
    }
  }

  /**
   * Get an embedding by user ID
   * @param userId - The user ID
   * @returns The embedding record or null if not found
   */
  async getEmbeddingByUserId(userId: string): Promise<any> {
    try {
      const embedding = await this.prisma.embedding.findUnique({
        where: { userId },
      });

      return embedding;
    } catch (error) {
      this.logger.error(
        `Failed to get embedding for user ${userId}`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Check if an embedding exists for a user
   * @param userId - The user ID
   * @returns True if embedding exists, false otherwise
   */
  async hasEmbedding(userId: string): Promise<boolean> {
    try {
      const count = await this.prisma.embedding.count({
        where: { userId },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check embedding for user ${userId}`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Delete an embedding by user ID
   * @param userId - The user ID
   */
  async deleteEmbedding(userId: string): Promise<void> {
    try {
      await this.prisma.embedding.deleteMany({
        where: { userId },
      });

      this.logger.log(`Embedding deleted for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete embedding for user ${userId}`,
        error.message,
      );
      throw error;
    }
  }
}
