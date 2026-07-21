import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { WarehousesService } from "./warehouses.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";

@Controller("warehouses")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @RequirePermissions("inventory.update")
  create(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(membership.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions("inventory.read")
  findAll(@CurrentMembership() membership: MembershipContext) {
    return this.warehousesService.findAll(membership.organizationId);
  }
}
