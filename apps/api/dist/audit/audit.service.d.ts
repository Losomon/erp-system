import { PrismaService } from "../prisma/prisma.service";
import type { Prisma } from "@prisma/client";
export interface AuditLogInput {
    organizationId?: string;
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(input: AuditLogInput): Promise<void>;
    list(organizationId: string, take?: number, skip?: number): Promise<any>;
}
