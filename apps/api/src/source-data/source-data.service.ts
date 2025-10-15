import { PrismaService, Prisma } from '@lib/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SourceDataService {
  constructor(
    private readonly prismaService: PrismaService
  ) {}

  async create() {
    const user: Prisma.UserCreateInput = {
      email: 'test@test.com',
      name: 'Test User',
    };

    return this.prismaService.user.create({
      data: user,
    });
  }

  async findAll() {
    return this.prismaService.user.findMany();
  }

  async testPrismaError() {
    // This will trigger a P2025 error (Record not found)
    return this.prismaService.user.update({
      where: { id: 99999 }, // Non-existent ID
      data: { name: 'Updated Name' },
    });
  }

  async findOne(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  update(id: number) {
    return `This action updates a #${id} sourceDatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} sourceDatum`;
  }
}
