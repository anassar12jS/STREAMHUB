
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

  const upcomingItems = items.filter(i => i.media_type === 'tv');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-[rgb(var(--primary-color))] fill-[rgb(var(--primary-color))]" />
            <h2 className="text-3xl font-bold text-[var(--text-main)]">My Library</h2>
         </div>

         <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border-color)]">
            <button 
                onClick={() => setActiveTab('collection')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'collection' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
                Collection
            </button>
            <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
                Upcoming TV
            </button>
         </div>
      </div>

      {activeTab === 'collection' ? (
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
              <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)]">
                <Bookmark className="w-12 h-12 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-medium text-[var(--text-main)] mb-2">Your library is empty</h3>
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
              <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg flex gap-4 items-center">
                 <Calendar className="w-6 h-6 text-blue-400" />
                 <div>
                    <p className="text-blue-400 text-sm">Tracking {upcomingItems.length} TV shows in your library.</p>
                    <p className="text-xs text-blue-400/60">Dates are estimated based on release schedules.</p>
                 </div>
              </div>
              
              {upcomingItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcomingItems.map(item => (
                          <div key={item.id} onClick={() => onSelect(item)} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg flex gap-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                              <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} className="w-16 h-24 object-cover rounded" />
                              <div>
                                  <h4 className="font-bold text-[var(--text-main)]">{item.name}</h4>
                                  <p className="text-xs text-[var(--text-muted)] mt-1">Next Episode Estimate:</p>
                                  <p className="text-sm text-[rgb(var(--primary-color))] font-bold mt-1">Coming Soon</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-[var(--text-muted)] text-center py-10">Add TV shows to your library to see their schedule here.</p>
              )}
          </div>
      )}
    </div>
  );
};