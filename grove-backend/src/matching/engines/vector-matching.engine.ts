import { Injectable } from '@nestjs/common';
import { BaseMatchingEngine } from './base-matching.engine';
import { PrismaService } from '../../prisma/prisma.service';
import type { IMatchingStrategy } from '../interfaces/matching-strategy.interface';
import type { IFilterStrategy } from '../interfaces/filter-strategy.interface';
import type { IRankingStrategy } from '../interfaces/ranking-strategy.interface';

/**
 * Vector-based matching engine using pgvector for semantic similarity.
 * Extends BaseMatchingEngine and implements:
 * - getCandidatePool(): Fetch all users with embeddings (excluding source)
 * - generateReasons(): Extract shared interests from profiles
 *
 * Pipeline:
 * 1. Get candidate pool (users with embeddings)
 * 2. Filter invalid matches (prior matches, blocked, same org)
 * 3. Compute vector similarity scores
 * 4. Filter by minimum similarity threshold
 * 5. Re-rank for diversity
 * 6. Generate explainability reasons
 */
@Injectable()
export class VectorMatchingEngine extends BaseMatchingEngine {
  constructor(
    private readonly prisma: PrismaService,
    matchingStrategy: IMatchingStrategy,
    filterStrategy: IFilterStrategy,
    rankingStrategy: IRankingStrategy,
  ) {
    super(matchingStrategy, filterStrategy, rankingStrategy);
  }

  /**
   * Get candidate pool: all users with embeddings except the source user.
   * Limit to top 100 candidates for performance (will be filtered and ranked later).
   */
  protected async getCandidatePool(sourceUserId: string): Promise<string[]> {
    // Query users who have embeddings (completed onboarding)
    // Exclude the source user and inactive users
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: sourceUserId },
        status: 'active',
        embedding: {
          isNot: null, // Must have embedding
        },
      },
      select: {
        id: true,
      },
      take: 100, // Limit candidate pool for performance
    });

    return candidates.map((u) => u.id);
  }

  /**
   * Generate human-readable reasons why two users were matched.
   * Extracts shared interests, topics, or themes from profiles.
   * Returns up to 3 reasons per match.
   */
  protected async generateReasons(
    sourceUserId: string,
    candidateUserId: string,
  ): Promise<string[]> {
    // Fetch both user profiles
    const [sourceProfile, candidateProfile] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId: sourceUserId },
      }),
      this.prisma.profile.findUnique({
        where: { userId: candidateUserId },
      }),
    ]);

    if (!sourceProfile || !candidateProfile) {
      return ['Similar interests and values'];
    }

    const reasons: string[] = [];

    // 1. Check for shared connection type
    if (sourceProfile.connectionType === candidateProfile.connectionType) {
      const typeLabel = this.formatConnectionType(
        sourceProfile.connectionType,
      );
      reasons.push(`Both seeking ${typeLabel}`);
    }

    // 2. Extract shared topics from interests and projects
    const sharedTopics = this.extractSharedTopics(
      sourceProfile.nicheInterest + ' ' + sourceProfile.project,
      candidateProfile.nicheInterest + ' ' + candidateProfile.project,
    );

    if (sharedTopics.length > 0) {
      reasons.push(`You both mentioned ${sharedTopics[0]}`);
    }

    // 3. Check for rabbit hole alignment
    if (sourceProfile.rabbitHole && candidateProfile.rabbitHole) {
      const rabbitHoleTopics = this.extractSharedTopics(
        sourceProfile.rabbitHole,
        candidateProfile.rabbitHole,
      );

      if (rabbitHoleTopics.length > 0) {
        reasons.push(`Both exploring ${rabbitHoleTopics[0]}`);
      }
    }

    // Fallback if no specific reasons found
    if (reasons.length === 0) {
      reasons.push('Similar interests and values');
    }

    // Return up to 3 reasons
    return reasons.slice(0, 3);
  }

  /**
   * Format connection type for user-friendly display.
   */
  private formatConnectionType(connectionType: string): string {
    const labels: Record<string, string> = {
      collaboration: 'collaboration',
      mentorship: 'mentorship',
      friendship: 'friendship',
      knowledge_exchange: 'knowledge exchange',
    };

    return labels[connectionType] || connectionType;
  }

  /**
   * Extract shared topics between two text strings.
   * Simple keyword extraction - looks for common meaningful words.
   * Production: Could use NLP/LLM for better topic extraction.
   */
  private extractSharedTopics(text1: string, text2: string): string[] {
    // Normalize and tokenize
    const words1 = this.tokenize(text1.toLowerCase());
    const words2 = this.tokenize(text2.toLowerCase());

    // Find intersection
    const commonWords = words1.filter((word) => words2.includes(word));

    // Filter out stopwords and short words
    const meaningfulWords = commonWords.filter(
      (word) => word.length > 4 && !this.isStopword(word),
    );

    // Return unique topics
    return [...new Set(meaningfulWords)].slice(0, 3);
  }

  /**
   * Tokenize text into words (simple split by whitespace and punctuation).
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  /**
   * Check if word is a common stopword.
   * MVP: Basic stopword list. Production: Use comprehensive NLP library.
   */
  private isStopword(word: string): boolean {
    const stopwords = new Set([
      'the',
      'and',
      'for',
      'with',
      'this',
      'that',
      'from',
      'have',
      'been',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
    ]);

    return stopwords.has(word);
  }
}
