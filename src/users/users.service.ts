import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from '../../generated/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 20, search } = params;
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailConfirmed: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRole(id: number, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() as $Enums.Role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async blockUser(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { isEmailConfirmed: false, role: $Enums.Role.GUEST },
      select: { id: true, email: true, isEmailConfirmed: true, role: true },
    });
  }

  async deleteUser(id: number) {
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailConfirmed: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
