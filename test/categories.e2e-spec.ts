import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../src/auth/email-confirmed.guard';
import { RolesGuard } from '../src/auth/roles.guard';

describe('CategoriesController (e2e, mock db)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        category: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 1, name: 'Test Category' }]),
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 1, name: 'Test Category' }),
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
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/categories (GET) should return mocked categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Test Category');
  });

  it('/categories/:id (GET) should return mocked category', async () => {
    const res = await request(app.getHttpServer())
      .get('/categories/1')
      .expect(200);
    expect(res.body.name).toBe('Test Category');
  });
});
