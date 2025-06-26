import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'Test', description: 'desc' };
      (service['prisma'].category.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...dto,
      });
      const result = await service.create(dto as any);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      (service['prisma'].category.findMany as jest.Mock).mockResolvedValue(
        mockCategories,
      );
      const result = await service.findAll();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      (service['prisma'].category.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'A',
      });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, name: 'A' });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      (service['prisma'].category.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'B',
      });
      const result = await service.update(1, { name: 'B' } as any);
      expect(result).toEqual({ id: 1, name: 'B' });
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      (service['prisma'].category.delete as jest.Mock).mockResolvedValue({
        id: 1,
      });
      const result = await service.remove(1);
      expect(result).toEqual({ id: 1 });
    });
    it('should throw if category not found', async () => {
      (service['prisma'].category.delete as jest.Mock).mockRejectedValue({
        code: 'P2025',
      });
      await expect(service.remove(1)).rejects.toBeDefined();
    });
  });
});
