import { Injectable, Logger } from "@nestjs/common";
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

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata,
        },
      });
    } catch (err) {
      // Audit logging is best-effort: never let a logging failure
      // roll back or fail the business action that triggered it.
      this.logger.error(`Failed to write audit log for action "${input.action}"`, err as Error);
    }
  }

  async list(organizationId: string, take = 50, skip = 0) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
