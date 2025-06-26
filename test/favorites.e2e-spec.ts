import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../src/auth/email-confirmed.guard';
import { RolesGuard } from '../src/auth/roles.guard';

describe('FavoritesController (e2e, mock db)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        favorite: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 1, userId: 1, productId: 1 }]),
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

  it('/favorites (GET) should return mocked favorites', async () => {
    const res = await request(app.getHttpServer())
      .get('/favorites')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].userId).toBe(1);
  });
});
