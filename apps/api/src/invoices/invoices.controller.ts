import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { GenerateInvoiceDto } from "./dto/generate-invoice.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";
import type { InvoiceStatus } from "@prisma/client";

@Controller("invoices")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post("from-sales-order/:salesOrderId")
  @RequirePermissions("invoices.create")
  generateFromSalesOrder(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("salesOrderId") salesOrderId: string,
    @Body() dto: GenerateInvoiceDto,
  ) {
    return this.invoicesService.generateFromSalesOrder(
      membership.organizationId,
      user.id,
      salesOrderId,
      dto,
    );
  }

  @Get()
  @RequirePermissions("invoices.read")
  findAll(
    @CurrentMembership() membership: MembershipContext,
    @Query("status") status?: InvoiceStatus,
  ) {
    return this.invoicesService.findAll(membership.organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("invoices.read")
  findOne(@CurrentMembership() membership: MembershipContext, @Param("id") id: string) {
    return this.invoicesService.findOne(membership.organizationId, id);
  }

  @Post(":id/void")
  @RequirePermissions("invoices.delete")
  void(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.invoicesService.void(membership.organizationId, user.id, id);
  }
}
