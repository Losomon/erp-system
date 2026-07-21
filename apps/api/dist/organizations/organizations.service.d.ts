import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
export declare class OrganizationsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(userId: string, dto: CreateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
    }>;
    listForUser(userId: string): Promise<{
        organizationId: string;
        name: any;
        slug: any;
        roleName: any;
        joinedAt: Date;
    }[]>;
    getById(organizationId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
    }>;
    listMembers(organizationId: string): Promise<{
        membershipId: string;
        userId: string;
        email: any;
        firstName: any;
        lastName: any;
        roleName: any;
        joinedAt: Date;
    }[]>;
    listRoles(organizationId: string): Promise<any>;
    private generateUniqueSlug;
}
