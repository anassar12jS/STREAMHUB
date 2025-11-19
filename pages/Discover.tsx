
import React, { useState, useEffect } from 'react';
import { TMDBResult, MediaType } from '../types';
import { discoverMedia, getGenres } from '../services/tmdb';
import { MediaCard } from '../components/MediaCard';
import { Filter, ChevronDown } from 'lucide-react';

interface DiscoverProps {
  onSelect: (item: TMDBResult) => void;
}

export const Discover: React.FC<DiscoverProps> = ({ onSelect }) => {
  const [items, setItems] = useState<TMDBResult[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.MOVIE);
  const [genres, setGenres] = useState<{id: number, name: string}[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [loading, setLoading] = useState(false);

  const years = Array.from({length: 30}, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    getGenres(mediaType).then(setGenres);
  }, [mediaType]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await discoverMedia(mediaType, sortBy, selectedGenre, selectedYear);
        setItems(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [mediaType, sortBy, selectedGenre, selectedYear]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
            <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2 flex items-center gap-3">
                <Filter className="w-6 h-6 text-[rgb(var(--primary-color))]" />
                Discover
            </h2>
            <p className="text-[var(--text-muted)] text-sm">Find your next favorite from thousands of titles.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
            <select 
                value={mediaType}
                onChange={(e) => { setMediaType(e.target.value as MediaType); setSelectedGenre(undefined); }}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm rounded-lg px-4 py-2.5 focus:border-[rgb(var(--primary-color))] outline-none"
            >
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
            </select>

            <select 
                value={selectedGenre || ''}
                onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm rounded-lg px-4 py-2.5 focus:border-[rgb(var(--primary-color))] outline-none"
            >
                <option value="">All Genres</option>
                {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            <select 
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm rounded-lg px-4 py-2.5 focus:border-[rgb(var(--primary-color))] outline-none"
            >
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm rounded-lg px-4 py-2.5 focus:border-[rgb(var(--primary-color))] outline-none"
            >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="primary_release_date.desc">Newest First</option>
            </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[var(--bg-card)] rounded-lg animate-pulse"></div>
            ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
            No results found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map(item => (
            <MediaCard key={item.id} item={item} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};