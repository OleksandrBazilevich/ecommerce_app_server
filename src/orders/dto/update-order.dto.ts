import { IsNumber, IsArray, IsOptional } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsArray()
  productIds?: number[];

  @IsOptional()
  @IsNumber()
  total?: number;
}
