import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Body('skip') skip?: number,
    @Body('take') take?: number,
    @Body('search') search?: string,
  ) {
    return this.usersService.findAll({
      skip,
      take,
      search,
    });
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string,
  ) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/block')
  @Roles('ADMIN')
  async blockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.blockUser(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }

  @Get('me')
  async getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.getProfile(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
