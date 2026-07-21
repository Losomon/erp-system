import { Module } from "@nestjs/common";
import { SalesOrdersService } from "./sales-orders.service";
import { SalesOrdersController } from "./sales-orders.controller";
import { AuthModule } from "../auth/auth.module";
import { InventoryModule } from "../inventory/inventory.module";

@Module({
  imports: [AuthModule, InventoryModule],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
