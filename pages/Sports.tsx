
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, PlayCircle, AlertCircle, Wifi, X, Clock, Zap, MonitorPlay, Loader2 } from 'lucide-react';
import { getAllMatches, getStreamUrl } from '../services/sports';
import { SportsMatch, SportsMatchSource } from '../types';

export const Sports: React.FC = () => {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // Player State
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [currentMatchTitle, setCurrentMatchTitle] = useState<string>('');
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Modal State
  const [selectedMatchForSource, setSelectedMatchForSource] = useState<SportsMatch | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await getAllMatches();
        setMatches(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMatches, 300000);
    return () => clearInterval(interval);
  }, []);

  // Filtering & Sorting Logic
  const processedData = useMemo(() => {
    const now = Date.now();
    
    // 1. Filter
    let filtered = activeCategory === 'ALL' 
        ? matches 
        : matches.filter(m => m.category.toUpperCase() === activeCategory);

    // 2. Sort: Live > Popular > Upcoming
    return filtered.sort((a, b) => {
        const aLive = a.date <= now;
        const bLive = b.date <= now;
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        
        return a.date - b.date;
    });
  }, [matches, activeCategory]);

  // Extract Categories
  const categories = useMemo(() => {
    const cats = new Set(matches.map(m => m.category.toUpperCase()));
    return ['ALL', ...Array.from(cats)];
  }, [matches]);

  const handlePlay = async (source: SportsMatchSource, title: string) => {
    setStreamUrl(null);
    setIsLoadingStream(true);
    setStreamError(null);
    setDebugInfo(null);
    setCurrentMatchTitle(title);
    setSelectedMatchForSource(null); // Close modal if open

    // Scroll to player on mobile
    if (window.innerWidth < 1024) {
        document.getElementById('player-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }

    try {
        const url = await getStreamUrl(source.source, source.id);
        if (url) {
            setStreamUrl(url);
            setDebugInfo(`${source.source} / ${source.id}`);
        } else {
            setStreamError('Stream source unavailable. Try another.');
        }
    } catch (e) {
        setStreamError('Failed to load stream.');
    } finally {
        setIsLoadingStream(false);
    }
  };

  const openSourceSelection = (match: SportsMatch) => {
    if (match.sources.length === 1) {
        handlePlay(match.sources[0], match.title);
    } else {
        setSelectedMatchForSource(match);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg shadow-blue-900/20">
             <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Live Sports</h2>
            <p className="text-gray-400 text-sm font-medium">Real-time dashboard</p>
          </div>
        </div>
        <div className="bg-[#161616] px-4 py-2 rounded-lg border border-white/5 text-sm font-mono text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Matches List */}
        <div className="lg:col-span-2 flex flex-col h-full">
            
            {/* Categories */}
            <div className="mb-6 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex space-x-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                                activeCategory === cat 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 scale-105' 
                                : 'bg-[#161616] text-gray-400 border border-white/5 hover:bg-[#222] hover:text-white'
                            }`}
                        >
                            {cat === 'ALL' ? 'All Sports' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Container */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#161616] rounded-xl border border-white/5">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400 text-sm">Syncing live events...</p>
                    </div>
                ) : processedData.length === 0 ? (
                    <div className="text-center py-20 bg-[#161616] rounded-xl border border-white/5">
                        <p className="text-gray-500">No matches found for this category.</p>
                    </div>
                ) : (
                    processedData.map((match, idx) => {
                        const isLive = match.date <= Date.now();
                        const timeStr = new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        return (
                            <div 
                                key={idx}
                                className={`group relative bg-[#161616] rounded-xl p-4 border transition-all duration-300 hover:bg-[#1a1a1a] ${isLive ? 'border-l-4 border-l-red-500 border-y-white/5 border-r-white/5' : 'border-white/5 hover:border-gray-700'}`}
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    
                                    {/* Match Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {isLive ? (
                                                <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> Live Now
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    <Calendar className="w-3 h-3" /> {timeStr}
                                                </span>
                                            )}
                                            {match.popular && (
                                                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                                    <Zap className="w-3 h-3" /> Popular
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-gray-500 uppercase border border-gray-800 px-1.5 rounded">
                                                {match.category}
                                            </span>
                                        </div>

                                        <div className="mb-1">
                                            {match.teams?.home && match.teams?.away ? (
                                                <div className="flex items-center gap-3 text-lg font-bold text-gray-100">
                                                    <span className="truncate">{match.teams.home.name}</span>
                                                    <span className="text-gray-600 text-sm font-medium">VS</span>
                                                    <span className="truncate">{match.teams.away.name}</span>
                                                </div>
                                            ) : (
                                                <h3 className="text-lg font-bold text-gray-100 truncate">{match.title}</h3>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button 
                                        onClick={() => openSourceSelection(match)}
                                        className={`shrink-0 w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                            isLive 
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                                : 'bg-[#222] text-gray-500 cursor-not-allowed'
                                        }`}
                                        disabled={!isLive}
                                    >
                                        {isLive ? <PlayCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        {isLive ? 'Watch' : 'Upcoming'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: Player (Sticky) */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4" id="player-anchor">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MonitorPlay className="w-5 h-5 text-purple-500" />
                    Stream Player
                </h2>
                
                <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 aspect-video relative group">
                    {streamUrl ? (
                        <iframe 
                            src={streamUrl} 
                            className="w-full h-full" 
                            frameBorder="0" 
                            allowFullScreen 
                            allow="autoplay; encrypted-media"
                            referrerPolicy="origin"
                        ></iframe>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#121212]">
                            {isLoadingStream ? (
                                <>
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                    <p className="text-gray-300 font-bold animate-pulse">Connecting to source...</p>
                                </>
                            ) : streamError ? (
                                <>
                                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                                    <p className="text-red-400 font-medium mb-2">{streamError}</p>
                                    <p className="text-xs text-gray-500">Try selecting a different source (Alpha/Charlie).</p>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white/5 p-4 rounded-full mb-4">
                                        <PlayCircle className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <p className="text-gray-400 font-medium">Select a live match to start streaming</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Player Footer Info */}
                <div className="bg-[#161616] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${streamUrl ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            <span className={`text-xs font-bold ${streamUrl ? 'text-green-500' : 'text-gray-500'}`}>
                                {streamUrl ? 'Connected' : 'Idle'}
                            </span>
                        </div>
                    </div>
                    {currentMatchTitle && (
                        <p className="text-sm font-bold text-white truncate border-t border-white/5 pt-2 mt-1">
                            {currentMatchTitle}
                        </p>
                    )}
                    {streamUrl && (
                        <a 
                            href={streamUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-3 block w-full text-center py-2 bg-white/5 hover:bg-white/10 text-blue-400 text-xs font-bold rounded transition-colors"
                        >
                            Open in New Tab ↗
                        </a>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* Source Selection Modal */}
      {selectedMatchForSource && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#161616] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#1a1a1a]">
                    <h3 className="font-bold text-white">Select Stream Source</h3>
                    <button onClick={() => setSelectedMatchForSource(null)} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {selectedMatchForSource.sources.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handlePlay(s, selectedMatchForSource.title)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-600/20 border-b border-gray-800 last:border-0 group transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-200 group-hover:text-blue-400 uppercase text-sm">
                                    {s.source}
                                </span>
                                <span className="text-[10px] bg-black/50 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                    ID: {s.id}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-3 bg-[#1a1a1a] text-center">
                    <p className="text-[10px] text-gray-500">
                        If one source fails or lags, try another (e.g., Alpha vs Charlie).
                    </p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
