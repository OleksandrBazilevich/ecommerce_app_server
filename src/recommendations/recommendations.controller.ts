import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailConfirmedGuard } from '../auth/email-confirmed.guard';

@Controller('recommendations')
@UseGuards(JwtAuthGuard, EmailConfirmedGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  getUserRecommendations(@Req() req, @Query('limit') limit?: string) {
    return this.recommendationsService.getUserRecommendations(
      req.user.userId,
      limit ? +limit : 10,
    );
  }
}
