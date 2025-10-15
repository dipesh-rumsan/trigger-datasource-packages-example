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

  findOne(id: number) {
    return `This action returns a #${id} sourceDatum`;
  }

  update(id: number) {
    return `This action updates a #${id} sourceDatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} sourceDatum`;
  }
}
