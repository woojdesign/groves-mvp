import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user information
   * Returns basic user data including role and onboarding status
   */
  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
        status: true,
        createdAt: true,
        lastActive: true,
        profile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      status: user.status,
      hasCompletedOnboarding: !!user.profile,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    };
  }

  /**
   * Export all user data (GDPR Article 15 - Right to Access)
   * Returns complete user data in JSON format
   */
  async exportUserData(userId: string, req: Request): Promise<any> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    this.logger.log(`Data export requested for user: ${userId}`);

    // Fetch all user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        embedding: true,
        matchesAsA: {
          include: {
            userB: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        matchesAsB: {
          include: {
            userA: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        feedback: true,
        reportsMade: true,
        reportsReceived: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log the export event
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'data_export',
        metadata: { format: 'json' },
        ipAddress,
        userAgent,
      },
    });

    // Return structured data export
    return {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        role: user.role,
        orgId: user.orgId,
        ssoProvider: user.ssoProvider,
        ssoSubject: user.ssoSubject,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
      },
      profile: user.profile
        ? {
            id: user.profile.id,
            interests: user.profile.interests,
            project: user.profile.project,
            connectionType: user.profile.connectionType,
            deepDive: user.profile.deepDive,
            preferences: user.profile.preferences,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      matches: [
        ...user.matchesAsA.map((match) => ({
          id: match.id,
          otherUser: match.userB,
          similarityScore: match.similarityScore,
          sharedInterest: match.sharedInterest,
          status: match.status,
          createdAt: match.createdAt,
          expiresAt: match.expiresAt,
        })),
        ...user.matchesAsB.map((match) => ({
          id: match.id,
          otherUser: match.userA,
          similarityScore: match.similarityScore,
          sharedInterest: match.sharedInterest,
          status: match.status,
          createdAt: match.createdAt,
          expiresAt: match.expiresAt,
        })),
      ],
      feedback: user.feedback.map((f) => ({
        id: f.id,
        introId: f.introId,
        didMeet: f.didMeet,
        helpful: f.helpful,
        note: f.note,
        createdAt: f.createdAt,
      })),
      safetyReports: {
        reported: user.reportsMade.map((sf) => ({
          id: sf.id,
          reportedUserId: sf.reportedId,
          reason: sf.reason,
          comment: sf.comment,
          status: sf.status,
          createdAt: sf.createdAt,
        })),
        received: user.reportsReceived.map((sf) => ({
          id: sf.id,
          reporterUserId: sf.reporterId,
          reason: sf.reason,
          status: sf.status,
          createdAt: sf.createdAt,
        })),
      },
      activityLog: user.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        createdAt: event.createdAt,
      })),
    };
  }

  /**
   * Hard delete user data (GDPR Article 17 - Right to Erasure)
   * Permanently removes all PII or anonymizes data
   */
  async deleteUserData(userId: string, req: Request): Promise<{ message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    this.logger.warn(`Hard delete requested for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log the deletion event BEFORE deleting
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'data_deletion',
        metadata: { type: 'hard_delete', reason: 'user_requested' },
        ipAddress,
        userAgent,
      },
    });

    // Hard delete user - cascade delete will handle related records
    // Prisma schema has onDelete: Cascade for Profile, Embedding, Match, Feedback, SafetyFlag, Event
    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`User ${userId} and all related data permanently deleted`);

    return {
      message: 'All your data has been permanently deleted',
    };
  }

  /**
   * Record user consent for privacy policy and terms of service
   */
  async recordConsent(
    userId: string,
    consentType: 'privacy_policy' | 'terms_of_service',
    version: string,
    req: Request,
  ): Promise<{ success: boolean }> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    this.logger.log(`Consent recorded for user ${userId}: ${consentType} v${version}`);

    // Log consent event
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'consent_recorded',
        metadata: {
          consentType,
          version,
          acceptedAt: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
      },
    });

    return { success: true };
  }
}
