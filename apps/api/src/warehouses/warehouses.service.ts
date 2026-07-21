import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { organizationId_name: { organizationId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`A warehouse named "${dto.name}" already exists`);
    }

    // If this is the org's first warehouse, make it the default
    // regardless of what was passed in, so there's always exactly
    // one default to fall back to for stock operations.
    const warehouseCount = await this.prisma.warehouse.count({ where: { organizationId } });
    const isDefault = warehouseCount === 0 ? true : Boolean(dto.isDefault);

    if (isDefault && warehouseCount > 0) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    const warehouse = await this.prisma.warehouse.create({
      data: { ...dto, organizationId, isDefault },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "WAREHOUSE_CREATED",
      entityType: "Warehouse",
      entityId: warehouse.id,
      metadata: { name: warehouse.name },
    });

    return warehouse;
  }

  async findAll(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
  }
}
