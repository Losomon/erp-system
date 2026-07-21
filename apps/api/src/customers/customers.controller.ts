import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";

@Controller("customers")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions("customers.create")
  create(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(membership.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions("customers.read")
  findAll(@CurrentMembership() membership: MembershipContext, @Query("search") search?: string) {
    return this.customersService.findAll(membership.organizationId, search);
  }

  @Get(":id")
  @RequirePermissions("customers.read")
  findOne(@CurrentMembership() membership: MembershipContext, @Param("id") id: string) {
    return this.customersService.findOne(membership.organizationId, id);
  }

  @Patch(":id")
  @RequirePermissions("customers.update")
  update(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(membership.organizationId, user.id, id, dto);
  }

  @Delete(":id")
  @RequirePermissions("customers.delete")
  remove(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.customersService.remove(membership.organizationId, user.id, id);
  }
}
