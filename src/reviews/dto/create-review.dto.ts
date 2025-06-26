import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  productId: number;

  @IsString()
  content: string;

  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  pros?: string;

  @IsOptional()
  @IsString()
  cons?: string;
}
