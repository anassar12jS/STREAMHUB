import React, { useEffect, useState } from 'react';
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies, getTopRatedTV } from '../services/tmdb';
import { TMDBResult } from '../types';
import { MediaCard } from '../components/MediaCard';
import { TMDB_IMAGE_BASE } from '../constants';
import { Play, Info, TrendingUp, Star, Film, Tv } from 'lucide-react';

interface HomeProps {
  onSelect: (item: TMDBResult) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelect }) => {
  const [trending, setTrending] = useState<TMDBResult[]>([]);
  const [movies, setMovies] = useState<TMDBResult[]>([]);
  const [series, setSeries] = useState<TMDBResult[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBResult[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<TMDBResult[]>([]);
  const [heroItem, setHeroItem] = useState<TMDBResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, m, s, tm, ts] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getPopularTV(),
          getTopRatedMovies(),
          getTopRatedTV()
        ]);
        setTrending(t);
        setMovies(m);
        setSeries(s);
        setTopRatedMovies(tm);
        setTopRatedSeries(ts);
        if (t.length > 0) setHeroItem(t[0]);
      } catch (e) {
        console.error("Failed to load home data", e);
      }
    };
    loadData();
  }, []);

  const Row = ({ title, items, icon: Icon }: { title: string, items: TMDBResult[], icon?: React.ElementType }) => (
    <div className="mb-12 relative z-10">
      <div className="flex items-center gap-3 mb-5 px-4">
        {Icon && <Icon className="w-6 h-6 text-purple-500" />}
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">{title}</h2>
      </div>
      
      <div className="flex overflow-x-auto space-x-4 px-4 pb-4 custom-scrollbar scroll-smooth snap-x snap-mandatory">
        {items.map(item => (
          <div key={item.id} className="snap-start">
             <MediaCard item={item} onClick={onSelect} />
          </div>
        ))}
        {/* Spacer div to ensure the last item isn't cut off by padding right logic in some browsers */}
        <div className="w-2 shrink-0"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#0f0f0f] overflow-x-hidden">
      {/* Hero Section (Full Width) */}
      {heroItem && (
        <div className="relative h-[85vh] w-full mb-16 group">
          <div className="absolute inset-0">
            <img 
              src={`${TMDB_IMAGE_BASE}${heroItem.backdrop_path}`} 
              alt={heroItem.title || heroItem.name} 
              className="w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent"></div>
          </div>

          <div className="absolute bottom-0 left-0 w-full px-4 sm:px-8 md:px-12 pb-16 max-w-7xl mx-auto right-0 flex flex-col gap-4">
             <div className="flex items-center gap-2 animate-fade-in-up">
                <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-red-900/20">
                  <TrendingUp className="w-3 h-3" /> Trending #1
                </span>
                <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/10">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {heroItem.vote_average.toFixed(1)}
                </span>
             </div>
            
            <h1 className="text-4xl md:text-7xl font-black text-white leading-none tracking-tight drop-shadow-xl animate-fade-in-up delay-100">
              {heroItem.title || heroItem.name}
            </h1>
            
            <p className="text-gray-200 text-sm md:text-lg line-clamp-3 md:line-clamp-2 max-w-2xl drop-shadow-md animate-fade-in-up delay-200 font-medium">
              {heroItem.overview}
            </p>
            
            <div className="flex gap-4 pt-4 animate-fade-in-up delay-300">
              <button 
                onClick={() => onSelect(heroItem)}
                className="flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-lg font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
              >
                <Play className="w-5 h-5 fill-black" /> 
                <span>Watch Now</span>
              </button>
              <button 
                 onClick={() => onSelect(heroItem)}
                 className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-lg font-bold hover:bg-white/20 transition-all backdrop-blur-md"
              >
                <Info className="w-5 h-5" /> 
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rows Container - Centered with Max Width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Row title="Trending Today" items={trending} icon={TrendingUp} />
          <Row title="Popular Movies" items={movies} icon={Film} />
          <Row title="Hit TV Series" items={series} icon={Tv} />
          
          <div className="my-12 border-t border-white/5" />
          
          <Row title="Highest Rated Movies" items={topRatedMovies} icon={Star} />
          <Row title="Highest Rated Series" items={topRatedSeries} icon={Star} />
        </div>
      </div>
    </div>
  );
};