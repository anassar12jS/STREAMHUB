import React, { useEffect, useState, useRef } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream, TMDBVideo } from '../types';
import { getDetails, getVideos } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { TMDB_IMAGE_BASE, TMDB_POSTER_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { ArrowLeft, Star, Calendar, Clock, Layers, Youtube, PlayCircle, Tv, Film, X, Share2 } from 'lucide-react';

interface DetailsProps {
  item: TMDBResult;
  onBack: () => void;
}

export const Details: React.FC<DetailsProps> = ({ item, onBack }) => {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerMode, setPlayerMode] = useState<'embed' | 'webtor'>('embed');
  const [currentMagnet, setCurrentMagnet] = useState<string>('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // Fetch Details
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const d = await getDetails(item.id, item.media_type);
        setDetail(d);
        
        // Fetch Videos
        const videos = await getVideos(item.id, item.media_type);
        // Prioritize official trailers
        const officialTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
        if (officialTrailer) setTrailer(officialTrailer);

        // Fetch Streams if Movie
        if (item.media_type === MediaType.MOVIE && d.external_ids?.imdb_id) {
          setLoadingStreams(true);
          const s = await getStreams(MediaType.MOVIE, d.external_ids.imdb_id);
          setStreams(s.streams);
          setLoadingStreams(false);
        }
      } catch (e) {
        console.error("Error loading details", e);
      }
    };
    fetchInfo();
  }, [item]);

  // Fetch Streams if TV (Episode change)
  useEffect(() => {
    if (item.media_type === MediaType.TV && detail?.external_ids?.imdb_id) {
      const fetchEp = async () => {
        setLoadingStreams(true);
        const s = await getEpisodeStreams(detail.external_ids!.imdb_id!, selectedSeason, selectedEpisode);
        setStreams(s.streams);
        setLoadingStreams(false);
      };
      fetchEp();
    }
  }, [selectedSeason, selectedEpisode, detail]);

  // Load Webtor SDK dynamically
  useEffect(() => {
    if (document.getElementById('webtor-sdk')) {
      setSdkLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'webtor-sdk';
    script.src = 'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize Webtor Player when conditions are met
  useEffect(() => {
    if (showPlayer && playerMode === 'webtor' && currentMagnet && detail && sdkLoaded && window.webtor) {
        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            window.webtor.push({
                id: 'webtor-player',
                magnet: currentMagnet,
                width: '100%',
                height: '100%',
                imdbId: detail.external_ids?.imdb_id,
                poster: detail.backdrop_path ? `${TMDB_IMAGE_BASE}${detail.backdrop_path}` : undefined,
                title: item.media_type === MediaType.TV 
                    ? `${detail.title || detail.name} - S${selectedSeason}E${selectedEpisode}` 
                    : (detail.title || detail.name),
                theme: 'dark'
            });
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [showPlayer, playerMode, currentMagnet, detail, selectedSeason, selectedEpisode, sdkLoaded]);

  // Scroll to player when opened
  useEffect(() => {
    if (showPlayer && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showPlayer]);

  if (!detail) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 bg-[#111]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-gray-500 font-medium">Loading content...</p>
      </div>
    );
  }

  const getEmbedUrl = () => {
    if (item.media_type === MediaType.MOVIE) {
      return `https://vidsrc.xyz/embed/movie/${item.id}`;
    } else {
      return `https://vidsrc.xyz/embed/tv/${item.id}/${selectedSeason}/${selectedEpisode}`;
    }
  };

  const handleStreamPlay = (stream: Stream) => {
    if (stream.infoHash) {
        const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
        setCurrentMagnet(magnet);
        setPlayerMode('webtor');
        setShowPlayer(true);
    }
  };

  const handleDirectPlay = () => {
      setPlayerMode('embed');
      setShowPlayer(true);
  };

  const backdropUrl = detail.backdrop_path ? `${TMDB_IMAGE_BASE}${detail.backdrop_path}` : '';
  const posterUrl = detail.poster_path ? `${TMDB_POSTER_BASE}${detail.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';

  return (
    <div className="min-h-screen bg-[#111] text-gray-100 pb-20 font-sans selection:bg-purple-500/30">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0">
        {backdropUrl && (
            <>
                <img 
                src={backdropUrl} 
                alt="bg" 
                className="w-full h-full object-cover opacity-30 blur-md scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#111]/60 via-[#111]/90 to-[#111]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111]/80 via-transparent to-[#111]/80" />
            </>
        )}
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
            <button 
            onClick={onBack}
            className="flex items-center text-gray-300 hover:text-white transition-colors group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
            >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
            </button>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-8 lg:gap-12">
            
            {/* Left Column: Poster (Sticky on Desktop) */}
            <div className="hidden md:block">
                <div className="sticky top-24 space-y-6">
                    <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 aspect-[2/3] group relative">
                        <img 
                            src={posterUrl} 
                            alt={detail.title} 
                            className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="space-y-3">
                        <button 
                            onClick={handleDirectPlay}
                            className="flex items-center justify-center w-full gap-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <PlayCircle className="w-5 h-5 fill-current" /> 
                            <span>Quick Play</span>
                        </button>

                        {trailer && (
                        <a 
                            href={`https://www.youtube.com/watch?v=${trailer.key}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-center w-full gap-3 bg-[#222] hover:bg-[#333] text-white border border-white/10 font-semibold py-3.5 px-4 rounded-xl transition-all"
                        >
                            <Youtube className="w-5 h-5 text-red-500" /> 
                            <span>Trailer</span>
                        </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Content */}
            <div className="flex flex-col min-w-0">
                
                {/* Mobile Layout: Poster + Info Side-by-side */}
                <div className="md:hidden flex gap-5 mb-6">
                    <div className="w-32 shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/10 aspect-[2/3]">
                        <img src={posterUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center gap-3">
                         <div className="flex flex-wrap gap-2">
                             {detail.genres.slice(0, 2).map(g => (
                                 <span key={g.id} className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">{g.name}</span>
                             ))}
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-white">{detail.vote_average.toFixed(1)}</span>
                            </div>
                            <div className="text-sm text-gray-400">{detail.release_date?.split('-')[0] || 'N/A'} • {detail.runtime}m</div>
                         </div>
                         <button 
                             onClick={handleDirectPlay}
                             className="mt-1 bg-purple-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-purple-900/30"
                        >
                             Play Now
                         </button>
                    </div>
                </div>

                {/* Title & Metadata (Desktop) */}
                <div className="space-y-4 mb-8">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                        {detail.title || detail.name}
                    </h1>

                    {/* Desktop Metadata Bar */}
                    <div className="hidden md:flex flex-wrap items-center gap-6 text-gray-300 text-sm font-medium">
                        <span className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">
                            <Star className="w-4 h-4 fill-current" /> {detail.vote_average.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" /> {detail.release_date || detail.first_air_date}
                        </span>
                        {detail.runtime && (
                            <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" /> {detail.runtime} min
                            </span>
                        )}
                        {detail.number_of_seasons && (
                            <span className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-500" /> {detail.number_of_seasons} Seasons
                            </span>
                        )}
                        <div className="w-px h-4 bg-gray-700"></div>
                        <div className="flex gap-2">
                            {detail.genres.map(g => (
                                <span key={g.id} className="text-xs text-gray-400 border border-gray-700 px-2 py-0.5 rounded-md hover:text-white hover:border-gray-500 transition-colors cursor-default">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Overview */}
                <div className="mb-10">
                    <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                        Storyline
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-lg font-light opacity-90 max-w-3xl">
                        {detail.overview}
                    </p>
                </div>

                {/* Player Section (Expandable) */}
                {showPlayer && (
                    <div ref={playerRef} className="mb-12 animate-in fade-in zoom-in duration-300">
                        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative ring-4 ring-purple-900/20">
                            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
                                <div className="flex items-center gap-3 pointer-events-auto">
                                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md border ${
                                         playerMode === 'webtor' 
                                         ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                         : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                     }`}>
                                        {playerMode === 'webtor' ? '⚡ P2P Stream' : '🌐 HTTP Stream'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => { setShowPlayer(false); setCurrentMagnet(''); }}
                                    className="bg-black/40 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-md pointer-events-auto border border-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {playerMode === 'embed' ? (
                                <iframe 
                                    src={getEmbedUrl()} 
                                    className="w-full h-full" 
                                    frameBorder="0" 
                                    allowFullScreen 
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    referrerPolicy="origin"
                                ></iframe>
                            ) : (
                                <div id="webtor-player" className="w-full h-full bg-black flex items-center justify-center">
                                    {!sdkLoaded ? (
                                        <div className="text-gray-500 flex items-center gap-3">
                                            <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                            <span className="font-medium">Loading Player SDK...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-gray-500 animate-pulse">
                                            <div className="w-12 h-12 rounded-full border-2 border-gray-700 border-t-gray-400 animate-spin"></div>
                                            <span className="font-mono text-sm">Initializing Secure Stream...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TV Series Controls */}
                {item.media_type === MediaType.TV && (
                    <div className="mb-10 bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                        <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <Tv className="w-5 h-5 text-purple-500" />
                            <h3 className="font-bold text-white">Episodes</h3>
                        </div>
                        <div className="p-6 flex flex-wrap gap-6 items-center">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Season</label>
                                <div className="relative">
                                    <select 
                                        value={selectedSeason}
                                        onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                                        className="appearance-none bg-[#0f0f0f] border border-gray-700 text-white text-lg font-bold rounded-lg pl-4 pr-10 py-3 focus:ring-2 focus:ring-purple-500 outline-none min-w-[120px] cursor-pointer hover:border-gray-500 transition-colors"
                                    >
                                        {[...Array(detail.number_of_seasons || 1)].map((_, i) => (
                                            <option key={i} value={i + 1}>Season {i + 1}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Episode</label>
                                <div className="flex items-center gap-4">
                                     <button 
                                        onClick={() => setSelectedEpisode(Math.max(1, selectedEpisode - 1))}
                                        className="p-3 rounded-lg bg-[#0f0f0f] border border-gray-700 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
                                        disabled={selectedEpisode <= 1}
                                     >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                                     </button>
                                     
                                     <div className="bg-[#0f0f0f] border border-gray-700 text-white text-lg font-bold rounded-lg px-6 py-3 min-w-[80px] text-center">
                                        {selectedEpisode}
                                     </div>

                                     <button 
                                        onClick={() => setSelectedEpisode(selectedEpisode + 1)}
                                        className="p-3 rounded-lg bg-[#0f0f0f] border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                                     >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Streams List */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Film className="w-6 h-6 text-purple-500" />
                            Available Streams
                        </h2>
                        {loadingStreams && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold animate-pulse border border-purple-500/20">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                SEARCHING
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden shadow-inner">
                         {/* Info Banner */}
                         {!loadingStreams && streams.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-900/20 to-transparent px-6 py-3 border-b border-white/5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5 text-emerald-400" /> Direct Play supported</span>
                                <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-blue-400" /> P2P/Magnet supported</span>
                            </div>
                         )}

                         <div className="p-4 sm:p-6">
                             <StreamList streams={streams} loading={loadingStreams} onPlay={handleStreamPlay} />
                         </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};