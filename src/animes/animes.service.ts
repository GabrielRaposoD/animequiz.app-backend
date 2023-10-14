import { GetAnimesQueryDto } from './dto/get-animes-query.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class AnimesService {
  constructor(private prisma: PrismaService) {}

  async getMany(query: GetAnimesQueryDto) {
    const animes = await this.prisma.anime.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query.title || '',
              mode: 'insensitive',
            },
          },
          {
            sequels: {
              some: {
                title: {
                  contains: query.title || '',
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      orderBy: {
        title: 'asc',
      },
      take: 300,
    });

    return animes;
  }
}
