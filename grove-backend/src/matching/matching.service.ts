import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type { IMatchingEngine } from './interfaces';
import { GenerateMatchesRequestDto } from './dto/generate-matches-request.dto';
import { MatchCandidateDto } from './dto/match-candidate.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IntrosService } from '../intros/intros.service';
import { EMAIL_SERVICE } from '../email/email.service.interface';
import type { IEmailService } from '../email/email.service.interface';
import { AcceptMatchResponseDto } from '../intros/dto/accept-match-response.dto';
import { PassMatchResponseDto } from '../intros/dto/pass-match-response.dto';

/**
 * Facade service for matching functionality.
 * Provides clean API for controllers while delegating to matching engine.
 * This layer can add caching, logging, and business logic.
 */
@Injectable()
export class MatchingService {
  constructor(
    @Inject('MATCHING_ENGINE') private readonly matchingEngine: IMatchingEngine,
    private readonly prisma: PrismaService,
    private readonly introsService: IntrosService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  /**
   * Get matches for a user using the matching engine.
   * Checks database for existing matches first, generates new ones if needed.
   * Stores matches in database with 7-day expiration.
   */
  async getMatchesForUser(
    userId: string,
    options: GenerateMatchesRequestDto = {},
  ): Promise<MatchCandidateDto[]> {
    // Check if user has existing pending matches that haven't expired
    const existingMatches = await this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        userA: { select: { id: true, name: true } },
        userB: { select: { id: true, name: true } },
      },
      orderBy: { similarityScore: 'desc' },
      take: options.limit || 10,
    });

    // If we have existing matches, return them
    if (existingMatches.length > 0) {
      return existingMatches.map((match) => {
        const candidate =
          match.userAId === userId ? match.userB : match.userA;
        return {
          id: match.id,
          candidateId: candidate.id,
          name: candidate.name,
          score: match.similarityScore,
          reason: match.context || '',
          sharedInterests: match.sharedInterest
            ? [match.sharedInterest]
            : [],
          confidence: match.similarityScore,
          status: match.status,
          expiresAt: match.expiresAt?.toISOString(),
        } as MatchCandidateDto;
      });
    }

    // No existing matches - generate new ones using the matching engine
    const result = await this.matchingEngine.generateMatches({
      userId,
      limit: options.limit,
      minSimilarityScore: options.minSimilarityScore,
      diversityWeight: options.diversityWeight,
    });

    // Store matches in database with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Get current user info for email
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const matchDtos = await Promise.all(
      result.matches.map(async (match) => {
        // Get candidate user info
        const candidate = await this.prisma.user.findUnique({
          where: { id: match.candidateUserId },
          select: { id: true, name: true, email: true },
        });

        // Create bidirectional match records (one for each user)
        const storedMatch = await this.prisma.match.create({
          data: {
            userAId: userId,
            userBId: match.candidateUserId,
            similarityScore: match.similarityScore,
            sharedInterest: match.reasons[0] || 'shared interests',
            context: match.reasons.join('. '),
            status: 'pending',
            expiresAt,
          },
        });

        // Send match notification email to BOTH users (mirrored)
        // This ensures privacy - neither knows if the other received it
        if (currentUser && candidate) {
          // Send to current user
          try {
            await this.emailService.sendMatchNotification(
              currentUser.email,
              currentUser.name,
              {
                id: storedMatch.id,
                name: candidate.name,
                score: match.similarityScore,
                sharedInterest: match.reasons[0] || 'shared interests',
                reason: match.reasons.join('. '),
              },
            );
          } catch (error) {
            // Log but don't fail - email is not critical
            console.error('Failed to send match notification:', error);
          }

          // Send to candidate user (mirrored notification)
          try {
            await this.emailService.sendMatchNotification(
              candidate.email,
              candidate.name,
              {
                id: storedMatch.id,
                name: currentUser.name,
                score: match.similarityScore,
                sharedInterest: match.reasons[0] || 'shared interests',
                reason: match.reasons.join('. '),
              },
            );
          } catch (error) {
            // Log but don't fail - email is not critical
            console.error('Failed to send match notification:', error);
          }
        }

        return {
          id: storedMatch.id,
          candidateId: match.candidateUserId,
          name: candidate?.name || 'Unknown User',
          score: match.similarityScore,
          reason: match.reasons.join('. '),
          sharedInterests: this.extractSharedInterests(match.reasons),
          confidence: match.finalScore,
          status: storedMatch.status,
          expiresAt: storedMatch.expiresAt?.toISOString(),
        } as MatchCandidateDto;
      }),
    );

    return matchDtos;
  }

  /**
   * Extract shared interests from match reasons.
   * Simple implementation for MVP - Phase 5 will enhance this.
   */
  private extractSharedInterests(reasons: string[]): string[] {
    // For now, just return the reasons as interests
    // Phase 5 will implement proper interest extraction from profiles
    return reasons;
  }

  /**
   * Accept a match (express interest).
   * Creates intro if other user has also accepted (mutual match).
   */
  async acceptMatch(
    matchId: string,
    userId: string,
    req: Request,
  ): Promise<AcceptMatchResponseDto> {
    // Extract IP and user-agent from request
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Get the match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        intro: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Verify user is part of this match
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException('Not authorized to accept this match');
    }

    // Check if match is still valid
    if (match.status !== 'pending') {
      throw new BadRequestException(
        `Match already ${match.status}. Cannot accept.`,
      );
    }

    if (match.expiresAt && match.expiresAt < new Date()) {
      throw new BadRequestException('Match has expired');
    }

    // Determine which user is accepting
    const isUserA = match.userAId === userId;

    // Check if intro already exists (other user has accepted)
    if (match.intro) {
      // Update intro status for this user
      const updatedIntro = await this.prisma.intro.update({
        where: { id: match.intro.id },
        data: {
          ...(isUserA
            ? { userAStatus: 'accepted' }
            : { userBStatus: 'accepted' }),
        },
      });

      // Check if both have accepted
      if (
        updatedIntro.userAStatus === 'accepted' &&
        updatedIntro.userBStatus === 'accepted'
      ) {
        // Mutual match! Update intro and send email with IP/UA
        const intro = await this.introsService.createIntroduction(matchId, ipAddress, userAgent);

        // Update match status
        await this.prisma.match.update({
          where: { id: matchId },
          data: { status: 'accepted' },
        });

        // Create audit log with IP/UA
        await this.prisma.event.create({
          data: {
            userId,
            eventType: 'match_mutual',
            metadata: { matchId, introId: intro.id },
            ipAddress,
            userAgent,
          },
        });

        return {
          status: 'mutual_match',
          mutualMatch: true,
          intro: {
            id: intro.id,
            status: intro.status,
          },
          message: "It's a match! Check your email for an introduction.",
        };
      }

      // Other user hasn't accepted yet
      await this.prisma.event.create({
        data: {
          userId,
          eventType: 'match_accepted',
          metadata: { matchId },
          ipAddress,
          userAgent,
        },
      });

      return {
        status: 'accepted',
        mutualMatch: false,
        message:
          "Your interest has been noted. We'll let you know if they accept too!",
      };
    }

    // First acceptance - create intro record with partial status
    await this.prisma.intro.create({
      data: {
        matchId,
        userAStatus: isUserA ? 'accepted' : 'pending',
        userBStatus: isUserA ? 'pending' : 'accepted',
        status: isUserA ? 'accepted_by_a' : 'accepted_by_b',
      },
    });

    // Create audit log with IP/UA
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'match_accepted',
        metadata: { matchId },
        ipAddress,
        userAgent,
      },
    });

    return {
      status: 'accepted',
      mutualMatch: false,
      message:
        "Your interest has been noted. We'll let you know if they accept too!",
    };
  }

  /**
   * Pass on a match (decline interest).
   * Hides match from both users.
   */
  async passMatch(
    matchId: string,
    userId: string,
  ): Promise<PassMatchResponseDto> {
    // Get the match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Verify user is part of this match
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException('Not authorized to pass on this match');
    }

    // Check if match is still valid
    if (match.status !== 'pending') {
      throw new BadRequestException(
        `Match already ${match.status}. Cannot pass.`,
      );
    }

    // Update match status to 'rejected'
    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'rejected' },
    });

    // Create audit log
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'match_passed',
        metadata: { matchId },
      },
    });

    return {
      status: 'passed',
      message: "No worries! We'll find you better matches.",
    };
  }
}
