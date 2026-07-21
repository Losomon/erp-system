import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: { ...dto, organizationId },
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "CUSTOMER_CREATED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { name: customer.name },
    });

    return customer;
  }

  async findAll(organizationId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
      include: { contacts: true },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async update(organizationId: string, userId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(organizationId, id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      organizationId,
      userId,
      action: "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { changes: dto },
    });

    return customer;
  }

  async remove(organizationId: string, userId: string, id: string) {
    await this.findOne(organizationId, id);

    try {
      await this.prisma.customer.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictException(
          "This customer has sales orders or invoices and can't be deleted. Archive it instead.",
        );
      }
      throw err;
    }

    await this.audit.log({
      organizationId,
      userId,
      action: "CUSTOMER_DELETED",
      entityType: "Customer",
      entityId: id,
    });

    return { success: true };
  }
}
