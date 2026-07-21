import { IsNumber, IsOptional, IsString, Min, MaxLength, MinLength } from "class-validator";

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sku!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
