import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SourceDataService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create() {
    return '"This action adds a new sourceDatum';
  }

  findAll() {
    return this.prisma;
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
