import { CanActivate, ExecutionContext } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import "../types/request.types";
export declare class OrganizationGuard implements CanActivate {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
