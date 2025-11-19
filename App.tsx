import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Details } from './pages/Details';
import { searchMedia } from './services/tmdb';
import { TMDBResult } from './types';
import { MediaCard } from './components/MediaCard';

// Define valid view types
type ViewState = 'home' | 'details' | 'search';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedItem, setSelectedItem] = useState<TMDBResult | null>(null);
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setView(event.state.view);
        setSelectedItem(event.state.item || null);
        setSearchQuery(event.state.query || '');
        // Restore search results if we are going back to search
        if (event.state.view === 'search' && event.state.query) {
           searchMedia(event.state.query).then(setSearchResults);
        }
      } else {
        // Default to home if no state (initial load or back to start)
        setView('home');
        setSelectedItem(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial state so we have something to pop back to
    window.history.replaceState({ view: 'home' }, '', window.location.pathname);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    const results = await searchMedia(query);
    setSearchResults(results);
    
    setView('search');
    window.history.pushState({ view: 'search', query }, '', `?search=${encodeURIComponent(query)}`);
  };

  const handleSelect = (item: TMDBResult) => {
    setSelectedItem(item);
    setView('details');
    window.history.pushState({ view: 'details', item }, '', `?id=${item.id}`);
    window.scrollTo(0, 0);
  };

  const handleNavigate = (target: string) => {
    if (target === 'home') {
      setView('home');
      window.history.pushState({ view: 'home' }, '', '/');
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar onSearch={handleSearch} onNavigate={handleNavigate} />
      
      <main>
        {view === 'home' && <Home onSelect={handleSelect} />}
        
        {view === 'details' && selectedItem && (
          <Details item={selectedItem} onBack={handleBack} />
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