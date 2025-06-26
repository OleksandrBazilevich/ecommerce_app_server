import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ProductsController } from './products.controller';
import { CloudinaryService } from '../common/cloudinary.service';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
