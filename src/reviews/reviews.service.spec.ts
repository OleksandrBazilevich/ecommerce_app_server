import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: {
            orderItem: { findFirst: jest.fn() },
            review: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            userProductInteraction: { create: jest.fn() },
          },
        },
      ],
    }).compile();
    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if user did not purchase product', async () => {
    (prisma.orderItem.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(
      service.create({
        userId: 1,
        productId: 2,
        rating: 5,
        content: 'test',
      }),
    ).rejects.toThrow('You can only review products you have purchased');
  });

  it('should create review if user purchased product', async () => {
    (prisma.orderItem.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.review.create as jest.Mock).mockResolvedValue({ id: 1, rating: 5 });
    (prisma.userProductInteraction.create as jest.Mock).mockResolvedValue({});
    const result = await service.create({
      userId: 1,
      productId: 2,
      rating: 5,
      content: 'test',
    });
    expect(result).toEqual({ id: 1, rating: 5 });
  });

  describe('findAll', () => {
    it('should return all reviews', async () => {
      (prisma.review.findMany as jest.Mock).mockResolvedValue([
        { id: 1, rating: 5 },
        { id: 2, rating: 4 },
      ]);
      const result = await service.findAll();
      expect(result).toEqual([
        { id: 1, rating: 5 },
        { id: 2, rating: 4 },
      ]);
    });
  });

  describe('update', () => {
    it('should update a review', async () => {
      (prisma.review.update as jest.Mock).mockResolvedValue({
        id: 1,
        rating: 4,
      });
      const result = await service.update(1, { rating: 4 });
      expect(result).toEqual({
        id: 1,
        rating: 4,
      });
    });
    it('should throw if review not found', async () => {
      (prisma.review.update as jest.Mock).mockRejectedValue({ code: 'P2025' });
      await expect(service.update(1, { rating: 4 })).rejects.toBeDefined();
    });
  });

  describe('moderate', () => {
    it('should moderate a review', async () => {
      (prisma.review.update as jest.Mock).mockResolvedValue({
        id: 1,
        moderated: true,
      });
      const result = await service.moderate(1, true);
      expect(result).toEqual({
        id: 1,
        moderated: true,
      });
    });
  });

  describe('remove', () => {
    it('should remove a review', async () => {
      (prisma.review.delete as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await service.remove(1);
      expect(result).toEqual({ id: 1 });
    });
    it('should throw if review not found', async () => {
      (prisma.review.delete as jest.Mock).mockRejectedValue({ code: 'P2025' });
      await expect(service.remove(1)).rejects.toBeDefined();
    });
  });
});
