import { Config } from '@prisma/client';
import { CreateGameDto } from './dto/create-game.dto';
import { Injectable } from '@nestjs/common';
import Prando from 'prando';
import { PrismaService } from '@/prisma.service';
import { UpdateGameDto } from './dto/update-game.dto';
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
}
