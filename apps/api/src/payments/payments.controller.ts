import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";

@Controller("payments")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @RequirePermissions("payments.create")
  create(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(membership.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions("payments.read")
  findAll(
    @CurrentMembership() membership: MembershipContext,
    @Query("invoiceId") invoiceId?: string,
  ) {
    return this.paymentsService.findAll(membership.organizationId, invoiceId);
  }

  @Get(":id")
  @RequirePermissions("payments.read")
  findOne(@CurrentMembership() membership: MembershipContext, @Param("id") id: string) {
    return this.paymentsService.findOne(membership.organizationId, id);
  }
}
