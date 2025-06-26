import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    // @ts-expect-error: Prisma types may not include 'beforeExit' event, but it exists at runtime
    this.$on?.('beforeExit', () => {
      void app.close();
    });
  }
}
