import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    // Створюємо замовлення з товарами
    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        items: {
          create: dto.items,
        },
        // total: dto.total, // якщо потрібно
      },
      include: { items: true },
    });
    // Додаємо взаємодії (purchase) для кожного продукту
    for (const item of dto.items) {
      await this.prisma.userProductInteraction.create({
        data: {
          user_id: dto.userId,
          product_id: item.productId,
          type: 'purchase',
        },
      });
    }
    return order;
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { user: true, items: { include: { product: true } } },
    });
  }

  async findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { user: true, items: { include: { product: true } } },
    });
  }

  async update(id: number, dto: UpdateOrderDto) {
    return this.prisma.order.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.order.delete({ where: { id } });
  }
}
