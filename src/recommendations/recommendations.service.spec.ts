import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = () => ({
  userProductInteraction: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
  },
  productSimilarity: {
    findMany: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
});

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useFactory: mockPrisma },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return popular products if user has no interactions', async () => {
    prisma.userProductInteraction.findMany.mockResolvedValue([]);
    prisma.userProductInteraction.groupBy.mockResolvedValue([
      { product_id: 1, _count: { product_id: 10 } },
      { product_id: 2, _count: { product_id: 8 } },
    ]);
    const result = await service.getUserRecommendations(123, 2);
    expect(prisma.userProductInteraction.groupBy).toHaveBeenCalledWith({
      by: ['product_id'],
      _count: { product_id: true },
      orderBy: { _count: { product_id: 'desc' } },
      take: 2,
    });
    expect(result).toEqual([1, 2]);
  });

  it('should return recommended products for user with interactions (collaborative + content-based)', async () => {
    // 1. User has interacted with product 1
    prisma.userProductInteraction.findMany
      .mockResolvedValueOnce([{ product_id: 1 }]) // userInteractions
      .mockResolvedValueOnce([{ user_id: 2 }]) // similarUsers
      .mockResolvedValueOnce([{ product_id: 2, type: 'favorite' }]); // collaborative
    prisma.review.findMany.mockResolvedValueOnce([]); // no reviews
    prisma.productSimilarity.findMany.mockResolvedValueOnce([
      { similar_product_id: 3, score: 0.8 },
    ]);
    prisma.product.findMany.mockResolvedValueOnce([
      { id: 2, name: 'Product 2' },
      { id: 3, name: 'Product 3' },
    ]);

    const result = await service.getUserRecommendations(1, 2);
    expect(result).toEqual([
      { id: 2, name: 'Product 2' },
      { id: 3, name: 'Product 3' },
    ]);
  });

  it('should apply negative weight for bad review in collaborative', async () => {
    prisma.userProductInteraction.findMany
      .mockResolvedValueOnce([{ product_id: 1 }]) // userInteractions
      .mockResolvedValueOnce([{ user_id: 2 }]) // similarUsers
      .mockResolvedValueOnce([{ product_id: 2, type: 'review' }]); // collaborative
    prisma.review.findMany.mockResolvedValueOnce([{ productId: 2, rating: 1 }]);
    prisma.productSimilarity.findMany.mockResolvedValueOnce([]);
    prisma.product.findMany.mockResolvedValueOnce([
      { id: 2, name: 'Product 2' },
    ]);

    const result = await service.getUserRecommendations(1, 1);
    expect(result).toEqual([{ id: 2, name: 'Product 2' }]);
  });

  it('should return empty array if no recommendations found', async () => {
    prisma.userProductInteraction.findMany
      .mockResolvedValueOnce([{ product_id: 1 }]) // userInteractions
      .mockResolvedValueOnce([]) // similarUsers
      .mockResolvedValueOnce([]); // collaborative
    prisma.review.findMany.mockResolvedValueOnce([]);
    prisma.productSimilarity.findMany.mockResolvedValueOnce([]);
    prisma.product.findMany.mockResolvedValueOnce([]);

    const result = await service.getUserRecommendations(1, 2);
    expect(result).toEqual([]);
  });

  it('should combine collaborative and content-based scores correctly', async () => {
    prisma.userProductInteraction.findMany
      .mockResolvedValueOnce([{ product_id: 1 }]) // userInteractions
      .mockResolvedValueOnce([{ user_id: 2 }]) // similarUsers
      .mockResolvedValueOnce([
        { product_id: 2, type: 'favorite' },
        { product_id: 3, type: 'purchase' },
      ]); // collaborative
    prisma.review.findMany.mockResolvedValueOnce([]);
    prisma.productSimilarity.findMany.mockResolvedValueOnce([
      { similar_product_id: 2, score: 0.5 },
      { similar_product_id: 3, score: 0.9 },
    ]);
    prisma.product.findMany.mockResolvedValueOnce([
      { id: 3, name: 'Product 3' },
      { id: 2, name: 'Product 2' },
    ]);

    const result = await service.getUserRecommendations(1, 2);
    // Перевіряємо, що повертаються саме ті продукти, які очікуємо
    expect(result.map((p: any) => p.id)).toEqual([3, 2]);
  });
});
