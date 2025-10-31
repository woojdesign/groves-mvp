import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMatchingStrategy } from '../../interfaces/matching-strategy.interface';

/**
 * Vector similarity strategy using pgvector cosine distance.
 * Computes similarity between user embeddings using the <=> operator.
 * Returns scores in range 0-1 where 1 is most similar.
 */
@Injectable()
export class VectorSimilarityStrategy implements IMatchingStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async computeSimilarity(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<Map<string, number>> {
    // Handle empty candidate list
    if (candidateUserIds.length === 0) {
      return new Map();
    }

    // Step 1: Get source user's embedding vector
    const sourceEmbedding = await this.prisma.$queryRaw<
      Array<{ embedding: number[] }>
    >`
      SELECT embedding::text as embedding
      FROM embeddings
      WHERE user_id::text = ${sourceUserId}
    `;

    if (sourceEmbedding.length === 0 || !sourceEmbedding[0].embedding) {
      throw new Error(
        `No embedding found for user ${sourceUserId}. User must complete onboarding first.`,
      );
    }

    // Parse the vector from PostgreSQL text format "[x,y,z,...]"
    const sourceVector = this.parseVector(sourceEmbedding[0].embedding);

    // Validate vector components before using in query
    sourceVector.forEach((v, index) => {
      if (!Number.isFinite(v)) {
        throw new Error(
          `Invalid vector component at index ${index}: must be a finite number`,
        );
      }
    });

    // Step 2: Batch query pgvector for cosine similarity
    // Using Prisma.sql for safe interpolation to prevent SQL injection
    // The <=> operator computes cosine distance (0 = identical, 2 = opposite)
    // We convert to similarity score: 1 - distance/2 to get range [0, 1]
    // Build the vector as a string literal
    const vectorStringLiteral = `[${sourceVector.join(',')}]`;

    // Build IN clause with proper UUID casting
    const uuidConditions = Prisma.join(
      candidateUserIds.map((id) => Prisma.sql`${id}`),
      ',',
    );

    const results = await this.prisma.$queryRaw<
      Array<{ user_id: string; similarity_score: number }>
    >`
      SELECT
        user_id::text as user_id,
        1 - (embedding <=> ${vectorStringLiteral}::vector) AS similarity_score
      FROM embeddings
      WHERE user_id::text IN (${uuidConditions})
        AND embedding IS NOT NULL
      ORDER BY similarity_score DESC
    `;

    // Step 3: Convert to Map<userId, score>
    const scoreMap = new Map<string, number>();
    for (const row of results) {
      scoreMap.set(row.user_id, row.similarity_score);
    }

    return scoreMap;
  }

  getName(): string {
    return 'VectorSimilarityStrategy';
  }

  /**
   * Parse PostgreSQL vector text format "[x,y,z,...]" to number array.
   * Handles both string and already-parsed array formats.
   */
  private parseVector(embedding: any): number[] {
    if (Array.isArray(embedding)) {
      return embedding;
    }

    if (typeof embedding === 'string') {
      // Remove brackets and parse
      const cleaned = embedding.replace(/^\[|\]$/g, '');
      return cleaned.split(',').map((v) => parseFloat(v.trim()));
    }

    throw new Error('Invalid embedding format');
  }
}
