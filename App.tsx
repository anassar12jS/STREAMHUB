import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Details } from './pages/Details';
import { Library } from './pages/Library';
import { SettingsModal } from './components/SettingsModal';
import { searchMedia, getDetails } from './services/tmdb';
import { TMDBResult, MediaType } from './types';
import { MediaCard } from './components/MediaCard';

// Define valid view types
type ViewState = 'home' | 'details' | 'search' | 'library';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedItem, setSelectedItem] = useState<TMDBResult | null>(null);
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial Load: Check URL parameters for deep linking
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const type = params.get('type') as MediaType;
      const search = params.get('search');

      if (id && type) {
        try {
          // Fetch basic details to reconstruct the item object
          const details = await getDetails(parseInt(id), type);
          setSelectedItem(details);
          setView('details');
        } catch (e) {
          console.error("Failed to load item from URL", e);
          setView('home');
        }
      } else if (search) {
        setSearchQuery(search);
        const results = await searchMedia(search);
        setSearchResults(results);
        setView('search');
      }
    };

    init();
  }, []);

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
        // Fallback for when state is null
        const params = new URLSearchParams(window.location.search);
        if (!params.get('id') && !params.get('search')) {
            setView('home');
            setSelectedItem(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
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
    window.history.pushState({ view: 'details', item }, '', `?id=${item.id}&type=${item.media_type}`);
    window.scrollTo(0, 0);
  };

  const handleNavigate = (target: string) => {
    if (target === 'home') {
      setView('home');
      window.history.pushState({ view: 'home' }, '', window.location.pathname);
      window.scrollTo(0, 0);
    } else if (target === 'library') {
      setView('library');
      window.history.pushState({ view: 'library' }, '', '#library');
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleNavigate('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans flex flex-col">
      <Navbar 
        onSearch={handleSearch} 
        onNavigate={handleNavigate} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="flex-grow">
        {view === 'home' && <Home onSelect={handleSelect} />}
        
        {view === 'library' && <Library onSelect={handleSelect} />}
        
        {view === 'details' && selectedItem && (
          <Details item={selectedItem} onBack={handleBack} />
        )}

        {view === 'search' && (
          <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Results for "<span className="text-purple-400">{searchQuery}</span>"
                </h2>
                <button onClick={() => handleNavigate('home')} className="text-sm text-gray-400 hover:text-white">Clear</button>
             </div>
            
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
                 <div className="text-4xl mb-2">😕</div>
                 <p>No results found.</p>
              </div>
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

      <Footer />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;