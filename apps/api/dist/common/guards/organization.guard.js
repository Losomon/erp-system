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
exports.OrganizationGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
require("../types/request.types");
let OrganizationGuard = class OrganizationGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!request.user) {
            throw new common_1.UnauthorizedException("Authentication required");
        }
        const organizationId = request.params?.organizationId ??
            request.headers["x-organization-id"];
        if (!organizationId) {
            throw new common_1.ForbiddenException("No organization specified (route param or x-organization-id header)");
        }
        const membership = await this.prisma.membership.findUnique({
            where: { userId_organizationId: { userId: request.user.id, organizationId } },
            include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException("You are not a member of this organization");
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
};
exports.OrganizationGuard = OrganizationGuard;
exports.OrganizationGuard = OrganizationGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationGuard);
//# sourceMappingURL=organization.guard.js.map