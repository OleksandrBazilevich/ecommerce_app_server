import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              aggregate: jest.fn(),
            },
            category: { findMany: jest.fn() },
            review: { aggregate: jest.fn() },
          },
        },
      ],
    }).compile();
    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return products from findAll', async () => {
    const mockProducts = [{ id: 1, name: 'Test', price: 100 }];
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
    const result = await service.findAll({});
    expect(result).toEqual(mockProducts);
  });

  it('should return product from findOne', async () => {
    const mockProduct = { id: 1, name: 'Test', price: 100 };
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
    const result = await service.findOne(1);
    expect(result).toEqual(mockProduct);
  });

  it('should create product', async () => {
    const dto = {
      name: 'Test',
      description: '',
      brand: '',
      price: 100,
      categoryId: 1,
    };
    const mockProduct = { id: 1, ...dto };
    (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);
    const result = await service.create(dto as any);
    expect(result).toEqual(mockProduct);
  });
});
