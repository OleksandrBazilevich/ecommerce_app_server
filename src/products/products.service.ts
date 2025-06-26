import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 20, search } = params;
    return this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: true,
        reviews: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        reviews: true,
      },
    });
  }

  async create(dto: CreateProductDto) {
    if (!dto) {
      throw new Error('Request body is missing');
    }
    if (dto.price === undefined || dto.categoryId === undefined) {
      throw new Error('price and categoryId are required');
    }
    const price = Number(dto.price);
    const categoryId = Number(dto.categoryId);
    const images = Array.isArray(dto.images)
      ? dto.images.filter((url) => url)
      : [];
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        brand: dto.brand,
        price,
        categoryId,
        thumbnail: dto.thumbnail,
        images:
          images.length > 0
            ? { create: images.map((url) => ({ url })) }
            : undefined,
      },
      include: {
        category: true,
        images: true,
        reviews: true,
      },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const { images, ...data } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: images
          ? {
              deleteMany: {},
              create: images.map((url) => ({ url })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
        reviews: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getFilters() {
    // Категорії
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    // Унікальні бренди
    const brands = await this.prisma.product.findMany({
      distinct: ['brand'],
      select: { brand: true },
      where: { brand: { not: '' } },
      orderBy: { brand: 'asc' },
    });
    // Мін/макс ціна
    const minPrice = await this.prisma.product.aggregate({
      _min: { price: true },
    });
    const maxPrice = await this.prisma.product.aggregate({
      _max: { price: true },
    });
    // Мін/макс рейтинг з Review
    const minRating = await this.prisma.review.aggregate({
      _min: { rating: true },
    });
    const maxRating = await this.prisma.review.aggregate({
      _max: { rating: true },
    });
    return {
      categories,
      brands: brands.map((b) => b.brand),
      priceRange: [minPrice._min.price ?? 0, maxPrice._max.price ?? 0],
      ratingRange: [minRating._min.rating ?? 0, maxRating._max.rating ?? 5],
    };
  }
}
