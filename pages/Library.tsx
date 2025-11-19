import React, { useState, useEffect } from 'react';
import { TMDBResult } from '../types';
import { getWatchlist } from '../services/storage';
import { MediaCard } from '../components/MediaCard';
import { Bookmark } from 'lucide-react';

interface LibraryProps {
  onSelect: (item: TMDBResult) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelect }) => {
  const [items, setItems] = useState<TMDBResult[]>([]);

  useEffect(() => {
    setItems(getWatchlist());
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-8 h-8 text-purple-500 fill-purple-500" />
        <h2 className="text-3xl font-bold text-white">My Library</h2>
      </div>

      {items.length === 0 ? (
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
      )}
    </div>
  );
};