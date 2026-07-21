import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { InvoicesService } from "../invoices/invoices.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, organizationId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "VOID") {
      throw new ConflictException("Can't record a payment against a voided invoice");
    }

    const { payment } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          organizationId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          method: dto.method,
          status: PaymentStatus.COMPLETED,
          reference: dto.reference,
        },
      });

      await this.invoicesService.recomputeStatus(tx, dto.invoiceId);

      return { payment: created };
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "PAYMENT_RECORDED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { invoiceId: dto.invoiceId, amount: dto.amount, method: dto.method },
    });

    return payment;
  }

  async findAll(organizationId: string, invoiceId?: string) {
    return this.prisma.payment.findMany({
      where: { organizationId, ...(invoiceId ? { invoiceId } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(organizationId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, organizationId } });
    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }
}
