
import { SportsMatch } from '../types';

const PROXY_URL = 'https://corsproxy.io/?';
const API_BASE = 'https://streamed.pk/api';

// Helper to fetch via proxy
const fetchApi = async (endpoint: string) => {
  const targetUrl = `${API_BASE}${endpoint}`;
  const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    // Fallback: Try fetching directly in case CORS is allowed or proxy fails
    try {
        const directRes = await fetch(targetUrl);
        if (!directRes.ok) throw new Error('Direct fetch failed');
        return await directRes.json();
    } catch (err) {
        throw e;
    }
  }
};

export const getAllMatches = async (): Promise<SportsMatch[]> => {
  try {
    const data = await fetchApi('/matches/all-today');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to fetch matches:", e);
    return [];
  }
};

export const getStreamUrl = async (source: string, id: string): Promise<string | null> => {
  try {
    const safeSource = source.toLowerCase();
    const safeId = encodeURIComponent(id);
    
    const data = await fetchApi(`/stream/${safeSource}/${safeId}`);
    
    if (!Array.isArray(data) || !data.length) {
       throw new Error('Empty playlist');
    }

    // Prefer HD stream, otherwise take first
    const stream = data.find((s: any) => s.hd) || data[0];
    return stream.embedUrl || null;
  } catch (e) {
    console.error("Failed to resolve stream:", e);
    return null;
  }
};
