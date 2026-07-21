import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class SalesOrderItemInput {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  /** Optional override — defaults to the product's current price. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
