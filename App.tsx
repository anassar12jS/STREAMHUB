import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Details } from './pages/Details';
import { searchMedia } from './services/tmdb';
import { TMDBResult } from './types';
import { MediaCard } from './components/MediaCard';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'details' | 'search'>('home');
  const [selectedItem, setSelectedItem] = useState<TMDBResult | null>(null);
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setView('search');
    const results = await searchMedia(query);
    setSearchResults(results);
  };

  const handleSelect = (item: TMDBResult) => {
    setSelectedItem(item);
    setView('details');
  };

  const handleNavigate = (target: string) => {
    if (target === 'home') setView('home');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar onSearch={handleSearch} onNavigate={handleNavigate} />
      
      <main>
        {view === 'home' && <Home onSelect={handleSelect} />}
        
        {view === 'details' && selectedItem && (
          <Details item={selectedItem} onBack={() => setView('home')} />
        )}

        {view === 'search' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">
              Results for "{searchQuery}"
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">No results found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {searchResults.map(item => (
                  <MediaCard key={item.id} item={item} onClick={handleSelect} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
