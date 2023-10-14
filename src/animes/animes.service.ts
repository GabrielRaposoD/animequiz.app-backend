import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class AnimesService {
  constructor(private prisma: PrismaService) {}

  async getMany() {
    const animes = await this.prisma.anime.findMany();

    return animes;
  }
}
