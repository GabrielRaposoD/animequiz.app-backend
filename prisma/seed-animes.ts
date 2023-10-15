import { Prisma, PrismaClient } from '@prisma/client';
import { parallel, sleep, try as tryit } from 'radash';

import { assign } from 'radash';
import { getCountryName } from '../src/lib/getCountryName';

const prisma = new PrismaClient();

const query = `query ($page: Int) {
  Page (page: $page, perPage: 50) {
      pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
      }
      media(type: ANIME, sort: [SCORE_DESC, START_DATE_DESC], isAdult: false, format: TV) {  
          id 
          relations{
              edges {
                  relationType
                      node {
                          id
                          title {
                              romaji
                          }
                      }
                  }      
              }
          isAdult
          episodes
          genres
          format
          source
          duration
          idMal
          averageScore
          season
          seasonYear
          countryOfOrigin
          studios {
              nodes{
                  name
              }
          }
          coverImage {
              extraLarge
          }
          startDate {
              year
          }
          episodes
          id
          title {
              romaji
          }
      }     
  }
}`;

const FETCH_AMOUNT = 88;

const whitelist = ['21'];

async function main() {
  let config = await prisma.config.findFirst({});

  if (!config) {
    config = await prisma.config.create({
      data: {},
    });
  }

  let page = 1;

  const _ = [...Array(FETCH_AMOUNT).keys()];

  const [err, data] = await tryit(parallel)(1, _, async (i) => {
    const data = await fetch(process.env.ANIME_API_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: { page: page + i },
      }),
    });

    const res = await data.json();

    const animes = res.data.Page.media;

    const parsedData = animes.reduce(
      (
        acc: {
          [k: string]: Prisma.AnimeCreateInput & { relations: any[] };
        },
        anime: any,
      ) => {
        if (anime.type === 'MANGA' || anime.format !== 'TV' || anime.isAdult) {
          return acc;
        }

        const relations: any[] = [];

        anime.relations.edges.forEach((edge: any) => {
          const relation = edge.relationType;
          const id = edge.node.id.toString();

          if (
            relation === 'PREQUEL' ||
            relation === 'SEQUEL' ||
            relation === 'ALTERNATIVE'
          ) {
            relations.push({
              id: id,
              type: relation,
              title: edge.node.title.romaji,
            });
          }
        });

        const id = anime.id.toString();

        acc[id] = {
          apiId: id,
          title: anime.title.romaji,
          image: anime.coverImage.extraLarge,
          episodes: anime.episodes ?? -1,
          genres: anime.genres,
          format: anime.format,
          source: anime.source ?? 'UNKNOWN',
          season: anime.season ?? 'UNKNOWN',
          year: anime.seasonYear ?? anime.startDate.year ?? -1,
          studios: anime.studios.nodes.map((studio: any) => studio.name),
          relations: relations,
          duration: anime.duration ?? -1,
          score: anime.averageScore ?? -1,
          malId: anime.idMal ?? -1,
          countryOfOrigin: getCountryName(anime.countryOfOrigin),
        };

        return acc;
      },
      {},
    );

    await sleep(1000);

    return await parsedData;
  });

  const flatData = data!
    .flatMap((d) => d)
    .reduce((acc, d) => {
      return assign(acc, d);
    }, {});

  const animesData: Array<Prisma.AnimeCreateInput & { relations: any[] }> =
    Object.values(flatData);

  const parsedAnimes = animesData.reduce(
    (acc, anime) => {
      const blacklisted = acc.blacklist.includes(anime.apiId);

      if (blacklisted) {
        return acc;
      }

      const prequel = anime.relations.filter((a: any) => a.type === 'PREQUEL');
      const sequels = anime.relations.filter((a: any) => a.type === 'SEQUEL');

      if (prequel.length === 0 || whitelist.includes(anime.apiId)) {
        const sequelsId = sequels.map((a: any) => a.id);
        acc.blacklist = [...acc.blacklist, ...sequelsId];
        acc.animes[anime.apiId] = {
          ...anime,
          relations: sequels.map((a: any) => {
            return {
              title: a.title,
              apiId: a.id,
            };
          }),
        };
      }

      return acc;
    },
    { animes: {}, blacklist: [] } as {
      animes: {
        [k: string]: Prisma.AnimeCreateInput & { relations: any[] };
      };
      blacklist: string[];
    },
  );

  const parsedAnimesValues: Array<
    Prisma.AnimeCreateInput & { relations: any[] }
  > = Object.values(parsedAnimes.animes);

  const animes = await parallel(1, parsedAnimesValues, async (anime) => {
    const { relations, ...data } = anime;
    return await prisma.anime.upsert({
      where: {
        apiId: anime.apiId,
      },
      create: data,
      update: data,
    });
  });

  await parallel(1, parsedAnimesValues, async (anime) => {
    if (anime.relations.length === 0) return;

    return await prisma.sequel.createMany({
      data: anime.relations.map((relation) => ({
        animeApiId: anime.apiId,
        title: relation.title,
        apiId: relation.apiId,
      })),
      skipDuplicates: true,
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
