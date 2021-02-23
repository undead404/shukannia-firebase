import Case from 'case';
import { addYears, format, isFuture, parse as parseDate } from 'date-fns';
import { logger } from 'firebase-functions';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import { parse } from 'node-html-parser';
import superagent from 'superagent';

import actualize from './common/actualize';
import Database from './common/mongodb';
import sequentialAsyncMap from './common/sequential-async-map';
// import { addYears } from 'date-fns';

const database = new Database();

// const START_FROM_DATE = new Date();
const START_FROM_DATE = parseDate('1984', 'yyyy', new Date());

// function asyncTimeout(ms) {
//   return new Promise(resolve => {
//     setTimeout(resolve, ms);
//   });
// }

const agent = superagent.agent();
const TITLE_REGEXP = /title\/tt(\d+)/gim;
const GENRES = sortBy(
  map(
    [
      'documentary',
      'short',
      'animation',
      'comedy',
      'romance',
      'sport',
      'news',
      'family',
      'fantasy',
      'drama',
      'horror',
      'war',
      'crime',
      'western',
      'sci_fi',
      'biography',
      'adventure',
      'history',
      'action',
      'music',
      'mystery',
      'thriller',
      'musical',
      'film_noir',
      'game_show',
      'talk_show',
      'reality_tv',
      'adult',
    ],
    Case.kebab,
  ),
);
async function acquirePage(url: string): Promise<void> {
  logger.info(url);
  const response = await agent.get(url);
  const found = response.text.matchAll(TITLE_REGEXP);
  const imdbIds = uniq(
    map(Array.from(found), (foundItem) => Number.parseInt(foundItem[1], 10)),
  );
  const newImdbIds = await database.rejectKnown(imdbIds);
  await sequentialAsyncMap(newImdbIds, async (imdbId: number) => {
    const title = await actualize(imdbId);
    if (!title) return Promise.resolve();
    return database.insert(title);
  });
  const documentRoot = parse(response.text);
  const nextLink = documentRoot.querySelector('.next-page');
  if (!nextLink) {
    return Promise.resolve();
  }
  const nextHref = nextLink.getAttribute('href');
  logger.info(nextHref);
  // if (!isEmpty(newIds)) {
  //   await asyncTimeout(1000 * 60);
  // }
  return acquirePage(`https://imdb.com${nextHref}`);
}
async function acquireByGenre(
  genre: string,
  startFromDate: Date,
  endAtDate: Date,
) {
  const startFrom = format(startFromDate, 'yyyy-MM-dd');
  let endAt = format(endAtDate, 'yyyy-MM-dd');
  if (isFuture(endAtDate)) {
    endAt = '';
  }
  const url = `https://www.imdb.com/search/title/?num_votes=5,&release_date=${startFrom},${endAt}&genres=${Case.kebab(
    genre,
  )}`;
  return acquirePage(url);
}
// actualize(8911030).then(console.info);
export default async function acquireNew(): Promise<void[][]> {
  // let startFromDate = subMonths(START_FROM_DATE, 1);
  let startFromDate = START_FROM_DATE;
  const dateBorders = [];
  // while (getYear(startFromDate) > 1850) {
  while (!isFuture(startFromDate)) {
    logger.info(startFromDate);
    // const endAtDate = addMonths(startFromDate, 1);
    const endAtDate = addYears(startFromDate, 1);
    dateBorders.push([startFromDate, endAtDate]);
    // startFromDate = subMonths(startFromDate, 1);
    startFromDate = endAtDate;
  }
  return sequentialAsyncMap(dateBorders, ([startAtDate, endAtDate]) =>
    sequentialAsyncMap(GENRES, (genre) =>
      acquireByGenre(genre, startAtDate, endAtDate),
    ),
  );
  // while (!isFuture(startFromDate)) {
  //   const endAtDate = addMonths(startFromDate, 1);

  //   // eslint-disable-next-line no-await-in-loop, no-loop-func
  //   await sequentialAwaitMap(GENRES, genre =>
  //     acquireByGenre(genre, startFromDate, endAtDate),
  //   );
  //   startFromDate = endAtDate;
  // }
}
