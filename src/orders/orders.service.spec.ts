import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            orderItem: { create: jest.fn() },
            userProductInteraction: { create: jest.fn() }, // додано мок
          },
        },
      ],
    }).compile();
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const dto = { userId: 1, items: [{ productId: 2, quantity: 1 }] };
      (service['prisma'].order.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...dto,
      });
      const result = await service.create(dto as any);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        { id: 1, userId: 1 },
        { id: 2, userId: 2 },
      ];
      (service['prisma'].order.findMany as jest.Mock).mockResolvedValue(
        mockOrders,
      );
      const result = await service.findAll();
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      (service['prisma'].order.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
      });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, userId: 1 });
    });
    it('should return null if order not found', async () => {
      (service['prisma'].order.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      (service['prisma'].order.update as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
      });
      const result = await service.update(1, { userId: 1 } as any);
      expect(result).toEqual({ id: 1, userId: 1 });
    });
    it('should throw if order not found', async () => {
      (service['prisma'].order.update as jest.Mock).mockRejectedValue({
        code: 'P2025',
      });
      await expect(
        service.update(1, { userId: 1 } as any),
      ).rejects.toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove an order', async () => {
      (service['prisma'].order.delete as jest.Mock).mockResolvedValue({
        id: 1,
      });
      const result = await service.remove(1);
      expect(result).toEqual({ id: 1 });
    });
    it('should throw if order not found', async () => {
      (service['prisma'].order.delete as jest.Mock).mockRejectedValue({
        code: 'P2025',
      });
      await expect(service.remove(1)).rejects.toBeDefined();
    });
  });
});
