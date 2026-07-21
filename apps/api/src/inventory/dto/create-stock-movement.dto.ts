import { IsEnum, IsInt, IsOptional, IsString, NotEquals } from "class-validator";
import { StockMovementType } from "@prisma/client";

export class CreateStockMovementDto {
  @IsString()
  productId!: string;

  @IsString()
  warehouseId!: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  /** Signed delta: positive adds stock, negative removes it. */
  @IsInt()
  @NotEquals(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
