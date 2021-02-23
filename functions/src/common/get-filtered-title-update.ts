import { isEqual as areDatesEqual, isValid } from 'date-fns';
import isEqual from 'lodash/isEqual';
import isUndefined from 'lodash/isUndefined';

import { Title } from '../types';

export default function getFilteredTitleUpdate(
  title: Title,
  titleUpdate: Title,
): Partial<Title> {
  const filteredTitleUpdate: Partial<Title> = { updatedAt: new Date() };
  if (
    !isUndefined(titleUpdate.countries) &&
    !isEqual(title.countries, titleUpdate.countries)
  ) {
    filteredTitleUpdate.countries = titleUpdate.countries;
  }
  if (
    !isUndefined(titleUpdate.description) &&
    title.description !== titleUpdate.description
  ) {
    filteredTitleUpdate.description = titleUpdate.description;
  }
  if (
    !isUndefined(titleUpdate.explicit) &&
    title.explicit !== titleUpdate.explicit
  ) {
    filteredTitleUpdate.explicit = titleUpdate.explicit;
  }
  if (
    !isUndefined(titleUpdate.genres) &&
    !isEqual(title.genres, titleUpdate.genres)
  ) {
    filteredTitleUpdate.genres = titleUpdate.genres;
  }
  if (!isUndefined(titleUpdate.image) && title.image !== titleUpdate.image) {
    filteredTitleUpdate.image = titleUpdate.image;
  }
  if (
    !isUndefined(titleUpdate.languages) &&
    !isEqual(title.languages, titleUpdate.languages)
  ) {
    filteredTitleUpdate.languages = titleUpdate.languages;
  }
  if (!isUndefined(titleUpdate.kind) && title.image !== titleUpdate.kind) {
    filteredTitleUpdate.kind = titleUpdate.kind;
  }
  if (!isUndefined(titleUpdate.name) && title.image !== titleUpdate.name) {
    filteredTitleUpdate.name = titleUpdate.name;
  }
  if (!isUndefined(titleUpdate.rating) && title.rating !== titleUpdate.rating) {
    filteredTitleUpdate.rating = titleUpdate.rating;
  }
  if (
    titleUpdate.releasedAt &&
    isValid(titleUpdate.releasedAt) &&
    (!title.releasedAt ||
      !areDatesEqual(title.releasedAt, titleUpdate.releasedAt))
  ) {
    filteredTitleUpdate.releasedAt = titleUpdate.releasedAt;
  }
  if (!isUndefined(titleUpdate.severe) && title.severe !== titleUpdate.severe) {
    filteredTitleUpdate.severe = titleUpdate.severe;
  }
  if (
    !isUndefined(titleUpdate.votesNum) &&
    title.votesNum !== titleUpdate.votesNum
  ) {
    filteredTitleUpdate.votesNum = titleUpdate.votesNum;
  }
  return filteredTitleUpdate;
}
