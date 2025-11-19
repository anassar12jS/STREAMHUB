
export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv'
}

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string; // For TV
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  media_type: MediaType;
  vote_average: number;
  release_date?: string;
  first_air_date?: string; // For TV
}

export interface TMDBDetail extends TMDBResult {
  genres: { id: number; name: string }[];
  external_ids?: {
    imdb_id?: string;
  };
  runtime?: number;
  number_of_seasons?: number;
}

export interface TMDBVideo {
  id: string;
  key: string;
  site: string;
  type: string;
  name: string;
  official: boolean;
}

export interface Stream {
  name?: string;
  title?: string;
  infoHash?: string;
  fileIdx?: number;
  url?: string;
  behaviorHints?: {
    bingeGroup?: string;
  };
}

export interface StreamResponse {
  streams: Stream[];
}

export interface WebtorOptions {
  id: string;
  magnet: string;
  width?: string;
  height?: string;
  theme?: 'light' | 'dark';
  poster?: string;
  title?: string;
  imdbId?: string;
  version?: string;
  mode?: string;
}

declare global {
  interface Window {
    webtor: {
      push: (options: WebtorOptions) => void;
    };
  }
}