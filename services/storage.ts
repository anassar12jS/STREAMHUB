import { TMDBResult } from '../types';

const WATCHLIST_KEY = 'streamhub_watchlist';
const HISTORY_KEY = 'streamhub_history';
const THEME_KEY = 'streamhub_theme';
const MODE_KEY = 'streamhub_mode';

// Watchlist
export const getWatchlist = (): TMDBResult[] => {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const addToWatchlist = (item: TMDBResult) => {
  const list = getWatchlist();
  if (!list.find(i => i.id === item.id)) {
    const updated = [item, ...list];
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  }
};

export const removeFromWatchlist = (id: number) => {
  const list = getWatchlist();
  const updated = list.filter(i => i.id !== id);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
};

export const isInWatchlist = (id: number): boolean => {
  const list = getWatchlist();
  return !!list.find(i => i.id === id);
};

// History (Recently Watched)
export const getHistory = (): TMDBResult[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const addToHistory = (item: TMDBResult) => {
  const list = getHistory();
  // Remove if already exists to move to top
  const filtered = list.filter(i => i.id !== item.id);
  const updated = [item, ...filtered].slice(0, 20); // Keep max 20 items
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

// Theme Color
export const getTheme = (): string => {
  return localStorage.getItem(THEME_KEY) || 'purple';
};

export const setTheme = (color: string) => {
  localStorage.setItem(THEME_KEY, color);
};

// Light/Dark Mode
export const getMode = (): 'dark' | 'light' => {
  return (localStorage.getItem(MODE_KEY) as 'dark' | 'light') || 'dark';
};

export const setMode = (mode: 'dark' | 'light') => {
  localStorage.setItem(MODE_KEY, mode);
};