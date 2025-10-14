import { Injectable } from '@nestjs/common';
import {  PrismaClient } from '@lib/database';

@Injectable()
export class SourceDataService {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async create() {
    const user = await this.prisma.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test User',
      }
    })

    console.log(`User created: ${user.id}`);

    return user;
  }

  findAll() {
    this.prisma.user.findMany();
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
