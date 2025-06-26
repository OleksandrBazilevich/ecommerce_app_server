import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../src/auth/email-confirmed.guard';
import { RolesGuard } from '../src/auth/roles.guard';

describe('UsersController (e2e, mock db)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 1,
              email: 'test@example.com',
              name: 'Test',
              role: 'USER',
              isEmailConfirmed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
          findUnique: jest.fn().mockImplementation((args) => {
            if (args && args.where && args.where.id === 1) {
              const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test',
                role: 'USER',
                isEmailConfirmed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              if (args.select) {
                const selected = {};
                for (const key of Object.keys(args.select)) {
                  selected[key] = user[key];
                }
                return Promise.resolve(selected);
              }
              return Promise.resolve(user);
            }
            return null;
          }),
          findFirst: jest.fn().mockImplementation((args) => {
            if (args && args.where && args.where.id === 1) {
              return Promise.resolve({
                id: 1,
                email: 'test@example.com',
                name: 'Test',
                role: 'USER',
                isEmailConfirmed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
            return null;
          }),
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
    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) should return mocked users', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toBe('test@example.com');
  });

  it('/users/:id (GET) should return mocked user', async () => {
    const res = await request(app.getHttpServer()).get('/users/1').expect(200);
    expect(res.body.email).toBe('test@example.com');
  });
});
