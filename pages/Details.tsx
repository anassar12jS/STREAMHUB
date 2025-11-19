import React, { useEffect, useState, useRef } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream, TMDBVideo } from '../types';
import { getDetails, getVideos } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { TMDB_IMAGE_BASE, TMDB_POSTER_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { ArrowLeft, Star, Youtube, PlayCircle, Tv, Film, X, Server, Zap, AlertCircle, Download } from 'lucide-react';

interface DetailsProps {
  item: TMDBResult;
  onBack: () => void;
}

type ServerType = 'vidlink' | 'vidsrc' | 'vidsrc-pro' | 'webtor' | 'direct';

export const Details: React.FC<DetailsProps> = ({ item, onBack }) => {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  
  // Player State
  const [showPlayer, setShowPlayer] = useState(false);
  const [server, setServer] = useState<ServerType>('vidlink');
  const [currentMagnet, setCurrentMagnet] = useState<string>('');
  const [directUrl, setDirectUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
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

  // Initialize Webtor Player
  useEffect(() => {
    if (showPlayer && server === 'webtor' && currentMagnet && detail && sdkLoaded && window.webtor) {
        // Clear previous instance if any
        const container = document.getElementById('webtor-player');
        if (container) container.innerHTML = '';

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
  }, [showPlayer, server, currentMagnet, detail, selectedSeason, selectedEpisode, sdkLoaded]);

  // Scroll to player
  useEffect(() => {
    if (showPlayer && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showPlayer]);

  if (!detail) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 bg-[#0f0f0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  const getEmbedUrl = () => {
    const id = item.id;
    const s = selectedSeason;
    const e = selectedEpisode;

    switch (server) {
      case 'vidlink':
        return item.media_type === MediaType.MOVIE 
          ? `https://vidlink.pro/movie/${id}?primaryColor=a855f7` 
          : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=a855f7`;
      case 'vidsrc-pro':
        return item.media_type === MediaType.MOVIE
          ? `https://vidsrc.to/embed/movie/${id}`
          : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
      case 'vidsrc':
      default:
        return item.media_type === MediaType.MOVIE 
          ? `https://vidsrc.xyz/embed/movie/${id}` 
          : `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`;
    }
  };

  const handleStreamPlay = (stream: Stream) => {
    setVideoError(false);
    if (stream.url) {
        setDirectUrl(stream.url);
        setServer('direct');
        setShowPlayer(true);
    } else if (stream.infoHash) {
        const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
        setCurrentMagnet(magnet);
        setServer('webtor');
        setShowPlayer(true);
    }
  };

  const handleDirectPlay = () => {
      // Reset to VidLink as it is the fastest default
      setServer('vidlink');
      setShowPlayer(true);
  };

  const backdropUrl = detail.backdrop_path ? `${TMDB_IMAGE_BASE}${detail.backdrop_path}` : '';
  const posterUrl = detail.poster_path ? `${TMDB_POSTER_BASE}${detail.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 pb-20 font-sans">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0">
        {backdropUrl && (
            <>
                <img 
                src={backdropUrl} 
                alt="bg" 
                className="w-full h-full object-cover opacity-20 blur-lg scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/80 via-[#0f0f0f]/95 to-[#0f0f0f]" />
            </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="mb-6">
            <button 
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Home</span>
            </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12">
            
            {/* Poster Column (Sticky on Desktop) */}
            <div className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                    <div className="rounded-lg overflow-hidden shadow-2xl shadow-black/80 border border-white/10 aspect-[2/3]">
                        <img src={posterUrl} alt={detail.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <button 
                        onClick={handleDirectPlay}
                        className="flex items-center justify-center w-full gap-2 bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors group"
                    >
                        <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                        <span>Play Now</span>
                    </button>

                    {trailer && (
                        <a 
                            href={`https://www.youtube.com/watch?v=${trailer.key}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-center w-full gap-2 bg-[#222] text-white border border-white/10 font-medium py-3 rounded hover:bg-[#333] transition-colors"
                        >
                            <Youtube className="w-5 h-5 text-red-600" /> 
                            <span>Watch Trailer</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Content Column */}
            <div className="flex flex-col min-w-0">
                
                {/* Mobile Header (Poster + Basic Info) */}
                <div className="lg:hidden flex gap-4 mb-6">
                    <div className="w-28 shrink-0 rounded overflow-hidden shadow-lg border border-white/10 aspect-[2/3]">
                        <img src={posterUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                         <h1 className="text-xl font-bold text-white leading-tight">{detail.title || detail.name}</h1>
                         <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-white">{detail.vote_average.toFixed(1)}</span>
                            <span>•</span>
                            <span>{detail.release_date?.split('-')[0] || 'N/A'}</span>
                         </div>
                         <button 
                             onClick={handleDirectPlay}
                             className="mt-2 bg-white text-black text-xs font-bold py-2 px-4 rounded w-fit flex items-center gap-2"
                        >
                             <PlayCircle className="w-4 h-4" /> Play Now
                         </button>
                    </div>
                </div>

                {/* Desktop Title & Metadata */}
                <div className="hidden lg:block mb-6">
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                        {detail.title || detail.name}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-1 text-white">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {detail.vote_average.toFixed(1)}
                        </span>
                        <span>{detail.release_date || detail.first_air_date}</span>
                        {detail.runtime && <span>{detail.runtime} min</span>}
                        <div className="flex gap-2">
                            {detail.genres.map(g => (
                                <span key={g.id} className="border border-gray-700 px-2 py-0.5 rounded text-xs">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overview */}
                <div className="mb-10">
                    <h3 className="text-white font-bold text-lg mb-2">Overview</h3>
                    <p className="text-gray-400 leading-relaxed">
                        {detail.overview}
                    </p>
                </div>

                {/* Player (Expandable) */}
                {showPlayer && (
                    <div ref={playerRef} className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative group">
                            {/* Player Controls Overlay */}
                            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10">
                                        <Server className="w-4 h-4 text-purple-400 ml-2" />
                                        <select 
                                            value={server}
                                            onChange={(e) => setServer(e.target.value as ServerType)}
                                            className="bg-transparent text-white text-xs font-bold py-1 pr-2 focus:outline-none cursor-pointer"
                                        >
                                            <option value="vidlink">VidLink (Fastest)</option>
                                            <option value="vidsrc-pro">VidSrc Pro</option>
                                            <option value="vidsrc">VidSrc Legacy</option>
                                            <option value="direct">Direct Play</option>
                                            <option value="webtor">P2P Torrent (Slow)</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setShowPlayer(false); setCurrentMagnet(''); setDirectUrl(''); }}
                                    className="bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Logic for different players */}
                            {server === 'direct' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center relative">
                                     {!videoError ? (
                                        <video 
                                            controls 
                                            autoPlay 
                                            className="w-full h-full outline-none"
                                            src={directUrl}
                                            onError={() => setVideoError(true)}
                                        >
                                        </video>
                                     ) : (
                                        <div className="text-center p-6">
                                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                            <p className="text-white font-bold mb-2">Playback Failed</p>
                                            <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
                                                The browser cannot play this file format natively (likely MKV). 
                                                Please download it or use an external player like VLC.
                                            </p>
                                            <a 
                                                href={directUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
                                            >
                                                <Download className="w-4 h-4" /> Download / Open
                                            </a>
                                        </div>
                                     )}
                                </div>
                            ) : server === 'webtor' ? (
                                <div id="webtor-player" className="w-full h-full bg-black flex items-center justify-center relative">
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                         <div className="bg-black/80 p-4 rounded text-center">
                                            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-white">P2P Stream Active</p>
                                            <p className="text-xs text-gray-400">Waiting for peers...</p>
                                         </div>
                                    </div>
                                </div>
                            ) : (
                                <iframe 
                                    src={getEmbedUrl()} 
                                    className="w-full h-full" 
                                    frameBorder="0" 
                                    allowFullScreen 
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    referrerPolicy="origin"
                                ></iframe>
                            )}
                        </div>
                        {server === 'webtor' && (
                            <p className="text-xs text-center text-yellow-500/80 mt-3 font-mono">
                                Note: P2P streaming relies on seeds. It may be slow or fail for older content. 
                                Switch to "VidLink" for instant playback.
                            </p>
                        )}
                        {server === 'direct' && !videoError && (
                            <p className="text-xs text-center text-gray-500 mt-3 font-mono">
                                Playing directly from source. If no sound or video, file type may be unsupported.
                            </p>
                        )}
                    </div>
                )}

                {/* TV Controls */}
                {item.media_type === MediaType.TV && (
                    <div className="mb-8 bg-[#161616] rounded-lg border border-white/5 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Tv className="w-5 h-5 text-gray-400" />
                            <h3 className="font-bold text-white">Episodes</h3>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Season</label>
                                <select 
                                    value={selectedSeason}
                                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                                    className="block bg-[#0a0a0a] border border-gray-700 text-white rounded px-4 py-2.5 outline-none focus:border-white transition-colors min-w-[120px]"
                                >
                                    {[...Array(detail.number_of_seasons || 1)].map((_, i) => (
                                        <option key={i} value={i + 1}>Season {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Episode</label>
                                <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => setSelectedEpisode(Math.max(1, selectedEpisode - 1))}
                                        className="p-2.5 rounded bg-[#0a0a0a] border border-gray-700 hover:bg-gray-700 text-white disabled:opacity-50"
                                        disabled={selectedEpisode <= 1}
                                     >
                                        <ArrowLeft className="w-5 h-5" />
                                     </button>
                                     
                                     <div className="bg-[#0a0a0a] border border-gray-700 text-white font-bold rounded px-6 py-2.5 min-w-[60px] text-center">
                                        {selectedEpisode}
                                     </div>

                                     <button 
                                        onClick={() => setSelectedEpisode(selectedEpisode + 1)}
                                        className="p-2.5 rounded bg-[#0a0a0a] border border-gray-700 hover:bg-gray-700 text-white"
                                     >
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Streams List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Film className="w-5 h-5 text-gray-400" />
                            Torrent Streams
                        </h2>
                        {loadingStreams && (
                            <span className="text-xs text-gray-500 animate-pulse uppercase font-bold tracking-wider">Searching...</span>
                        )}
                    </div>
                    
                    <div className="bg-[#161616] rounded-lg border border-white/5 overflow-hidden">
                         {!loadingStreams && streams.length > 0 && (
                            <div className="bg-[#0a0a0a] px-4 py-2 border-b border-white/5 flex items-center gap-4 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                <span>Source</span>
                                <span className="flex-1">Filename</span>
                                <span>Size</span>
                            </div>
                         )}
                         <div className="p-2">
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
