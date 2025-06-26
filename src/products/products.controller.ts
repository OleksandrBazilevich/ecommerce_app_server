import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { $Enums } from '../../generated/prisma';
import { CloudinaryService } from '../common/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { EmailConfirmedGuard } from '../auth/email-confirmed.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, EmailConfirmedGuard)
  @Roles($Enums.Role.ADMIN)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const thumbnailFile = files.thumbnail?.[0];
    const imagesFiles = files.images || [];

    let thumbnailUrl: string = '';
    let imageUrls: string[] = [];

    if (thumbnailFile) {
      const uploadResult =
        await this.cloudinaryService.uploadImage(thumbnailFile);
      thumbnailUrl = uploadResult.url;
    }
    if (imagesFiles.length > 0) {
      const uploadResults = await Promise.all(
        imagesFiles.map((file) => this.cloudinaryService.uploadImage(file)),
      );
      imageUrls = uploadResults.map((res) => res.url);
    }

    const productData = {
      ...createProductDto,
      thumbnail: thumbnailUrl,
      images: imageUrls,
    };
    return this.productsService.create(productData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, EmailConfirmedGuard)
  @Roles($Enums.Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, EmailConfirmedGuard)
  @Roles($Enums.Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Get('filters')
  async getFilters() {
    return this.productsService.getFilters();
  }
}
