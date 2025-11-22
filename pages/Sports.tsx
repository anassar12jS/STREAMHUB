
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, PlayCircle, AlertCircle, X, Clock, Zap, Loader2, Filter, Radio, Maximize2, Bell, BellRing } from 'lucide-react';
import { getAllMatches, getStreamUrl } from '../services/sports';
import { SportsMatch, SportsMatchSource } from '../types';

const TeamLogo: React.FC<{ name: string, className?: string }> = ({ name, className = "w-8 h-8" }) => {
    // Generate a consistent color based on the name
    const getColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    // Get initials (up to 2)
    const initials = name.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const bg = getColor(name);

    return (
        <div 
            className={`rounded-full flex items-center justify-center text-white font-bold shadow-sm border border-white/10 ${className}`} 
            style={{ backgroundColor: bg, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
            {initials}
        </div>
    );
};

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
  const [notifiedMatches, setNotifiedMatches] = useState<string[]>([]);

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

  // Extract & Prioritize Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(matches.map(m => m.category.toUpperCase()))) as string[];
    const priority = ['FOOTBALL', 'FIGHT', 'MOTORSPORT', 'BASKETBALL', 'TENNIS', 'BASEBALL'];

    cats.sort((a, b) => {
        const idxA = priority.indexOf(a);
        const idxB = priority.indexOf(b);
        
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    return ['ALL', ...cats];
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

  const handleNotify = (match: SportsMatch, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!("Notification" in window)) {
          alert("This browser does not support notifications.");
          return;
      }

      if (Notification.permission === "granted") {
          scheduleNotification(match);
      } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                  scheduleNotification(match);
              }
          });
      }
  };

  const scheduleNotification = (match: SportsMatch) => {
      const now = Date.now();
      const diff = match.date - now;
      
      if (diff > 0) {
          setNotifiedMatches(prev => [...prev, match.title]);
          
          // Notify 5 mins before if possible, else immediately if close
          const timeout = Math.max(0, diff - (5 * 60 * 1000)); 
          
          setTimeout(() => {
              new Notification("Match Starting Soon!", {
                  body: `${match.title} is starting in 5 minutes!`,
                  icon: "https://cdn-icons-png.flaticon.com/512/4221/4221484.png"
              });
          }, timeout);
          
          // Also notify at exact start time
          setTimeout(() => {
               new Notification("Match Started!", {
                  body: `${match.title} is live now!`,
                  icon: "https://cdn-icons-png.flaticon.com/512/4221/4221484.png"
              });
          }, diff);
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2.5 rounded-lg shadow-lg shadow-blue-900/20">
               <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight uppercase italic">Live Sports</h2>
          </div>
          <p className="text-[var(--text-muted)] font-medium pl-1">Real-time events dashboard</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[var(--bg-card)] px-5 py-3 rounded-full border border-[var(--border-color)]">
            <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-[var(--text-main)] font-bold text-sm tracking-wider">LIVE UPDATES</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-16 z-30 bg-[var(--bg-main)]/95 backdrop-blur-sm py-4 mb-8 -mx-4 px-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Filter className="w-5 h-5 text-[var(--text-muted)] shrink-0 mr-2" />
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                        activeCategory === cat 
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
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
                    <p className="text-[var(--text-muted)] text-sm font-mono animate-pulse">SYNCING DATA...</p>
                </div>
            ) : processedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] border-dashed">
                    <Trophy className="w-16 h-16 text-[var(--text-muted)] mb-4" />
                    <p className="text-[var(--text-muted)] font-medium">No matches found for this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {processedData.map((match, idx) => {
                        const isLive = match.date <= Date.now();
                        const dateObj = new Date(match.date);
                        const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const dateStr = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'});
                        const isNotified = notifiedMatches.includes(match.title);

                        return (
                            <div 
                                key={idx}
                                onClick={() => isLive && openSourceSelection(match)}
                                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                                    isLive 
                                        ? 'bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-hover)] border border-blue-500/30 hover:border-blue-500/60 cursor-pointer hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-color)]'
                                }`}
                            >
                                {/* Live Indicator Glow */}
                                {isLive && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10"></div>}

                                <div className="relative p-6 flex flex-col h-full justify-between gap-6">
                                    
                                    {/* Top Row: Meta */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-color)] px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">
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
                                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{dateStr} • {timeStr}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teams Center */}
                                    <div className="flex items-center justify-between gap-4">
                                        {match.teams?.home && match.teams?.away ? (
                                            <>
                                                <div className="flex-1 flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
                                                    <TeamLogo name={match.teams.home.name} className="w-12 h-12 sm:w-10 sm:h-10 text-lg" />
                                                    <h3 className={`font-black leading-tight uppercase ${isLive ? 'text-[var(--text-main)] text-lg md:text-xl' : 'text-[var(--text-muted)] text-base'}`}>
                                                        {match.teams.home.name}
                                                    </h3>
                                                </div>
                                                
                                                <div className="shrink-0 flex flex-col items-center justify-center w-12">
                                                    <span className="text-[var(--text-muted)] font-black text-2xl italic opacity-50">VS</span>
                                                </div>

                                                <div className="flex-1 flex flex-col items-center text-center sm:items-end sm:text-right gap-2">
                                                    <TeamLogo name={match.teams.away.name} className="w-12 h-12 sm:w-10 sm:h-10 text-lg" />
                                                    <h3 className={`font-black leading-tight uppercase ${isLive ? 'text-[var(--text-main)] text-lg md:text-xl' : 'text-[var(--text-muted)] text-base'}`}>
                                                        {match.teams.away.name}
                                                    </h3>
                                                </div>
                                            </>
                                        ) : (
                                            <h3 className="text-xl font-bold text-[var(--text-main)]">{match.title}</h3>
                                        )}
                                    </div>

                                    {/* Bottom Row: Action */}
                                    <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                                        <div className="text-xs text-[var(--text-muted)] font-mono">
                                            {match.sources.length} Source{match.sources.length !== 1 && 's'} Available
                                        </div>
                                        
                                        {isLive ? (
                                            <button className="bg-[var(--text-main)] text-[var(--bg-main)] px-6 py-2 rounded font-bold text-sm flex items-center gap-2 group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                                <PlayCircle className="w-4 h-4" /> WATCH
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => handleNotify(match, e)}
                                                    disabled={isNotified}
                                                    className={`px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors border ${isNotified ? 'bg-[rgb(var(--primary-color))]/20 text-[rgb(var(--primary-color))] border-[rgb(var(--primary-color))]' : 'bg-transparent text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)] hover:border-[var(--text-main)]'}`}
                                                >
                                                    {isNotified ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                    {isNotified ? 'SET' : 'NOTIFY'}
                                                </button>
                                                <button disabled className="bg-[var(--bg-hover)] text-[var(--text-muted)] px-4 py-2 rounded font-bold text-sm flex items-center gap-2 cursor-not-allowed opacity-50">
                                                    <Clock className="w-4 h-4" /> SOON
                                                </button>
                                            </div>
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
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-hover)]">
                    <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
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
                            className="w-full text-left px-4 py-4 hover:bg-blue-600/10 border-b border-[var(--border-color)] last:border-0 group transition-colors flex justify-between items-center"
                        >
                            <span className="font-bold text-[var(--text-muted)] group-hover:text-blue-400 uppercase text-sm tracking-wider">
                                {s.source}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] bg-[var(--bg-input)] text-[var(--text-muted)] px-2 py-1 rounded font-mono">
                                    ID: {s.id}
                                </span>
                                <PlayCircle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Player Modal (Pop-up) - Keep dark for player */}
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
