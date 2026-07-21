"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@atelier/config");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let OrganizationsService = class OrganizationsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(userId, dto) {
        const slug = await this.generateUniqueSlug(dto.name);
        const allPermissions = await this.prisma.permission.findMany();
        const permissionIdByKey = new Map(allPermissions.map((p) => [p.key, p.id]));
        const organization = await this.prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: { name: dto.name, slug },
            });
            const roleRecords = [];
            for (const roleName of config_1.DEFAULT_ROLE_NAMES) {
                const role = await tx.role.create({
                    data: { organizationId: org.id, name: roleName, isSystem: true },
                });
                roleRecords.push(role);
            }
            for (const role of roleRecords) {
                const permissionKeys = config_1.DEFAULT_ROLE_PERMISSIONS[role.name];
                const permissionIds = permissionKeys
                    .map((key) => permissionIdByKey.get(key))
                    .filter((id) => Boolean(id));
                if (permissionIds.length === 0)
                    continue;
                await tx.rolePermission.createMany({
                    data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
                    skipDuplicates: true,
                });
            }
            const ownerRole = roleRecords.find((r) => r.name === "Owner");
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
    async listForUser(userId) {
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
    async getById(organizationId) {
        const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
        if (!org)
            throw new common_1.NotFoundException("Organization not found");
        return org;
    }
    async listMembers(organizationId) {
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
    async listRoles(organizationId) {
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
    async generateUniqueSlug(name) {
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
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map