import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import type { AuthenticatedUser } from "../common/types/request.types";
import { AuditService } from "../audit/audit.service";
export declare class OrganizationsController {
    private readonly organizationsService;
    private readonly auditService;
    constructor(organizationsService: OrganizationsService, auditService: AuditService);
    create(user: AuthenticatedUser, dto: CreateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
    }>;
    listMine(user: AuthenticatedUser): Promise<{
        organizationId: string;
        name: any;
        slug: any;
        roleName: any;
        joinedAt: Date;
    }[]>;
    getOne(organizationId: string): Promise<{
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
    listAuditLogs(organizationId: string, take?: string, skip?: string): Promise<any>;
}
