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
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateProductCategoryDto } from "./dto/create-product-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrentMembership } from "../common/decorators/current-membership.decorator";
import type { AuthenticatedUser, MembershipContext } from "../common/types/request.types";

@Controller("products")
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ---- Categories (static routes first — must not collide with :id) ----

  @Post("categories")
  @RequirePermissions("products.create")
  createCategory(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductCategoryDto,
  ) {
    return this.productsService.createCategory(membership.organizationId, user.id, dto);
  }

  @Get("categories")
  @RequirePermissions("products.read")
  listCategories(@CurrentMembership() membership: MembershipContext) {
    return this.productsService.listCategories(membership.organizationId);
  }

  // ---- Products ----

  @Post()
  @RequirePermissions("products.create")
  create(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(membership.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions("products.read")
  findAll(
    @CurrentMembership() membership: MembershipContext,
    @Query("search") search?: string,
    @Query("categoryId") categoryId?: string,
  ) {
    return this.productsService.findAll(membership.organizationId, search, categoryId);
  }

  @Get(":id")
  @RequirePermissions("products.read")
  findOne(@CurrentMembership() membership: MembershipContext, @Param("id") id: string) {
    return this.productsService.findOne(membership.organizationId, id);
  }

  @Patch(":id")
  @RequirePermissions("products.update")
  update(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(membership.organizationId, user.id, id, dto);
  }

  @Delete(":id")
  @RequirePermissions("products.delete")
  remove(
    @CurrentMembership() membership: MembershipContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.productsService.remove(membership.organizationId, user.id, id);
  }
}
