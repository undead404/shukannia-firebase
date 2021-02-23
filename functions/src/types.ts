export type Kind =
  | 'creative_work'
  | 'feature'
  | 'tv_episode'
  | 'tv_series'
  | 'video_game';

export interface Title {
  countries?: string[];
  description?: string;
  explicit?: boolean;
  genres?: string[];
  image?: string;
  imdbId: number;
  languages?: string[];
  kind: Kind;
  name?: string;
  rating: number;
  releasedAt?: Date;
  severe?: boolean;
  updatedAt?: Date;
  votesNum: number;
}
