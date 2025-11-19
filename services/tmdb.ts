import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants';
import { TMDBResult, TMDBDetail, MediaType } from '../types';

const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
};

export const getTrending = async (): Promise<TMDBResult[]> => {
  const data = await fetchTMDB('/trending/all/day');
  return data.results;
};

export const getPopularMovies = async (): Promise<TMDBResult[]> => {
  const data = await fetchTMDB('/movie/popular');
  return data.results.map((m: any) => ({ ...m, media_type: MediaType.MOVIE }));
};

export const getPopularTV = async (): Promise<TMDBResult[]> => {
  const data = await fetchTMDB('/tv/popular');
  return data.results.map((t: any) => ({ ...t, media_type: MediaType.TV }));
};

export const searchMedia = async (query: string): Promise<TMDBResult[]> => {
  if (!query) return [];
  const data = await fetchTMDB('/search/multi', { query });
  return data.results.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
};

export const getDetails = async (id: number, type: MediaType): Promise<TMDBDetail> => {
  const data = await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids' });
  return { ...data, media_type: type };
};
