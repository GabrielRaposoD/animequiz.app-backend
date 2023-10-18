import { Config, Prisma } from '@prisma/client';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { GetUnlimitedQueryDto } from './dto/get-unlimited-query';
import Prando from 'prando';
import { PrismaService } from '@/prisma.service';
import { SuccessDto } from './dto/success';
import { differenceInDays } from 'date-fns';
import { nanoid } from 'nanoid';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async getTodaysAnime() {
    const currentSeed = await this.getSeed();

    const rng = new Prando(currentSeed!.seed);

    const anime = await this.prisma.anime.findMany({
      skip: rng.nextInt(1, currentSeed.animeCount) - 1,
      take: 1,
      orderBy: {
        id: 'asc',
      },
    });

    return { data: anime[0], seed: currentSeed };
  }

  async getTodaysCharacter() {
    const currentSeed = await this.getSeed();

    const rng = new Prando(currentSeed!.seed);

    const anime = await this.prisma.character.findMany({
      skip: rng.nextInt(1, currentSeed.characterCount) - 1,
      take: 1,
      orderBy: {
        id: 'asc',
      },
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

    return { data: anime[0], seed: currentSeed };
  }

  async getTodaysCharacterAnime() {
    const currentSeed = await this.getSeed();

    const rng = new Prando(currentSeed!.seed);

    rng.nextInt(1, currentSeed.characterCount);

    const anime = await this.prisma.character.findMany({
      skip: rng.nextInt(1, currentSeed.characterCount) - 1,
      take: 1,
      orderBy: {
        id: 'asc',
      },
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

    return { data: anime[0], seed: currentSeed };
  }

  async getTimeUntilNewSeed() {
    const config = (await this.prisma.config.findFirst()) as Config;

    const date = new Date(config.createdAt);

    const currentDay = differenceInDays(new Date(), config.createdAt);

    date.setDate(date.getDate() + currentDay + 1);

    return date;
  }

  async getSeed() {
    const config = (await this.prisma.config.findFirst({})) as Config;

    const currentDay = differenceInDays(new Date(), config.createdAt);

    const seeds = await this.prisma.seed.findMany({});

    const todaysSeed = seeds.find((seed) => seed.day === currentDay);

    if (todaysSeed) {
      return todaysSeed;
    }

    const characterCount = await this.prisma.character.count();
    const animeCount = await this.prisma.anime.count();
    const seed = nanoid(64);

    return await this.prisma.seed.create({
      data: {
        seed,
        day: currentDay,
        animeCount: animeCount,
        characterCount: characterCount,
        config: {
          connect: {
            id: config.id,
          },
        },
      },
    });
  }

  async success(body: SuccessDto) {
    const seed = await this.prisma.seed.findUnique({
      where: {
        id: body.seedId,
      },
    });

    if (!seed) {
      throw new HttpException('Seed not found', HttpStatus.NOT_FOUND);
    }

    const info = seed.info as Prisma.JsonArray;

    info.forEach((i: any) => {
      if (i['game'] === body.game) {
        i['success'] = i['success'] + 1;
        i['tries'] = i['tries'] + body.tries;
      }
    });

    await this.prisma.seed.update({
      where: {
        id: body.seedId,
      },
      data: {
        info,
      },
    });

    return 'success';
  }

  async getRandomCharacterOptions(query: GetUnlimitedQueryDto) {
    let charactersCount = await this.prisma.character.count({
      where: {
        apiId: {
          notIn: query.blacklist,
        },
        animes: {
          some: {
            score: {
              gt: query.minScore,
            },
          },
        },
      },
    });

    query.blacklist = query.blacklist || [];

    let random = Math.floor(Math.random() * charactersCount);

    const correctCharacter = await this.prisma.character.findMany({
      where: {
        apiId: {
          notIn: query.blacklist,
        },
        animes: {
          some: {
            score: {
              gt: query.minScore,
            },
          },
        },
      },
      skip: random,
      take: 1,
      select: {
        apiId: true,
        name: true,
        image: true,
        animes: {
          orderBy: {
            year: 'desc',
          },
          take: 1,
        },
      },
    });

    query.blacklist.push(correctCharacter[0].apiId);
    const animeBlacklist = [correctCharacter[0].animes[0].apiId];

    const randomCharacters = await Promise.all(
      [1, 2, 3].map(async () => {
        charactersCount = await this.prisma.character.count({
          where: {
            apiId: {
              notIn: query.blacklist,
            },
            animes: {
              some: {
                score: {
                  gt: query.minScore,
                },
                apiId: {
                  notIn: animeBlacklist,
                },
              },
            },
          },
        });

        random = Math.floor(Math.random() * charactersCount);

        const character = await this.prisma.character.findMany({
          where: {
            apiId: {
              notIn: query.blacklist,
            },
            animes: {
              some: {
                score: {
                  gt: query.minScore,
                },
                apiId: {
                  notIn: animeBlacklist,
                },
              },
            },
          },
          skip: random,
          take: 1,
          select: {
            apiId: true,
            name: true,
            image: true,
            animes: {
              orderBy: {
                year: 'desc',
              },
              take: 1,
            },
          },
        });

        query.blacklist.push(character[0].apiId);
        animeBlacklist.push(character[0].animes[0].apiId);

        return character[0];
      }),
    );

    return { correct: correctCharacter[0], random: randomCharacters };
  }

  async getRandomAnimeOptions(query: GetUnlimitedQueryDto) {
    let animesCount = await this.prisma.anime.count({
      where: {
        apiId: {
          notIn: query.blacklist,
        },
        score: {
          gt: query.minScore,
        },
      },
    });

    query.blacklist = query.blacklist || [];

    let random = Math.floor(Math.random() * animesCount) - 1;

    const correctAnime = await this.prisma.anime.findMany({
      where: {
        apiId: {
          notIn: query.blacklist,
        },
        score: {
          gt: query.minScore,
        },
      },
      skip: random,
      take: 1,
      select: {
        apiId: true,
        title: true,
        image: true,
      },
    });

    query.blacklist.push(correctAnime[0].apiId);
    animesCount = animesCount - 1;

    const randomAnimes = await Promise.all(
      [1, 2, 3].map(async () => {
        random = Math.floor(Math.random() * animesCount);

        const anime = await this.prisma.anime.findMany({
          where: {
            apiId: {
              notIn: query.blacklist,
            },
            score: {
              gt: query.minScore,
            },
          },
          skip: random,
          take: 1,
          select: {
            apiId: true,
            title: true,
            image: true,
          },
        });

        query.blacklist.push(anime[0].apiId);
        animesCount = animesCount - 1;

        return anime[0];
      }),
    );

    return { correct: correctAnime[0], random: randomAnimes };
  }
}
