import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getUsers(req: Request, page?: string, limit?: string): Promise<{
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
    createUser(dto: CreateUserDto, req: Request): Promise<{
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
    updateUser(userId: string, dto: UpdateUserDto, req: Request): Promise<{
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
    suspendUser(userId: string, req: Request): Promise<{
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
    deleteUser(userId: string, req: Request): Promise<{
        message: string;
    }>;
    getOrganization(req: Request): Promise<{
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
    updateOrganization(dto: any, req: Request): Promise<{
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
    getAdminActions(req: Request, page?: string, limit?: string): Promise<{
        actions: {
            id: string;
            createdAt: Date;
            orgId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string;
            userAgent: string;
            adminId: string;
            action: string;
            targetType: string;
            targetId: string | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
