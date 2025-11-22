
import { SportsMatch } from '../types';

const PROXY_URL = 'https://corsproxy.io/?';
const API_BASE = 'https://streamed.pk/api';

// Helper to fetch api
const fetchApi = async (endpoint: string) => {
  const targetUrl = `${API_BASE}${endpoint}`;
  
  // 1. Try Direct Fetch first (Fastest, lowest latency)
  try {
    // Use a short timeout for direct fetch to fail fast if it hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(targetUrl, { 
        signal: controller.signal 
    });
    clearTimeout(timeoutId);

    if (res.ok) {
        return await res.json();
    }
  } catch (e) {
    // Silently fail direct fetch (CORS, Network Error, etc) and proceed to proxy
    // console.warn("Direct fetch failed, falling back to proxy", e);
  }

  // 2. Fallback to Proxy (Slower but reliable if CORS is blocked)
  try {
    const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    // If proxy fails, propagate error
    throw e;
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
