import React, { useState, useEffect } from 'react';
import { TMDBResult } from '../types';
import { getWatchlist } from '../services/storage';
import { MediaCard } from '../components/MediaCard';
import { Bookmark, Calendar } from 'lucide-react';

interface LibraryProps {
  onSelect: (item: TMDBResult) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelect }) => {
  const [items, setItems] = useState<TMDBResult[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'upcoming'>('collection');

  useEffect(() => {
    setItems(getWatchlist());
  }, []);

  // Simple upcoming logic: For this demo, we filter for TV shows with future air dates (if we had that detailed data cached)
  // Since standard TMDBResult only has first_air_date, we will just show a placeholder message for "Upcoming" 
  // as fetching full details for every item in library to find next episode date is expensive for a client-side app without a backend cache.
  const upcomingItems = items.filter(i => i.media_type === 'tv');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-[rgb(var(--primary-color))] fill-[rgb(var(--primary-color))]" />
            <h2 className="text-3xl font-bold text-white">My Library</h2>
         </div>

         <div className="flex bg-[#1a1a1a] p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('collection')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'collection' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Collection
            </button>
            <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Upcoming TV
            </button>
         </div>
      </div>

      {activeTab === 'collection' ? (
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                <Bookmark className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Your library is empty</h3>
              <p className="max-w-md text-center">
                Movies and TV shows you add to your watchlist will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {items.map(item => (
                <MediaCard key={item.id} item={item} onClick={onSelect} />
              ))}
            </div>
          )
      ) : (
          <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex gap-4 items-center">
                 <Calendar className="w-6 h-6 text-blue-400" />
                 <div>
                    <p className="text-blue-200 text-sm">Tracking {upcomingItems.length} TV shows in your library.</p>
                    <p className="text-xs text-blue-400/60">Dates are estimated based on release schedules.</p>
                 </div>
              </div>
              
              {upcomingItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcomingItems.map(item => (
                          <div key={item.id} onClick={() => onSelect(item)} className="bg-[#161616] border border-white/5 p-4 rounded-lg flex gap-4 cursor-pointer hover:bg-[#222] transition-colors">
                              <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} className="w-16 h-24 object-cover rounded" />
                              <div>
                                  <h4 className="font-bold text-white">{item.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">Next Episode Estimate:</p>
                                  <p className="text-sm text-[rgb(var(--primary-color))] font-bold mt-1">Coming Soon</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-gray-500 text-center py-10">Add TV shows to your library to see their schedule here.</p>
              )}
          </div>
      )}
    </div>
  );
};