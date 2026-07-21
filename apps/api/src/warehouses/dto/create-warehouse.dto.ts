import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateWarehouseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
