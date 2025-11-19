import React, { useEffect, useState } from 'react';
import { getTrending, getPopularMovies, getPopularTV } from '../services/tmdb';
import { TMDBResult } from '../types';
import { MediaCard } from '../components/MediaCard';
import { TMDB_IMAGE_BASE } from '../constants';
import { Play, Info } from 'lucide-react';

interface HomeProps {
  onSelect: (item: TMDBResult) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelect }) => {
  const [trending, setTrending] = useState<TMDBResult[]>([]);
  const [movies, setMovies] = useState<TMDBResult[]>([]);
  const [series, setSeries] = useState<TMDBResult[]>([]);
  const [heroItem, setHeroItem] = useState<TMDBResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [t, m, s] = await Promise.all([
        getTrending(),
        getPopularMovies(),
        getPopularTV()
      ]);
      setTrending(t);
      setMovies(m);
      setSeries(s);
      if (t.length > 0) setHeroItem(t[0]);
    };
    loadData();
  }, []);

  const Row = ({ title, items }: { title: string, items: TMDBResult[] }) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-4 px-4 md:px-8 border-l-4 border-purple-600 pl-3">{title}</h2>
      <div className="flex overflow-x-auto space-x-4 px-4 md:px-8 pb-4 no-scrollbar scroll-smooth">
        {items.map(item => (
          <MediaCard key={item.id} item={item} onClick={onSelect} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      {heroItem && (
        <div className="relative h-[70vh] w-full mb-8">
          <div className="absolute inset-0">
            <img 
              src={`${TMDB_IMAGE_BASE}${heroItem.backdrop_path}`} 
              alt={heroItem.title || heroItem.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-black/20 to-transparent"></div>
          </div>

          <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-12 max-w-3xl">
             <span className="inline-block py-1 px-2 rounded bg-red-600 text-white text-xs font-bold mb-3 tracking-wider uppercase">
               Trending Now
             </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {heroItem.title || heroItem.name}
            </h1>
            <p className="text-gray-300 text-sm md:text-lg mb-6 line-clamp-3 md:line-clamp-2 max-w-xl">
              {heroItem.overview}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => onSelect(heroItem)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-200 transition-colors"
              >
                <Play className="w-5 h-5 fill-black" /> Play
              </button>
              <button 
                 onClick={() => onSelect(heroItem)}
                 className="flex items-center gap-2 bg-gray-600/80 text-white px-6 py-3 rounded font-bold hover:bg-gray-500/80 transition-colors backdrop-blur-sm"
              >
                <Info className="w-5 h-5" /> More Info
              </button>
            </div>
          </div>
        </div>
      )}

      <Row title="Trending Today" items={trending} />
      <Row title="Popular Movies" items={movies} />
      <Row title="Hit TV Series" items={series} />
    </div>
  );
};
