import { IsInt, IsOptional, Min } from "class-validator";

export class GenerateInvoiceDto {
  /** Days from now until the invoice is due. Defaults to 14. */
  @IsOptional()
  @IsInt()
  @Min(0)
  dueInDays?: number;
}
