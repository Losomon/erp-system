import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import "../types/request.types";

/**
 * Must run after JwtAuthGuard (relies on request.user being set).
 * Resolves the organization from the :organizationId route param
 * if present, otherwise from the x-organization-id header, then
 * confirms the current user actually has a Membership there before
 * attaching role + permissions to the request for downstream guards
 * (see PermissionsGuard) and handlers to use.
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    const organizationId =
      (request.params?.organizationId as string | undefined) ??
      (request.headers["x-organization-id"] as string | undefined);

    if (!organizationId) {
      throw new ForbiddenException(
        "No organization specified (route param or x-organization-id header)",
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: request.user.id, organizationId } },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    request.membership = {
      membershipId: membership.id,
      organizationId: membership.organizationId,
      roleId: membership.roleId,
      roleName: membership.role.name,
      permissions: membership.role.rolePermissions.map((rp) => rp.permission.key),
    };

    return true;
  }
}
