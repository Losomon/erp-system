import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { AuthModule } from "../auth/auth.module";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [AuthModule, InvoicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
