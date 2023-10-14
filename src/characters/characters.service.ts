import { GetCharactersQueryDto } from './dto/get-characters-query.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class CharactersService {
  constructor(private prisma: PrismaService) {}

  async getMany(query: GetCharactersQueryDto) {
    const characters = await this.prisma.character.findMany({
      where: {
        NOT: [
          {
            image: {
              contains:
                'https://s4.anilist.co/file/anilistcdn/character/large/default.jpg',
            },
          },
        ],
        OR: [
          {
            name: {
              startsWith: query.name || '',
              mode: 'insensitive',
            },
          },
          {
            animes: {
              some: {
                title: {
                  contains: query.name || '',
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            animes: {
              some: {
                sequels: {
                  some: {
                    title: {
                      contains: query.name || '',
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          },
        ],
      },
      orderBy: {
        name: 'asc',
      },
      take: 300,
      include: {
        animes: {
          take: 1,
          orderBy: {
            year: 'desc',
          },
          include: {
            sequels: true,
          },
        },
      },
    });

    return characters;
  }
}
