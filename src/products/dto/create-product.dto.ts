import { IsString, IsNumber, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  brand: string;

  @IsNumber()
  price: number;

  @IsNumber()
  categoryId: number;

  @IsString()
  thumbnail: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];
}
