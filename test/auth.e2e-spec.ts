import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../src/auth/email-confirmed.guard';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e, mock db)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            password: 'test1234',
            role: 'USER',
            isEmailConfirmed: true,
          }),
        },
      })
      .overrideProvider('AuthService')
      .useValue({
        login: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          accessToken: 'mocked-token',
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
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

  it('/auth/login (POST) should return mocked user token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'test1234' })
      .expect(201);
    expect(res.body.email).toBe('test@example.com');
  });
});
