import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { SalesOrdersService } from "./sales-orders.service";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";
import type { SalesOrderStatus } from "@prisma/client";

@Controller("sales-orders")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  @RequirePermissions("sales.create")
  create(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.create(membership.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions("sales.read")
  findAll(
    @CurrentMembership() membership: MembershipContext,
    @Query("status") status?: SalesOrderStatus,
  ) {
    return this.salesOrdersService.findAll(membership.organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  findOne(@CurrentMembership() membership: MembershipContext, @Param("id") id: string) {
    return this.salesOrdersService.findOne(membership.organizationId, id);
  }

  @Post(":id/confirm")
  @RequirePermissions("sales.update")
  confirm(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.salesOrdersService.confirm(membership.organizationId, user.id, id);
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.update")
  cancel(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.salesOrdersService.cancel(membership.organizationId, user.id, id);
  }
}
