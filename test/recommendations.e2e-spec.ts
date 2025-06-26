import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../src/auth/email-confirmed.guard';

describe('RecommendationsController (e2e, mock db)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        userProductInteraction: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 1,
              user_id: 1,
              product_id: 1,
              interaction_type: 'FAVORITE',
              type: 'favorite',
            },
          ]),
          groupBy: jest
            .fn()
            .mockResolvedValue([{ product_id: 1, _count: { product_id: 10 } }]),
        },
        review: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        productSimilarity: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 1,
              name: 'Recommended',
              images: [],
              category: null,
              reviews: [],
            },
          ]),
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 1, role: 'USER' };
          return true;
        },
      })
      .overrideGuard(EmailConfirmedGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/recommendations (GET) should return mocked recommendations', async () => {
    const res = await request(app.getHttpServer())
      .get('/recommendations')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Recommended');
  });
});
