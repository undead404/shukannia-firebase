import Case from 'case';
import {
  getYear,
  isValid as isDateValid,
  parse as parseDate,
  parseISO,
} from 'date-fns';
import compact from 'lodash/compact';
import find from 'lodash/find';
import get from 'lodash/get';
import head from 'lodash/head';
import includes from 'lodash/includes';
import isArray from 'lodash/isArray';
import map from 'lodash/map';
import nth from 'lodash/nth';
import sortBy from 'lodash/sortBy';
import split from 'lodash/split';
import toString from 'lodash/toString';
import trim from 'lodash/trim';
import trimStart from 'lodash/trimStart';
import parseHtml, { HTMLElement } from 'node-html-parser';
import superagent from 'superagent';
import { logger } from 'firebase-functions';
import toImdbLink from './to-imdb-link';
import correctCountryName from './correct-country-name';
import { Title } from '../types';

const I_MARKER = '<script type="application/ld+json">';
const I_OFFSET = I_MARKER.length;
const J_MARKER = '</script>';
const SEASON_I_MARKER = 'Season ';
const SEASON_I_MARKER_SIZE = SEASON_I_MARKER.length;
const EPISODE_I_MARKER = 'Episode ';
const EPISODE_I_MARKER_SIZE = EPISODE_I_MARKER.length;
const SERIES_ID_I_MARKER = '/title/tt';
const SERIES_ID_I_MARKER_SIZE = SERIES_ID_I_MARKER.length;
const AIRED_AT_MARKER = 'title="See more release dates" >';
const AIRED_AT_MARKER_SIZE = AIRED_AT_MARKER.length;
const NUMBER_REGEXP = /\d+/;
const MAX_RETRIES = 5;

function asyncTimeout(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function typeToKind(titleType: string) {
  if (titleType === 'TVEpisode') {
    // console.info(`${titleType} => tv_episode`);
    return 'tv_episode';
  }
  if (titleType === 'TVSeries') {
    // console.info(`${titleType} => tv_series`);
    return 'tv_series';
  }
  if (titleType === 'CreativeWork') {
    // console.info(`${titleType} => creative_work`);
    return 'creative_work';
  }
  if (titleType === 'VideoGame') {
    return 'video_game';
  }
  // console.info(`${titleType} => feature`);
  return 'feature';
}
function extractAiredAt(html: string): Date | undefined {
  let airedAtDate: undefined | Date;
  let airedAtI = html.indexOf(AIRED_AT_MARKER);
  if (airedAtI !== -1) {
    airedAtI += AIRED_AT_MARKER_SIZE;
    const airedAtJ = html.indexOf('<', airedAtI);
    const airedAt = head(html.slice(airedAtI, airedAtJ).match(NUMBER_REGEXP));
    // const airedInYear = parseInt(head(airedAt), 10);
    if (airedAt) {
      airedAtDate = parseDate(airedAt, 'd MMMM yyyy', new Date());
      if (!isDateValid(airedAtDate)) {
        airedAtDate = parseDate(airedAt, 'MMMM yyyy', new Date());
      }
      if (!isDateValid(airedAtDate)) {
        airedAtDate = parseDate(airedAt, 'yyyy', new Date());
      }
      if (!isDateValid(airedAtDate)) {
        airedAtDate = undefined;
      }
    }
  }
  return airedAtDate;
}
function extractCountries(documentRoot: HTMLElement) {
  const countryDetails = find(
    map(documentRoot.querySelectorAll('#titleDetails .txt-block'), 'text'),
    (details) => includes(details, 'Country:'),
  );
  return sortBy(
    map(
      compact(map(split(nth(split(countryDetails, ':'), 1), '|'), trim)),
      correctCountryName,
    ),
  );
}

function extractCreatedAt(documentRoot: HTMLElement): Date | undefined {
  let createdAt: Date | undefined;
  const yearLink = documentRoot.querySelector('#titleYear a');
  if (yearLink) {
    const year = Number.parseInt(yearLink.text, 10);
    createdAt = parseDate(toString(year), 'yyyy', new Date());
  }
  return createdAt;
}
function extractEpisodeFields(documentRoot: HTMLElement) {
  const seriesInfoElement = documentRoot.querySelector(
    '.bp_text_only .bp_heading',
  );
  let episode = 0;
  let season = 0;
  let seriesId = null;
  if (seriesInfoElement) {
    const seriesInfo = seriesInfoElement.textContent;
    let seasonI = seriesInfo.indexOf(SEASON_I_MARKER);
    if (seasonI !== -1) {
      seasonI += SEASON_I_MARKER_SIZE;
      const seasonJ = seriesInfo.indexOf(' ', seasonI);
      season = Number.parseInt(seriesInfo.slice(seasonI, seasonJ), 10);
    }
    let episodeI = seriesInfo.indexOf(EPISODE_I_MARKER);
    if (episodeI !== -1) {
      episodeI += EPISODE_I_MARKER_SIZE;
      episode = Number.parseInt(seriesInfo.slice(episodeI), 10);
    }
  }
  const episodesLink = documentRoot.querySelector('.np_all');
  const episodesHref = episodesLink.getAttribute('href');
  if (!episodesHref) {
    throw new Error('Link to episodes not found');
  }
  let seriesIdI = episodesHref.indexOf(SERIES_ID_I_MARKER);
  if (seriesIdI === -1) {
    throw new Error('Series ID not found');
  }
  seriesIdI += SERIES_ID_I_MARKER_SIZE;
  const seriesIdJ = episodesHref.indexOf('/episodes', seriesIdI);
  seriesId = Number.parseInt(
    trimStart(episodesHref.slice(seriesIdI, seriesIdJ), '0'),
    10,
  );

  return {
    episode,
    season,
    seriesId,
  };
}
function extractLanguages(documentRoot: HTMLElement) {
  const countryDetails = find(
    map(documentRoot.querySelectorAll('#titleDetails .txt-block'), 'text'),
    (details) => includes(details, 'Language:'),
  );
  return sortBy(
    compact(map(split(nth(split(countryDetails, ':'), 1), '|'), trim)),
  );
}

function extractMetadata(imdbId: number, html: string): Title {
  let metadataI = html.indexOf(I_MARKER);
  if (metadataI === -1) {
    throw new Error('I marker not found');
  }
  metadataI += I_OFFSET;
  const metadataJ = html.indexOf(J_MARKER, metadataI);

  if (metadataJ === -1) {
    throw new Error('J marker not found');
  }
  const metadataJson = html.slice(metadataI, metadataJ);
  const metadata = JSON.parse(metadataJson);
  let explicit;
  if (metadata.contentRating) {
    explicit = includes(
      ['NC-17', 'R', 'TV-M', 'TV-MA', 'X'],
      metadata.contentRating,
    );
  }
  const kind = typeToKind(metadata['@type']);
  const releasedAt = metadata.datePublished
    ? parseISO(metadata.datePublished)
    : undefined;
  const votesNumber = get(metadata, 'aggregateRating.ratingCount', 0);
  return {
    description: metadata.description || undefined,
    explicit,
    genres: isArray(metadata.genre)
      ? map(metadata.genre, Case.snake)
      : [Case.snake(metadata.genre)],

    image: metadata.image || undefined,
    imdbId,
    kind,
    name: metadata.name || undefined,
    rating:
      Math.floor(
        // eslint-disable-next-line no-magic-numbers
        Number.parseFloat(get(metadata, 'aggregateRating.ratingValue', 0)) * 10,
      ) || 0,
    releasedAt,
    votesNum: votesNumber,
  };
}

async function extractSeverity(imdbId: number): Promise<boolean | undefined> {
  const url = toImdbLink(imdbId);
  const parentalGuideResponse = await superagent.get(`${url}/parentalguide`);
  let severe;
  if (includes(parentalGuideResponse.text, 'ipl-status-pill--critical')) {
    severe = true;
  } else if (includes(parentalGuideResponse.text, 'found this')) {
    severe = false;
  }
  return severe;
}

export default async function actualize(
  imdbId: number,
  retry = 0,
): Promise<Title | null> {
  try {
    const url = toImdbLink(imdbId);
    const response = await superagent.get(url);
    const html = response.text;
    let title = extractMetadata(imdbId, html);
    if (!title.votesNum) {
      // throw new Error(JSON.stringify(title));
      return null;
    }
    title.severe = await extractSeverity(imdbId);
    const documentRoot = parseHtml(html);

    if (!title.releasedAt) {
      title.releasedAt = extractAiredAt(html);
    }
    const createdAt = extractCreatedAt(documentRoot);
    if (
      createdAt &&
      isDateValid(createdAt) &&
      (!title.releasedAt || getYear(createdAt) < getYear(title.releasedAt) - 1)
    ) {
      title.releasedAt = createdAt;
    }
    if (!title.releasedAt && title.kind !== 'tv_series') {
      // throw new Error(JSON.stringify(title));
      return null;
    }
    if (title.kind === 'tv_episode') {
      title = {
        ...title,
        ...extractEpisodeFields(documentRoot),
      };
    }
    title.countries = extractCountries(documentRoot);
    title.languages = extractLanguages(documentRoot);
    return title;
  } catch (error) {
    logger.error(imdbId, error);
    if (retry > MAX_RETRIES) {
      throw error;
    }
    // eslint-disable-next-line no-magic-numbers
    await asyncTimeout(1000 * 60 * 15);
    return actualize(imdbId, retry + 1);
  }
}
