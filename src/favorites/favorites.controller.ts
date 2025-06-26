import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../auth/email-confirmed.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard, EmailConfirmedGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  addToFavorites(@Req() req, @Param('productId') productId: string) {
    return this.favoritesService.addToFavorites(req.user.userId, +productId);
  }

  @Delete(':productId')
  removeFromFavorites(@Req() req, @Param('productId') productId: string) {
    return this.favoritesService.removeFromFavorites(
      req.user.userId,
      +productId,
    );
  }

  @Get()
  getUserFavorites(@Req() req) {
    return this.favoritesService.getUserFavorites(req.user.userId);
  }
}
