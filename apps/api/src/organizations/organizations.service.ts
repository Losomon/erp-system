import { Injectable, NotFoundException } from "@nestjs/common";
import { DEFAULT_ROLE_NAMES, DEFAULT_ROLE_PERMISSIONS } from "@atelier/config";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    const allPermissions = await this.prisma.permission.findMany();
    const permissionIdByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

    const organization = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.name, slug },
      });

      // Seed every default role with its permission set. If the
      // permission catalog hasn't been seeded yet, roles are still
      // created — just without permissions attached — rather than
      // failing organization creation outright.
      //
      // Queries inside an interactive transaction share a single DB
      // connection, so these run sequentially rather than via
      // Promise.all — issuing concurrent queries on one connection
      // is unsafe and can produce inconsistent results.
      const roleRecords = [];
      for (const roleName of DEFAULT_ROLE_NAMES) {
        const role = await tx.role.create({
          data: { organizationId: org.id, name: roleName, isSystem: true },
        });
        roleRecords.push(role);
      }

      for (const role of roleRecords) {
        const permissionKeys =
          DEFAULT_ROLE_PERMISSIONS[role.name as keyof typeof DEFAULT_ROLE_PERMISSIONS];
        const permissionIds = permissionKeys
          .map((key) => permissionIdByKey.get(key))
          .filter((id): id is string => Boolean(id));

        if (permissionIds.length === 0) continue;

        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }

      const ownerRole = roleRecords.find((r) => r.name === "Owner")!;

      await tx.membership.create({
        data: { userId, organizationId: org.id, roleId: ownerRole.id },
      });

      return org;
    });

    await this.audit.log({
      organizationId: organization.id,
      userId,
      action: "ORGANIZATION_CREATED",
      entityType: "Organization",
      entityId: organization.id,
      metadata: { name: organization.name },
    });

    return organization;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true, role: true },
    });

    return memberships.map((m) => ({
      organizationId: m.organizationId,
      name: m.organization.name,
      slug: m.organization.slug,
      roleName: m.role.name,
      joinedAt: m.createdAt,
    }));
  }

  async getById(organizationId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  async listMembers(organizationId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      roleName: m.role.name,
      joinedAt: m.createdAt,
    }));
  }

  async listRoles(organizationId: string) {
    const roles = await this.prisma.role.findMany({
      where: { organizationId },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { createdAt: "asc" },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map((rp) => rp.permission.key),
    }));
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "organization";

    let candidate = base;
    let suffix = 1;

    while (await this.prisma.organization.findUnique({ where: { slug: candidate } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }
}
