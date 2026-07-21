import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceStatus, Prisma, SalesOrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { GenerateInvoiceDto } from "./dto/generate-invoice.dto";

const { Decimal } = Prisma;
const DEFAULT_DUE_IN_DAYS = 14;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generateFromSalesOrder(
    organizationId: string,
    userId: string,
    salesOrderId: string,
    dto: GenerateInvoiceDto,
  ) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, organizationId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException("Sales order not found");

    if (order.status !== SalesOrderStatus.CONFIRMED && order.status !== SalesOrderStatus.COMPLETED) {
      throw new ConflictException(
        "Only confirmed or completed sales orders can be invoiced",
      );
    }

    const existing = await this.prisma.invoice.findFirst({ where: { salesOrderId } });
    if (existing) {
      throw new ConflictException(`This order already has invoice ${existing.invoiceNumber}`);
    }

    const invoiceNumber = await this.nextInvoiceNumber(organizationId);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + (dto.dueInDays ?? DEFAULT_DUE_IN_DAYS));

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId,
        salesOrderId: order.id,
        customerId: order.customerId,
        invoiceNumber,
        status: InvoiceStatus.ISSUED,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        issuedAt: new Date(),
        dueAt,
        items: {
          create: order.items.map((item) => ({
            description: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "INVOICE_GENERATED",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, salesOrderId: order.id },
    });

    return invoice;
  }

  async findAll(organizationId: string, status?: InvoiceStatus) {
    return this.prisma.invoice.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(organizationId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { items: true, customer: true, payments: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async void(organizationId: string, userId: string, id: string) {
    const invoice = await this.findOne(organizationId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException("A fully paid invoice can't be voided");
    }

    const voided = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "INVOICE_VOIDED",
      entityType: "Invoice",
      entityId: id,
      metadata: { invoiceNumber: invoice.invoiceNumber },
    });

    return voided;
  }

  /**
   * Recomputes amountPaid and status from the sum of COMPLETED payments.
   * Called by PaymentsService after recording a payment. Accepts an
   * optional transaction client so it can run in the same transaction
   * as the payment write.
   */
  async recomputeStatus(tx: Prisma.TransactionClient, invoiceId: string) {
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const payments = await tx.payment.findMany({
      where: { invoiceId, status: "COMPLETED" },
    });

    const amountPaid = payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
    const total = new Decimal(invoice.total.toString());

    let status: InvoiceStatus = invoice.status;
    if (invoice.status !== InvoiceStatus.VOID) {
      if (amountPaid.gte(total) && total.gt(0)) {
        status = InvoiceStatus.PAID;
      } else if (amountPaid.gt(0)) {
        status = InvoiceStatus.PARTIALLY_PAID;
      } else if (invoice.dueAt && invoice.dueAt < new Date()) {
        status = InvoiceStatus.OVERDUE;
      } else {
        status = InvoiceStatus.ISSUED;
      }
    }

    return tx.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid, status },
    });
  }

  private async nextInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { organizationId, invoiceNumber: { startsWith: `INV-${year}-` } },
    });
    return `INV-${year}-${(count + 1).toString().padStart(4, "0")}`;
  }
}
