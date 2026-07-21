import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";

@Controller("inventory")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("stock")
  @RequirePermissions("inventory.read")
  listStock(
    @CurrentMembership() membership: MembershipContext,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.inventoryService.listStock(membership.organizationId, warehouseId);
  }

  @Get("movements")
  @RequirePermissions("inventory.read")
  listMovements(
    @CurrentMembership() membership: MembershipContext,
    @Query("productId") productId?: string,
  ) {
    return this.inventoryService.listMovements(membership.organizationId, productId);
  }

  @Post("movements")
  @RequirePermissions("inventory.update")
  createMovement(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.inventoryService.createMovement(membership.organizationId, user.id, dto);
  }
}
