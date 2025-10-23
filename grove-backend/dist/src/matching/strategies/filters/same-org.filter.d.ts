import { PrismaService } from '../../../prisma/prisma.service';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';
export declare class SameOrgFilter implements IFilterStrategy {
    private readonly prisma;
    constructor(prisma: PrismaService);
    filter(sourceUserId: string, candidateUserIds: string[]): Promise<string[]>;
    getName(): string;
}
