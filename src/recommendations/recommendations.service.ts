import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Комбіновані рекомендації: collaborative + content-based + популярні
  async getUserRecommendations(userId: number, limit = 10) {
    // 1. Продукти, з якими взаємодіяв користувач
    const userInteractions = await this.prisma.userProductInteraction.findMany({
      where: { user_id: userId },
      select: { product_id: true },
    });
    const interactedProductIds = userInteractions.map((i) => i.product_id);

    // Якщо користувач не взаємодіяв — повертаємо популярні товари
    if (!interactedProductIds.length) {
      const popular = await this.prisma.userProductInteraction.groupBy({
        by: ['product_id'],
        _count: { product_id: true },
        orderBy: { _count: { product_id: 'desc' } },
        take: limit,
      });
      return popular.map((row) => row.product_id);
    }

    // 2. Collaborative: продукти, з якими взаємодіяли схожі користувачі
    const similarUsers = await this.prisma.userProductInteraction.findMany({
      where: {
        product_id: { in: interactedProductIds },
        user_id: { not: userId },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    });
    const similarUserIds = similarUsers.map((u) => u.user_id);
    // Враховуємо вагу типу взаємодії
    const collaborative = await this.prisma.userProductInteraction.findMany({
      where: {
        user_id: { in: similarUserIds },
        product_id: { notIn: interactedProductIds },
      },
      select: { product_id: true, type: true },
    });
    // Визначаємо вагу для кожного типу
    // view = 1, favorite = 500, purchase = 2500, review = 3000 (максимум)
    const typeWeight = { view: 1, favorite: 500, purchase: 2500, review: 3000 };
    // Отримаємо всі review для relevant product_id
    const reviewMap: Record<string, number> = {};
    const reviewRows = await this.prisma.review.findMany({
      where: {
        productId: { in: collaborative.map((row) => row.product_id) },
      },
      select: { productId: true, rating: true },
    });
    reviewRows.forEach((r) => {
      reviewMap[r.productId] = r.rating;
    });
    const collaborativeScores: Record<string, number> = {};
    collaborative.forEach((row) => {
      let w = typeWeight[row.type] || 1;
      if (row.type === 'review') {
        // Якщо є review — враховуємо рейтинг
        const rating = reviewMap[row.product_id];
        if (rating) {
          if (rating <= 2) {
            w = -1000; // негативний вплив
          } else if (rating === 3) {
            w = 0; // нейтрально
          } else {
            w = 3000 * (rating / 5); // позитивний вплив
          }
        }
      }
      collaborativeScores[row.product_id] =
        (collaborativeScores[row.product_id] || 0) + w * 0.6;
    });

    // 3. Content-based: схожі продукти з product_similarity
    const contentBased = await this.prisma.productSimilarity.findMany({
      where: { product_id: { in: interactedProductIds } },
      select: { similar_product_id: true, score: true },
    });
    const contentScores: Record<string, number> = {};
    contentBased.forEach((row) => {
      contentScores[row.similar_product_id] =
        (contentScores[row.similar_product_id] || 0) + row.score * 0.4;
    });

    // 4. Об'єднуємо, сумуємо ваги, унікальні продукти
    const allScores: Record<string, number> = { ...collaborativeScores };
    for (const [pid, score] of Object.entries(contentScores)) {
      allScores[pid] = (allScores[pid] || 0) + score;
    }

    // 5. Сортуємо, повертаємо топ-10 id
    const sorted = Object.entries(allScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => Number(id));
    // Повертаємо повні дані про продукти
    return this.prisma.product.findMany({
      where: { id: { in: sorted } },
      include: { images: true, category: true, reviews: true },
    });
  }
}
