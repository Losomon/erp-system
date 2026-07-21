import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, StockMovementType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";

type Tx = Prisma.TransactionClient;

export interface RecordMovementInput {
  organizationId: string;
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number; // signed delta
  reference?: string;
  createdByUserId?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createMovement(organizationId: string, userId: string, dto: CreateStockMovementDto) {
    // The productId/warehouseId come straight from the request body —
    // confirm they actually belong to this organization before writing
    // anything, otherwise a member of one org could move another org's
    // stock by guessing IDs.
    const [product, warehouse] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: dto.productId, organizationId } }),
      this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, organizationId } }),
    ]);
    if (!product) throw new NotFoundException("Product not found in this organization");
    if (!warehouse) throw new NotFoundException("Warehouse not found in this organization");

    const movement = await this.prisma.$transaction((tx) =>
      this.recordMovement(tx, {
        organizationId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        type: dto.type,
        quantity: dto.quantity,
        reference: dto.reference,
        createdByUserId: userId,
      }),
    );

    await this.audit.log({
      organizationId,
      userId,
      action: "STOCK_MOVEMENT_RECORDED",
      entityType: "StockMovement",
      entityId: movement.id,
      metadata: { productId: dto.productId, warehouseId: dto.warehouseId, type: dto.type, quantity: dto.quantity },
    });

    return movement;
  }

  /**
   * Core stock-mutation primitive. Writes an append-only StockMovement
   * row and updates the InventoryStock projection in the same
   * transaction, so the two can never drift apart. Pass an existing
   * `tx` to fold this into a larger transaction (e.g. confirming a
   * sales order); omit it to run standalone.
   */
  async recordMovement(txOrNone: Tx | undefined, input: RecordMovementInput) {
    const run = async (tx: Tx) => {
      const current = await tx.inventoryStock.findUnique({
        where: {
          productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId },
        },
      });

      const currentQuantity = current?.quantity ?? 0;
      const nextQuantity = currentQuantity + input.quantity;

      if (nextQuantity < 0) {
        throw new ConflictException(
          `Insufficient stock: ${currentQuantity} available, ${Math.abs(input.quantity)} requested`,
        );
      }

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: input.organizationId,
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: input.type,
          quantity: input.quantity,
          reference: input.reference,
          createdByUserId: input.createdByUserId,
        },
      });

      await tx.inventoryStock.upsert({
        where: {
          productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId },
        },
        create: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: nextQuantity,
        },
        update: { quantity: nextQuantity },
      });

      return movement;
    };

    if (txOrNone) return run(txOrNone);
    return this.prisma.$transaction((tx) => run(tx));
  }

  async listStock(organizationId: string, warehouseId?: string) {
    return this.prisma.inventoryStock.findMany({
      where: {
        warehouse: { organizationId },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listMovements(organizationId: string, productId?: string, take = 50) {
    return this.prisma.stockMovement.findMany({
      where: { organizationId, ...(productId ? { productId } : {}) },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
