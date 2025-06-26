import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto) {
    // Перевірка: чи купував користувач цей товар
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          userId: dto.userId,
          status: { in: ['PAID', 'SHIPPED'] },
        },
      },
    });
    if (!orderItem) {
      throw new Error('You can only review products you have purchased');
    }
    const review = await this.prisma.review.create({
      data: {
        userId: dto.userId,
        productId: dto.productId,
        rating: dto.rating,
        text: dto.content,
      },
    });
    // Додаємо взаємодію (review) у user_product_interactions
    await this.prisma.userProductInteraction.create({
      data: {
        user_id: dto.userId,
        product_id: dto.productId,
        type: 'review',
      },
    });
    return review;
  }

  async findAll(filter?: { moderated?: boolean }) {
    return this.prisma.review.findMany({
      where:
        filter?.moderated !== undefined
          ? { moderated: filter.moderated }
          : undefined,
      include: { user: true, product: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.review.findUnique({
      where: { id },
      include: { user: true, product: true },
    });
  }

  async update(id: number, dto: UpdateReviewDto) {
    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        text: dto.content,
      },
    });
  }

  async moderate(id: number, moderated: boolean) {
    return this.prisma.review.update({
      where: { id },
      data: { moderated },
    });
  }

  async remove(id: number) {
    return this.prisma.review.delete({ where: { id } });
  }
}
