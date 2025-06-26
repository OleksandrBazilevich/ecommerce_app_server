import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addToFavorites(userId: number, productId: number) {
    const favorite = await this.prisma.favorite.create({
      data: { userId, productId },
    });
    // Додаємо взаємодію (favorite) у user_product_interactions
    await this.prisma.userProductInteraction.create({
      data: {
        user_id: userId,
        product_id: productId,
        type: 'favorite',
      },
    });
    return favorite;
  }

  async removeFromFavorites(userId: number, productId: number) {
    return this.prisma.favorite.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async getUserFavorites(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { product: { include: { images: true, category: true } } },
    });
  }
}
