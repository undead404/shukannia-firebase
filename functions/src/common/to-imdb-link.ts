import padStart from 'lodash/padStart';
import toString from 'lodash/toString';

const MINIMAL_ID_LINK_LENGTH = 7;
export default function toImdbLink(imdbId: number): string {
  return `https://imdb.com/title/tt${padStart(
    toString(imdbId),
    MINIMAL_ID_LINK_LENGTH,
    '0',
  )}`;
}
