import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/request.types";
import { AuditService } from "../audit/audit.service";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listForUser(user.id);
  }

  @Get(":organizationId")
  @UseGuards(OrganizationGuard)
  getOne(@Param("organizationId") organizationId: string) {
    return this.organizationsService.getById(organizationId);
  }

  @Get(":organizationId/members")
  @UseGuards(OrganizationGuard)
  listMembers(@Param("organizationId") organizationId: string) {
    return this.organizationsService.listMembers(organizationId);
  }

  @Get(":organizationId/roles")
  @UseGuards(OrganizationGuard)
  listRoles(@Param("organizationId") organizationId: string) {
    return this.organizationsService.listRoles(organizationId);
  }

  @Get(":organizationId/audit-logs")
  @UseGuards(OrganizationGuard, PermissionsGuard)
  @RequirePermissions("audit_logs.read")
  listAuditLogs(
    @Param("organizationId") organizationId: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string,
  ) {
    return this.auditService.list(
      organizationId,
      take ? Number(take) : undefined,
      skip ? Number(skip) : undefined,
    );
  }
}
