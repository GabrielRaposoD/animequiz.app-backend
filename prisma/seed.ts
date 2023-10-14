import { Prisma, PrismaClient } from '@prisma/client';
import { parallel, sleep, try as tryit } from 'radash';

import { assign } from 'radash';
import { getCountryName } from '@/lib/getCountryName';

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
  characters {
    id   
    age
    gender
    image {
        large
    }
    name {
        full
    }
     media {
          nodes {
              relations{
                  edges{
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
              seasonYear
              season
              duration
              countryOfOrigin
              startDate {
                year
              }
              studios {
                nodes{
                    name
                }
              }
              type
              coverImage {
                  extraLarge
              }
              episodes
              id
              title {
                  romaji
              }
          }     
    }
  }
}
}`;

const FETCH_AMOUNT = 100;

const whitelist = ['21'];

async function main() {
  let config = await prisma.config.findFirst({});

  if (!config) {
    config = await prisma.config.create({
      data: {},
    });
  }

  let page = config.animePage || 1;

  const _ = [...Array(FETCH_AMOUNT).keys()];

  const [err, data] = await tryit(parallel)(2, _, async (i) => {
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

    const characters = res.data.Page.characters;

    const parsedData = characters
      .filter(
        (c: any) =>
          c.image !==
          'https://s4.anilist.co/file/anilistcdn/character/large/default.jpg',
      )
      .reduce(
        (
          acc: {
            animes: {
              [k: string]: Prisma.AnimeCreateInput & { relations: any[] };
            };
            characters: {
              [k: string]: Prisma.CharacterCreateInput & { animesId: string[] };
            };
          },
          character: any,
        ) => {
          const animesId: any[] = [];

          const filteredAnimes = character.media.nodes.filter(
            (node: any) =>
              node.type !== 'MANGA' && node.format === 'TV' && !node.isAdult,
          );

          filteredAnimes.forEach((node: any) => {
            const id = node.id.toString();
            if (!acc.animes[id]) {
              const relations: any[] = [];

              node.relations.edges.forEach((edge: any) => {
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

              acc.animes[id] = {
                apiId: id,
                title: node.title.romaji,
                image: node.coverImage.extraLarge,
                episodes: node.episodes ?? -1,
                genres: node.genres,
                format: node.format,
                source: node.source ?? 'UNKNOWN',
                season: node.season ?? 'UNKNOWN',
                year: node.seasonYear ?? node.startDate.year ?? -1,
                studios: node.studios.nodes.map((studio: any) => studio.name),
                relations: relations,
                duration: node.duration ?? -1,
                countryOfOrigin: getCountryName(node.countryOfOrigin),
              };
            }

            animesId.push(id);
          });

          if (animesId.length > 0) {
            const id = character.id.toString();
            acc.characters[id] = {
              age: character.age
                ? character.age.slice(0, 3).replace(/\D/g, '')
                : 'Unknown',
              name: character.name.full,
              image: character.image.large,
              gender: character.gender ?? 'Unknown',
              apiId: id,
              animesId: animesId,
            };
          }

          return acc;
        },
        { animes: {}, characters: {} },
      );

    await sleep(1000);

    return await parsedData;
  });

  const flatData = data!
    .flatMap((d) => d)
    .reduce((acc, d) => {
      return {
        animes: assign(acc.animes, d.animes),
        characters: assign(acc.characters, d.characters),
      };
    }, {});

  const animesData: Array<Prisma.AnimeCreateInput & { relations: any[] }> =
    Object.values(flatData.animes);

  console.log('finished fetching data');

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

  console.log('finished parsing anime data');

  await prisma.anime.createMany({
    data: parsedAnimesValues.map((anime) => ({
      apiId: anime.apiId,
      title: anime.title,
      image: anime.image,
      episodes: anime.episodes,
      format: anime.format,
      year: anime.year,
      season: anime.season,
      source: anime.source,
      genres: anime.genres,
      studios: anime.studios,
      duration: anime.duration,
      countryOfOrigin: anime.countryOfOrigin,
    })),
    skipDuplicates: true,
  });

  console.log('finished inserting anime data');

  await Promise.all(
    parsedAnimesValues.map((anime) => {
      if (anime.relations.length === 0) return;

      return prisma.sequel.createMany({
        data: anime.relations.map((relation) => ({
          animeApiId: anime.apiId,
          title: relation.title,
          apiId: relation.apiId,
        })),
        skipDuplicates: true,
      });
    }),
  );

  console.log('finished inserting sequel data');

  const charactersData: Array<
    Prisma.CharacterCreateInput & { animesId: string[] }
  > = Object.values(flatData.characters);

  await parallel(30, charactersData, async (character) => {
    const animes = await prisma.anime.findMany({
      where: {
        OR: [
          {
            apiId: {
              in: character.animesId,
            },
          },
          {
            sequels: {
              some: {
                animeApiId: {
                  in: character.animesId,
                },
              },
            },
          },
        ],
      },
      include: {
        sequels: true,
      },
    });

    if (!animes.length) return;

    const exists = await prisma.character.findUnique({
      where: {
        apiId: character.apiId,
      },
    });

    if (exists) return;

    return await prisma.character.create({
      data: {
        apiId: character.apiId,
        name: character.name,
        image: character.image,
        age: character.age.toString(),
        gender: character.gender,
        animes: {
          connect: animes.map((anime) => ({
            apiId: anime.apiId,
          })),
        },
      },
    });
  });

  console.log('finished inserting character data');

  await prisma.config.update({
    where: {
      id: config.id,
    },
    data: {
      animePage: {
        increment: FETCH_AMOUNT,
      },
    },
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
