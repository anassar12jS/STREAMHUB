
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, PlayCircle, AlertCircle, X, Clock, Zap, Loader2, Filter, Radio, Maximize2 } from 'lucide-react';
import { getAllMatches, getStreamUrl } from '../services/sports';
import { SportsMatch, SportsMatchSource } from '../types';

export const Sports: React.FC = () => {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // Player State
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [currentMatchTitle, setCurrentMatchTitle] = useState<string>('');
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Source Modal State
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
    setCurrentMatchTitle(title);
    setSelectedMatchForSource(null); // Close source modal
    setIsPlayerOpen(true); // Open Player Modal

    try {
        const url = await getStreamUrl(source.source, source.id);
        if (url) {
            setStreamUrl(url);
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

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setStreamUrl(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2.5 rounded-lg">
               <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Live Sports</h2>
          </div>
          <p className="text-gray-400 font-medium pl-1">Real-time events dashboard</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#161616] px-5 py-3 rounded-full border border-white/10">
            <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-white font-bold text-sm tracking-wider">LIVE UPDATES</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-20 z-30 bg-[#0f0f0f]/95 backdrop-blur-sm py-4 mb-8 -mx-4 px-4 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Filter className="w-5 h-5 text-gray-500 shrink-0 mr-2" />
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                        activeCategory === cat 
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                        : 'bg-[#1a1a1a] text-gray-400 border border-white/10 hover:bg-[#252525] hover:text-white'
                    }`}
                >
                    {cat === 'ALL' ? 'ALL EVENTS' : cat}
                </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400 text-sm font-mono animate-pulse">SYNCING DATA...</p>
                </div>
            ) : processedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-[#161616] rounded-2xl border border-white/5 border-dashed">
                    <Trophy className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-gray-500 font-medium">No matches found for this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {processedData.map((match, idx) => {
                        const isLive = match.date <= Date.now();
                        const dateObj = new Date(match.date);
                        const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const dateStr = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'});
                        
                        return (
                            <div 
                                key={idx}
                                onClick={() => isLive && openSourceSelection(match)}
                                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                                    isLive 
                                        ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-blue-500/30 hover:border-blue-500/60 cursor-pointer hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                                        : 'bg-[#161616] border border-white/5 hover:border-white/10'
                                }`}
                            >
                                {/* Live Indicator Glow */}
                                {isLive && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10"></div>}

                                <div className="relative p-6 flex flex-col h-full justify-between gap-6">
                                    
                                    {/* Top Row: Meta */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-white/5 text-gray-400 border border-white/10 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                                {match.category}
                                            </span>
                                            {match.popular && (
                                                <span className="flex items-center gap-1 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                                                    <Zap className="w-3 h-3 fill-yellow-500" /> Top Pick
                                                </span>
                                            )}
                                        </div>
                                        
                                        {isLive ? (
                                            <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/20 px-3 py-1 rounded-full">
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Live Now</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{dateStr} • {timeStr}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teams Center */}
                                    <div className="flex items-center justify-between gap-4">
                                        {match.teams?.home && match.teams?.away ? (
                                            <>
                                                <div className="flex-1 text-left">
                                                    <h3 className={`font-black leading-tight uppercase ${isLive ? 'text-white text-xl md:text-2xl' : 'text-gray-300 text-lg'}`}>
                                                        {match.teams.home.name}
                                                    </h3>
                                                </div>
                                                
                                                <div className="shrink-0 flex flex-col items-center justify-center w-12">
                                                    <span className="text-[#333] font-black text-2xl italic opacity-50">VS</span>
                                                </div>

                                                <div className="flex-1 text-right">
                                                    <h3 className={`font-black leading-tight uppercase ${isLive ? 'text-white text-xl md:text-2xl' : 'text-gray-300 text-lg'}`}>
                                                        {match.teams.away.name}
                                                    </h3>
                                                </div>
                                            </>
                                        ) : (
                                            <h3 className="text-xl font-bold text-white">{match.title}</h3>
                                        )}
                                    </div>

                                    {/* Bottom Row: Action */}
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="text-xs text-gray-500 font-mono">
                                            {match.sources.length} Source{match.sources.length !== 1 && 's'} Available
                                        </div>
                                        
                                        {isLive ? (
                                            <button className="bg-white text-black px-6 py-2 rounded font-bold text-sm flex items-center gap-2 group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                                <PlayCircle className="w-4 h-4" /> WATCH
                                            </button>
                                        ) : (
                                            <button disabled className="bg-[#222] text-gray-600 px-6 py-2 rounded font-bold text-sm flex items-center gap-2 cursor-not-allowed">
                                                <Clock className="w-4 h-4" /> UPCOMING
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
      </div>

      {/* Source Selection Modal */}
      {selectedMatchForSource && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#161616]">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-blue-500" /> Select Source
                    </h3>
                    <button onClick={() => setSelectedMatchForSource(null)} className="bg-black/50 hover:bg-red-500/20 hover:text-red-500 p-1.5 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {selectedMatchForSource.sources.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handlePlay(s, selectedMatchForSource.title)}
                            className="w-full text-left px-4 py-4 hover:bg-blue-600/10 border-b border-white/5 last:border-0 group transition-colors flex justify-between items-center"
                        >
                            <span className="font-bold text-gray-200 group-hover:text-blue-400 uppercase text-sm tracking-wider">
                                {s.source}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded font-mono">
                                    ID: {s.id}
                                </span>
                                <PlayCircle className="w-4 h-4 text-gray-600 group-hover:text-blue-500" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Player Modal (Pop-up) */}
      {isPlayerOpen && (
          <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 p-4 md:p-8">
             
             {/* Header */}
             <div className="w-full max-w-5xl flex justify-between items-center mb-4">
                <div className="flex flex-col">
                    <h3 className="text-white font-bold text-lg md:text-xl line-clamp-1">{currentMatchTitle}</h3>
                    <span className="text-xs text-red-500 font-bold uppercase flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Stream
                    </span>
                </div>
                <button 
                    onClick={closePlayer}
                    className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:rotate-90"
                >
                    <X className="w-6 h-6" />
                </button>
             </div>

             {/* Player Container */}
             <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isLoadingStream ? (
                            <>
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                                <p className="text-gray-300 font-bold text-lg animate-pulse">Establishing Satellite Connection...</p>
                                <p className="text-gray-600 text-sm mt-2 font-mono">Handshaking with source</p>
                            </>
                        ) : streamError ? (
                             <div className="text-center p-6">
                                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <p className="text-white font-bold text-lg mb-2">Signal Lost</p>
                                <p className="text-gray-400">{streamError}</p>
                                <button onClick={() => setIsPlayerOpen(false)} className="mt-6 bg-white text-black px-6 py-2 rounded font-bold">
                                    Close
                                </button>
                             </div>
                        ) : null}
                    </div>
                )}
             </div>

             {/* Footer */}
             <div className="mt-4 flex gap-4">
                 {streamUrl && (
                     <a 
                        href={streamUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-gray-500 hover:text-white text-sm flex items-center gap-2 transition-colors"
                     >
                        <Maximize2 className="w-4 h-4" /> Open in New Tab
                     </a>
                 )}
             </div>
          </div>
      )}

    </div>
  );
};
