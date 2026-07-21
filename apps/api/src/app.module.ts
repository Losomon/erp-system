import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { CustomersModule } from "./customers/customers.module";
import { ProductsModule } from "./products/products.module";
import { WarehousesModule } from "./warehouses/warehouses.module";
import { InventoryModule } from "./inventory/inventory.module";
import { SalesOrdersModule } from "./sales-orders/sales-orders.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PaymentsModule } from "./payments/payments.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    OrganizationsModule,
    CustomersModule,
    ProductsModule,
    WarehousesModule,
    InventoryModule,
    SalesOrdersModule,
    InvoicesModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
