import type { Request } from 'express';
import { GdprService } from './gdpr.service';
import { RecordConsentDto } from './dto/record-consent.dto';
export declare class GdprController {
    private readonly gdprService;
    constructor(gdprService: GdprService);
    exportData(user: {
        id: string;
    }, req: Request): Promise<any>;
    deleteAccount(user: {
        id: string;
    }, req: Request): Promise<{
        message: string;
    }>;
    recordConsent(user: {
        id: string;
    }, dto: RecordConsentDto, req: Request): Promise<{
        success: boolean;
    }>;
}
