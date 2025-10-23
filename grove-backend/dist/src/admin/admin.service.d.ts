import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    private getRequestMetadata;
    createUser(dto: CreateUserDto, adminId: string, orgId: string, req?: Request): Promise<{
        id: string;
        name: string;
        status: string;
        ssoProvider: string | null;
        ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: string;
        lastActive: Date | null;
        ssoSubject: string | null;
    }>;
    getOrgUsers(adminRole: string, orgId: string, page?: number, limit?: number): Promise<{
        users: ({
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                nicheInterest: string;
                project: string;
                connectionType: string;
                rabbitHole: string | null;
                preferences: string | null;
            } | null;
        } & {
            id: string;
            name: string;
            status: string;
            ssoProvider: string | null;
            ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            orgId: string;
            role: string;
            lastActive: Date | null;
            ssoSubject: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    updateUser(userId: string, dto: UpdateUserDto, adminId: string, orgId: string, req?: Request): Promise<{
        id: string;
        name: string;
        status: string;
        ssoProvider: string | null;
        ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: string;
        lastActive: Date | null;
        ssoSubject: string | null;
    }>;
    suspendUser(userId: string, adminId: string, orgId: string, req?: Request): Promise<{
        id: string;
        name: string;
        status: string;
        ssoProvider: string | null;
        ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: string;
        lastActive: Date | null;
        ssoSubject: string | null;
    }>;
    deleteUser(userId: string, adminId: string, orgId: string, req?: Request): Promise<{
        message: string;
    }>;
    getOrganization(orgId: string): Promise<{
        users: {
            id: string;
            name: string;
            status: string;
            email: string;
            role: string;
        }[];
    } & {
        id: string;
        domain: string;
        name: string;
        status: string;
        ssoEnabled: boolean;
        ssoProvider: string | null;
        samlMetadataUrl: string | null;
        samlEntityId: string | null;
        oidcIssuer: string | null;
        oidcClientId: string | null;
        oidcClientSecret: string | null;
        ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateOrganization(orgId: string, dto: any, adminId: string, req?: Request): Promise<{
        id: string;
        domain: string;
        name: string;
        status: string;
        ssoEnabled: boolean;
        ssoProvider: string | null;
        samlMetadataUrl: string | null;
        samlEntityId: string | null;
        oidcIssuer: string | null;
        oidcClientId: string | null;
        oidcClientSecret: string | null;
        ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAdminActions(orgId: string, page?: number, limit?: number): Promise<{
        actions: {
            id: string;
            createdAt: Date;
            orgId: string | null;
            action: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string;
            userAgent: string;
            adminId: string;
            targetType: string;
            targetId: string | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
