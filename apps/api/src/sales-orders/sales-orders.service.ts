import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SalesOrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";

const { Decimal } = Prisma;

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateSalesOrderDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const missing = productIds.filter((id) => !productById.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown product id(s): ${missing.join(", ")}`);
    }

    let subtotal = new Decimal(0);
    let tax = new Decimal(0);

    const itemsData = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      const unitPrice = new Decimal(item.unitPrice ?? product.price.toString());
      const taxRate = new Decimal(product.taxRate.toString());
      const lineSubtotal = unitPrice.mul(item.quantity);
      const lineTax = lineSubtotal.mul(taxRate).div(100);
      const lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      tax = tax.add(lineTax);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        taxRate,
        lineTotal,
      };
    });

    const total = subtotal.add(tax);
    const orderNumber = await this.nextOrderNumber(organizationId);

    const order = await this.prisma.salesOrder.create({
      data: {
        organizationId,
        customerId: dto.customerId,
        orderNumber,
        status: SalesOrderStatus.DRAFT,
        subtotal,
        tax,
        total,
        createdByUserId: userId,
        items: { create: itemsData },
      },
      include: { items: true, customer: true },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "SALES_ORDER_CREATED",
      entityType: "SalesOrder",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, total: total.toString() },
    });

    return order;
  }

  async findAll(organizationId: string, status?: SalesOrderStatus) {
    return this.prisma.salesOrder.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(organizationId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException("Sales order not found");
    return order;
  }

  async confirm(organizationId: string, userId: string, id: string) {
    const order = await this.findOne(organizationId, id);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new ConflictException(`Only DRAFT orders can be confirmed (this order is ${order.status})`);
    }

    const warehouse = await this.defaultWarehouse(organizationId);

    const confirmed = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await this.inventory.recordMovement(tx, {
          organizationId,
          productId: item.productId,
          warehouseId: warehouse.id,
          type: "SALE",
          quantity: -item.quantity,
          reference: order.orderNumber,
          createdByUserId: userId,
        });
      }

      return tx.salesOrder.update({
        where: { id },
        data: { status: SalesOrderStatus.CONFIRMED },
        include: { items: true, customer: true },
      });
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "SALES_ORDER_CONFIRMED",
      entityType: "SalesOrder",
      entityId: id,
      metadata: { orderNumber: order.orderNumber },
    });

    return confirmed;
  }

  async cancel(organizationId: string, userId: string, id: string) {
    const order = await this.findOne(organizationId, id);
    if (order.status !== SalesOrderStatus.DRAFT && order.status !== SalesOrderStatus.CONFIRMED) {
      throw new ConflictException(
        `Orders in ${order.status} status can't be cancelled directly`,
      );
    }

    const wasConfirmed = order.status === SalesOrderStatus.CONFIRMED;
    const warehouse = wasConfirmed ? await this.defaultWarehouse(organizationId) : null;

    const cancelled = await this.prisma.$transaction(async (tx) => {
      // If stock was already deducted at confirm time, put it back.
      if (wasConfirmed && warehouse) {
        for (const item of order.items) {
          await this.inventory.recordMovement(tx, {
            organizationId,
            productId: item.productId,
            warehouseId: warehouse.id,
            type: "RETURN",
            quantity: item.quantity,
            reference: `${order.orderNumber}-CANCELLED`,
            createdByUserId: userId,
          });
        }
      }

      return tx.salesOrder.update({
        where: { id },
        data: { status: SalesOrderStatus.CANCELLED },
        include: { items: true, customer: true },
      });
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "SALES_ORDER_CANCELLED",
      entityType: "SalesOrder",
      entityId: id,
      metadata: { orderNumber: order.orderNumber, stockRestored: wasConfirmed },
    });

    return cancelled;
  }

  private async nextOrderNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.salesOrder.count({ where: { organizationId } });
    return `SO-${(count + 1).toString().padStart(4, "0")}`;
  }

  private async defaultWarehouse(organizationId: string) {
    const warehouse =
      (await this.prisma.warehouse.findFirst({ where: { organizationId, isDefault: true } })) ??
      (await this.prisma.warehouse.findFirst({ where: { organizationId } }));

    if (!warehouse) {
      throw new BadRequestException(
        "This organization has no warehouse yet. Create one before confirming orders.",
      );
    }

    return warehouse;
  }
}
