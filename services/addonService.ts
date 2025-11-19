import { TORRENTIO_BASE_URL } from '../constants';
import { StreamResponse, MediaType } from '../types';

export const getStreams = async (type: MediaType, id: string): Promise<StreamResponse> => {
  // Torrentio expects 'movie' or 'series' (not 'tv')
  const stremioType = type === MediaType.MOVIE ? 'movie' : 'series';
  
  // If it's a TV show, Stremio ID format is usually imdb_id:season:episode
  // For this demo, we will just search for the main title streams (usually season packs or latest)
  // or simplified logic. Torrentio requires strict formatting.
  
  // NOTE: Real Stremio addons use IMDB IDs (tt1234567).
  // If we passed a TMDB ID, it wouldn't work with Torrentio directly without a bridge.
  // The `getDetails` from TMDB returns `external_ids.imdb_id`. We MUST use that.
  
  if (!id.startsWith('tt')) {
    console.warn("Invalid IMDb ID for streams:", id);
    return { streams: [] };
  }

  try {
    const url = `${TORRENTIO_BASE_URL}/stream/${stremioType}/${id}.json`;
    const res = await fetch(url);
    if (!res.ok) return { streams: [] };
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch streams", e);
    return { streams: [] };
  }
};

export const getEpisodeStreams = async (imdbId: string, season: number, episode: number): Promise<StreamResponse> => {
  const streamId = `${imdbId}:${season}:${episode}`;
  try {
    const url = `${TORRENTIO_BASE_URL}/stream/series/${streamId}.json`;
    const res = await fetch(url);
    if (!res.ok) return { streams: [] };
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch episode streams", e);
    return { streams: [] };
  }
};
