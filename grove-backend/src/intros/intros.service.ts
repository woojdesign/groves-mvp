import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { IntroResponseDto } from './dto/intro-response.dto';

/**
 * Service for managing introductions (double opt-in state machine).
 * Handles the flow when both users accept a match.
 */
@Injectable()
export class IntrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create an introduction when both users have accepted.
   * Creates the intro record and sends mutual introduction email.
   */
  async createIntroduction(matchId: string): Promise<{
    id: string;
    status: string;
  }> {
    // Get match details
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        userA: {
          select: { id: true, name: true, email: true },
        },
        userB: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Check if intro already exists
    const existingIntro = await this.prisma.intro.findUnique({
      where: { matchId },
    });

    if (existingIntro) {
      return {
        id: existingIntro.id,
        status: existingIntro.status,
      };
    }

    // Create intro record
    const intro = await this.prisma.intro.create({
      data: {
        matchId,
        userAStatus: 'accepted',
        userBStatus: 'accepted',
        status: 'mutual',
        introSentAt: new Date(),
      },
    });

    // Send mutual introduction email to BOTH users
    await this.sendMutualIntroductionEmail(match);

    // Create audit log entries
    await this.prisma.event.createMany({
      data: [
        {
          userId: match.userAId,
          eventType: 'intro_created',
          metadata: { matchId, introId: intro.id },
        },
        {
          userId: match.userBId,
          eventType: 'intro_created',
          metadata: { matchId, introId: intro.id },
        },
      ],
    });

    return {
      id: intro.id,
      status: intro.status,
    };
  }

  /**
   * Send mutual introduction email to both users.
   * This reveals contact information to both parties.
   */
  private async sendMutualIntroductionEmail(match: any): Promise<void> {
    const { userA, userB, sharedInterest, context } = match;

    // Send to user A
    await this.emailService.sendMutualIntroduction(
      userA.email,
      userA.name,
      {
        name: userB.name,
        email: userB.email,
      },
      sharedInterest || 'shared interests',
      context || '',
    );

    // Send to user B
    await this.emailService.sendMutualIntroduction(
      userB.email,
      userB.name,
      {
        name: userA.name,
        email: userA.email,
      },
      sharedInterest || 'shared interests',
      context || '',
    );
  }

  /**
   * Get active introductions for a user.
   * Returns only intros with status 'active' or 'mutual'.
   */
  async getActiveIntros(userId: string): Promise<IntroResponseDto[]> {
    const intros = await this.prisma.intro.findMany({
      where: {
        status: {
          in: ['mutual', 'active'],
        },
        match: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
      },
      include: {
        match: {
          include: {
            userA: {
              select: { id: true, name: true, email: true },
            },
            userB: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to DTOs
    return intros.map((intro) => {
      const match = intro.match;
      const otherUser =
        match.userAId === userId ? match.userB : match.userA;

      return {
        id: intro.id,
        match: {
          id: match.id,
          name: otherUser.name,
          email: otherUser.email,
          sharedInterest: match.sharedInterest || 'shared interests',
          interests: match.context ? match.context.split('. ') : [],
        },
        status: intro.status,
        createdAt: intro.createdAt.toISOString(),
      };
    });
  }

  /**
   * Mark an introduction as completed (for feedback flow).
   */
  async completeIntroduction(introId: string): Promise<void> {
    await this.prisma.intro.update({
      where: { id: introId },
      data: { status: 'completed' },
    });
  }
}
