import { ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateProductCategoryDto } from "./dto/create-product-category.dto";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { organizationId_sku: { organizationId, sku: dto.sku } },
    });
    if (existing) {
      throw new ConflictException(`A product with SKU "${dto.sku}" already exists`);
    }

    if (dto.categoryId) {
      await this.assertCategoryInOrg(organizationId, dto.categoryId);
    }

    const product = await this.prisma.product.create({
      data: { ...dto, organizationId },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      metadata: { sku: product.sku, name: product.name },
    });

    return product;
  }

  async findAll(organizationId: string, search?: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        organizationId,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: { category: true, inventoryStocks: { include: { warehouse: true } } },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async update(organizationId: string, userId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(organizationId, id);

    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { organizationId_sku: { organizationId, sku: dto.sku } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`A product with SKU "${dto.sku}" already exists`);
      }
    }

    if (dto.categoryId) {
      await this.assertCategoryInOrg(organizationId, dto.categoryId);
    }

    const product = await this.prisma.product.update({ where: { id }, data: dto });

    await this.audit.log({
      organizationId,
      userId,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: product.id,
      metadata: { changes: dto },
    });

    return product;
  }

  async remove(organizationId: string, userId: string, id: string) {
    await this.findOne(organizationId, id);

    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictException(
          "This product is referenced by orders or stock records and can't be deleted. Archive it instead.",
        );
      }
      throw err;
    }

    await this.audit.log({
      organizationId,
      userId,
      action: "PRODUCT_DELETED",
      entityType: "Product",
      entityId: id,
    });

    return { success: true };
  }

  // ---- Categories ----

  async createCategory(organizationId: string, userId: string, dto: CreateProductCategoryDto) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { organizationId_name: { organizationId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`A category named "${dto.name}" already exists`);
    }

    const category = await this.prisma.productCategory.create({
      data: { ...dto, organizationId },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "PRODUCT_CATEGORY_CREATED",
      entityType: "ProductCategory",
      entityId: category.id,
      metadata: { name: category.name },
    });

    return category;
  }

  async listCategories(organizationId: string) {
    return this.prisma.productCategory.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  /** Prevents a product from being attached to another org's category. */
  private async assertCategoryInOrg(organizationId: string, categoryId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: categoryId, organizationId },
    });
    if (!category) {
      throw new BadRequestException("Category not found in this organization");
    }
  }
}
