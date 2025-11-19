import React, { useState } from 'react';
import { Search, Film, Menu, X, Settings, Bookmark, Trophy, Compass } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onNavigate, onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="h-8 w-8 bg-gradient-to-br from-[rgb(var(--primary-color))] to-blue-600 rounded-lg flex items-center justify-center mr-2">
              <Film className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">StreamHub</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button onClick={() => onNavigate('home')} className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</button>
              <button onClick={() => onNavigate('discover')} className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <Compass className="w-4 h-4" /> Discover
              </button>
              <button onClick={() => onNavigate('library')} className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Library
              </button>
              <button onClick={() => onNavigate('sports')} className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Live Sports
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:block w-1/3">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                className="w-full bg-gray-800 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-color))] text-gray-200 placeholder-gray-500"
                placeholder="Search movies, shows..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
             <button 
               onClick={onOpenSettings}
               className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
               title="Addon Settings"
             >
               <Settings className="w-5 h-5" />
             </button>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 pb-4 px-4">
           <form onSubmit={handleSubmit} className="mt-4 relative">
              <input
                type="text"
                className="w-full bg-gray-800 rounded-md pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-color))]"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            </form>
            <div className="mt-4 space-y-2">
              <button onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">Home</button>
              <button onClick={() => { onNavigate('discover'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">Discover</button>
              <button onClick={() => { onNavigate('library'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">My Library</button>
              <button onClick={() => { onNavigate('sports'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 text-yellow-500">Live Sports</button>
            </div>
        </div>
      )}
    </nav>
  );
};