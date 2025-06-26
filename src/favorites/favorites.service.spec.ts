import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: {
            favorite: {
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
            userProductInteraction: { create: jest.fn() },
          },
        },
      ],
    }).compile();
    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToFavorites', () => {
    it('should add product to favorites', async () => {
      (service['prisma'].favorite.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        productId: 2,
      });
      (
        service['prisma'].userProductInteraction.create as jest.Mock
      ).mockResolvedValue({});
      const result = await service.addToFavorites(1, 2);
      expect(result).toEqual({
        id: 1,
        userId: 1,
        productId: 2,
      });
    });
  });

  describe('getUserFavorites', () => {
    it('should return all favorites for user', async () => {
      (service['prisma'].favorite.findMany as jest.Mock).mockResolvedValue([
        { id: 1, productId: 2 },
        { id: 2, productId: 3 },
      ]);
      const result = await service.getUserFavorites(1);
      expect(result).toEqual([
        { id: 1, productId: 2 },
        { id: 2, productId: 3 },
      ]);
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove product from favorites', async () => {
      (service['prisma'].favorite.delete as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        productId: 2,
      });
      const result = await service.removeFromFavorites(1, 2);
      expect(result).toEqual({
        id: 1,
        userId: 1,
        productId: 2,
      });
    });
    it('should throw if favorite not found', async () => {
      (service['prisma'].favorite.delete as jest.Mock).mockRejectedValue({
        code: 'P2025',
      });
      await expect(service.removeFromFavorites(1, 2)).rejects.toBeDefined();
    });
  });
});
