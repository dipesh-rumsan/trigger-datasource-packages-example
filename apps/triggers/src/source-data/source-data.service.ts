import { Prisma } from '@lib/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SourceDataService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create() {
    const post: Prisma.PostCreateInput = {
      title: 'Hello World',
      content: 'This is a test post',
      published: true,
      author: {
        connect: { id: 1 },
      },
    };
    return this.prisma.post.create({ data: post });
  }

  findAll() {
    return this.prisma.post.findMany({
      include: {
        author: true,
      },
    });
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
