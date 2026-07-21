import { ArrayMinSize, IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SalesOrderItemInput } from "./sales-order-item.input";

export class CreateSalesOrderDto {
  @IsString()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemInput)
  items!: SalesOrderItemInput[];
}
