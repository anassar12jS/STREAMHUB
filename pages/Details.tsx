import React, { useEffect, useState, useRef } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream, TMDBVideo, Collection } from '../types';
import { getDetails, getVideos, getRecommendations, getCollection } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { isInWatchlist, addToWatchlist, removeFromWatchlist, addToHistory } from '../services/storage';
import { TMDB_IMAGE_BASE, TMDB_POSTER_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { MediaCard } from '../components/MediaCard';
import { Footer } from '../components/Footer';
import { ArrowLeft, Star, Youtube, PlayCircle, Tv, Film, X, Server, AlertCircle, Download, Info, Plus, Check, Sparkles, Captions, ChevronUp, ChevronDown, Layers, Zap } from 'lucide-react';

interface DetailsProps {
  item: TMDBResult;
  onBack: () => void;
  onPersonClick?: (id: number) => void;
  onNavigate: (view: string) => void;
}

type ServerType = 'vidsrc-wtf' | 'vidsrc-cc' | 'videasy' | 'vidora' | 'cinemaos' | 'vidlink' | 'vidfastpro' | 'direct';

export const Details: React.FC<DetailsProps> = ({ item, onBack, onPersonClick, onNavigate }) => {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null);
  const [recommendations, setRecommendations] = useState<TMDBResult[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [inLibrary, setInLibrary] = useState(false);
  const [streamsExpanded, setStreamsExpanded] = useState(true);
  
  const [showPlayer, setShowPlayer] = useState(false);
  const [server, setServer] = useState<ServerType>('vidsrc-wtf');
  const [directUrl, setDirectUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const d = await getDetails(item.id, item.media_type);
        setDetail(d);
        setInLibrary(isInWatchlist(item.id));
        addToHistory(item);
        
        const videos = await getVideos(item.id, item.media_type);
        const officialTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
        if (officialTrailer) setTrailer(officialTrailer);

        const recs = await getRecommendations(item.id, item.media_type);
        setRecommendations(recs.slice(0, 10));

        if (d.belongs_to_collection) {
            const colData = await getCollection(d.belongs_to_collection.id);
            colData.parts.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
            setCollection(colData);
        } else {
            setCollection(null);
        }

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
    window.scrollTo(0,0);
  }, [item]);

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

  useEffect(() => {
    if (showPlayer && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showPlayer]);

  const toggleLibrary = () => {
    if (inLibrary) {
      removeFromWatchlist(item.id);
      setInLibrary(false);
    } else {
      addToWatchlist(item);
      setInLibrary(true);
    }
  };

  const handleRecClick = (rec: TMDBResult) => {
     window.history.pushState({ view: 'details', item: rec }, '', `?id=${rec.id}&type=${rec.media_type}`);
     window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'details', item: rec } }));
     window.scrollTo(0,0);
  };

  if (!detail) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 bg-[var(--bg-main)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-main)]"></div>
        <p className="text-[var(--text-muted)] font-medium">Loading...</p>
      </div>
    );
  }

  const getEmbedUrl = () => {
    const imdbId = detail.external_ids?.imdb_id || `tmdb:${item.id}`;
    const s = selectedSeason;
    const e = selectedEpisode;
    const id = detail.external_ids?.imdb_id || item.id;

    switch (server) {
      case 'vidsrc-wtf':
        return item.media_type === MediaType.MOVIE
          ? `https://vidsrc.wtf/api/1/movie/?id=${id}`
          : `https://vidsrc.wtf/api/1/tv/?id=${id}&s=${s}&e=${e}`;
      case 'vidsrc-cc':
        return item.media_type === MediaType.MOVIE
          ? `https://vidsrc.cc/v2/embed/movie/${imdbId}`
          : `https://vidsrc.cc/v2/embed/tv/${imdbId}/${s}/${e}`;
      case 'videasy':
        return item.media_type === MediaType.MOVIE
          ? `https://player.videasy.net/movie/${id}`
          : `https://player.videasy.net/tv/${id}/${s}/${e}`;
      case 'vidora':
        return item.media_type === MediaType.MOVIE
          ? `https://vidora.su/movie/${id}`
          : `https://vidora.su/tv/${id}/${s}/${e}`;
      case 'cinemaos':
        return item.media_type === MediaType.MOVIE
          ? `https://cinemaos.tech/player/${id}`
          : `https://cinemaos.tech/player/${id}/${s}/${e}`;
      case 'vidlink':
        return item.media_type === MediaType.MOVIE 
          ? `https://vidlink.pro/movie/${id}` 
          : `https://vidlink.pro/tv/${id}/${s}/${e}`;
      case 'vidfastpro':
        return item.media_type === MediaType.MOVIE 
          ? `https://vidfast.pro/movie/${id}`
          : `https://vidfast.pro/tv/${id}/${s}/${e}`;
      default:
        return '';
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
        window.location.href = magnet;
    }
  };

  const handleDirectPlay = () => {
      setServer('vidsrc-wtf');
      setShowPlayer(true);
  };

  const openSubtitles = () => {
      if (detail.external_ids?.imdb_id) {
          window.open(`https://www.opensubtitles.org/en/search/imdbid-${detail.external_ids.imdb_id.replace('tt', '')}`, '_blank');
      }
  };

  const backdropUrl = detail.backdrop_path ? `${TMDB_IMAGE_BASE}${detail.backdrop_path}` : '';
  const posterUrl = detail.poster_path ? `${TMDB_POSTER_BASE}${detail.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';

  const servers = [
      { id: 'vidsrc-wtf', label: 'VidSrc WTF', icon: Zap, badge: 'Fastest' },
      { id: 'vidsrc-cc', label: 'VidSrc CC', icon: PlayCircle, badge: 'New' },
      { id: 'vidsrc-pro', label: 'VidSrc Pro', icon: Server, badge: 'Reliable' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans transition-colors duration-300 flex flex-col">
      <div className="fixed inset-0 z-0">
        {backdropUrl && (
            <>
                <img src={backdropUrl} alt="bg" className="w-full h-full object-cover opacity-20 blur-lg scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)]/80 via-[var(--bg-main)]/95 to-[var(--bg-main)]" />
            </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <div className="mb-6">
            <button onClick={onBack} className="flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> <span className="font-medium">Back</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12 mb-20">
            <div className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                    <div className="rounded-lg overflow-hidden shadow-2xl border border-[var(--border-color)] aspect-[2/3]">
                        <img src={posterUrl} alt={detail.title} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={handleDirectPlay} className="flex items-center justify-center w-full gap-2 bg-[var(--text-main)] text-[var(--bg-main)] font-bold py-3 rounded hover:opacity-90 transition-opacity group">
                        <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> <span>Play Now</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={toggleLibrary} className={`flex items-center justify-center gap-2 border font-medium py-3 rounded transition-colors ${inLibrary ? 'bg-[rgb(var(--primary-color))]/20 border-[rgb(var(--primary-color))] text-[rgb(var(--primary-color))]' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}>
                            {inLibrary ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />} <span>{inLibrary ? 'Saved' : 'My List'}</span>
                        </button>
                        {trailer && (
                            <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] font-medium py-3 rounded hover:bg-[var(--bg-hover)] transition-colors">
                                <Youtube className="w-5 h-5 text-red-600" /> <span>Trailer</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col min-w-0">
                <div className="lg:hidden flex gap-4 mb-6">
                    <div className="w-28 shrink-0 rounded overflow-hidden shadow-lg border border-[var(--border-color)] aspect-[2/3]">
                        <img src={posterUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                         <h1 className="text-xl font-bold text-[var(--text-main)] leading-tight">{detail.title || detail.name}</h1>
                         <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-[var(--text-main)]">{detail.vote_average.toFixed(1)}</span>
                            <span>•</span>
                            <span>{detail.release_date?.split('-')[0] || 'N/A'}</span>
                         </div>
                         <div className="flex gap-2 mt-2">
                            <button onClick={handleDirectPlay} className="bg-[var(--text-main)] text-[var(--bg-main)] text-xs font-bold py-2 px-4 rounded flex items-center gap-2"><PlayCircle className="w-4 h-4" /> Play</button>
                            <button onClick={toggleLibrary} className={`text-xs font-bold py-2 px-3 rounded flex items-center gap-2 border ${inLibrary ? 'bg-[rgb(var(--primary-color))]/20 border-[rgb(var(--primary-color))] text-[rgb(var(--primary-color))]' : 'border-[var(--border-color)] text-[var(--text-main)]'}`}>{inLibrary ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</button>
                         </div>
                    </div>
                </div>

                <div className="hidden lg:block mb-6">
                    <h1 className="text-4xl font-bold text-[var(--text-main)] mb-3 tracking-tight">{detail.title || detail.name}</h1>
                    <div className="flex items-center gap-4 text-[var(--text-muted)] text-sm">
                        <span className="flex items-center gap-1 text-[var(--text-main)]"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {detail.vote_average.toFixed(1)}</span>
                        <span>{detail.release_date || detail.first_air_date}</span>
                        {detail.runtime && <span>{detail.runtime} min</span>}
                        <div className="flex gap-2">
                            {detail.genres.map(g => <span key={g.id} className="border border-[var(--border-color)] px-2 py-0.5 rounded text-xs">{g.name}</span>)}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-[var(--text-main)] font-bold text-lg mb-2">Overview</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed">{detail.overview}</p>
                </div>

                {detail.credits && detail.credits.cast.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-[var(--text-main)] font-bold text-lg mb-4">Cast</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {detail.credits.cast.slice(0, 10).map(actor => (
                                <div 
                                    key={actor.id} 
                                    className="w-24 shrink-0 text-center cursor-pointer group"
                                    onClick={() => onPersonClick && onPersonClick(actor.id)}
                                >
                                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-2 border-2 border-transparent group-hover:border-[rgb(var(--primary-color))] transition-colors">
                                        <img 
                                            src={actor.profile_path ? `${TMDB_POSTER_BASE}${actor.profile_path}` : 'https://via.placeholder.com/100x100?text=?'} 
                                            className="w-full h-full object-cover"
                                            alt={actor.name}
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--text-main)] font-medium truncate">{actor.name}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] truncate">{actor.character}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showPlayer && (
                    <div ref={playerRef} className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex flex-col gap-4 bg-[var(--bg-card)]/50 p-4 rounded-xl border border-[var(--border-color)] backdrop-blur-md">
                            {/* Server Selector */}
                            {server !== 'direct' && (
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {servers.map((srv) => {
                                        const Icon = srv.icon;
                                        return (
                                            <button
                                                key={srv.id}
                                                onClick={() => setServer(srv.id as ServerType)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${
                                                    server === srv.id 
                                                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] border-[var(--text-main)] transform scale-105 shadow-lg' 
                                                        : 'bg-[var(--bg-card)]/50 text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-main)] hover:text-[var(--text-main)]'
                                                }`}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {srv.label}
                                                {srv.badge && (
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] ml-1 ${
                                                        server === srv.id 
                                                            ? 'bg-[var(--bg-main)] text-[var(--text-main)]' 
                                                            : 'bg-[rgb(var(--primary-color))] text-white'
                                                    }`}>
                                                        {srv.badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative group">
                                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <div className="pointer-events-auto flex items-center gap-2">
                                        <button onClick={openSubtitles} className="flex items-center gap-1 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 backdrop-blur-md transition-colors">
                                            <Captions className="w-4 h-4" /> Subtitles
                                        </button>
                                    </div>
                                    <button onClick={() => { setShowPlayer(false); setDirectUrl(''); }} className="pointer-events-auto bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/10"><X className="w-4 h-4" /></button>
                                </div>
                                
                                {server === 'direct' ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                                        {!videoError ? (
                                            <video controls autoPlay className="w-full h-full outline-none" src={directUrl} onError={() => setVideoError(true)}></video>
                                        ) : (
                                            <div className="text-center p-6">
                                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                                <p className="text-white font-bold mb-2">Playback Failed</p>
                                                <a href={directUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition-colors"><Download className="w-4 h-4" /> Download</a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <iframe src={getEmbedUrl()} className="w-full h-full" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="origin"></iframe>
                                )}
                            </div>
                        </div>
                        {server === 'direct' && !videoError && <div className="mt-3 flex items-start justify-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-card)] p-3 rounded border border-[var(--border-color)]"><Info className="w-4 h-4 shrink-0 text-blue-500" /><p><span className="text-[var(--text-main)] font-bold">Green Screen?</span> The file is downloading to the server. Try a <span className="text-blue-500 font-bold">⚡ CACHED</span> stream.</p></div>}
                    </div>
                )}

                {item.media_type === MediaType.TV && (
                    <div className="mb-8 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4"><Tv className="w-5 h-5 text-[var(--text-muted)]" /><h3 className="font-bold text-[var(--text-main)]">Episodes</h3></div>
                        <div className="flex flex-wrap gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Season</label>
                                <select value={selectedSeason} onChange={(e) => setSelectedSeason(parseInt(e.target.value))} className="block bg-[var(--bg-input)] border border-gray-700 text-[var(--text-main)] rounded px-4 py-2.5 outline-none focus:border-[var(--text-main)] transition-colors min-w-[120px]">
                                    {[...Array(detail.number_of_seasons || 1)].map((_, i) => <option key={i} value={i + 1}>Season {i + 1}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Episode</label>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setSelectedEpisode(Math.max(1, selectedEpisode - 1))} className="p-2.5 rounded bg-[var(--bg-input)] border border-gray-700 hover:bg-[var(--bg-hover)] text-[var(--text-main)] disabled:opacity-50" disabled={selectedEpisode <= 1}><ArrowLeft className="w-5 h-5" /></button>
                                     <div className="bg-[var(--bg-input)] border border-gray-700 text-[var(--text-main)] font-bold rounded px-6 py-2.5 min-w-[60px] text-center">{selectedEpisode}</div>
                                     <button onClick={() => setSelectedEpisode(selectedEpisode + 1)} className="p-2.5 rounded bg-[var(--bg-input)] border border-gray-700 hover:bg-[var(--bg-hover)] text-[var(--text-main)]"><ArrowLeft className="w-5 h-5 rotate-180" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <div 
                        className="flex items-center justify-between mb-4 cursor-pointer select-none" 
                        onClick={() => setStreamsExpanded(!streamsExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                <Film className="w-5 h-5 text-[var(--text-muted)]" /> Torrent Streams
                            </h2>
                            {loadingStreams && <span className="text-xs text-[var(--text-muted)] animate-pulse uppercase font-bold tracking-wider">Searching...</span>}
                        </div>
                        <div className="bg-[var(--bg-card)] p-1.5 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                            {streamsExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                        </div>
                    </div>
                    
                    {streamsExpanded && (
                        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                             {!loadingStreams && streams.length > 0 && (
                                <div className="bg-[var(--bg-hover)] px-4 py-2 border-b border-[var(--border-color)] flex items-center gap-4 text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider"><span>Source</span><span className="flex-1">Filename</span><span>Size</span></div>
                             )}
                             <div className="p-2"><StreamList streams={streams} loading={loadingStreams} onPlay={handleStreamPlay} /></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {collection && collection.parts.length > 0 && (
             <div className="mt-12 border-t border-[var(--border-color)] pt-10">
                <div className="flex items-center gap-3 mb-6">
                    <Layers className="w-6 h-6 text-[rgb(var(--primary-color))]" />
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-main)]">{collection.name}</h2>
                        <p className="text-xs text-[var(--text-muted)]">Part of a franchise</p>
                    </div>
                </div>
                <div className="flex overflow-x-auto space-x-4 pb-4 custom-scrollbar">
                    {collection.parts.map(part => (
                        <MediaCard 
                            key={part.id} 
                            item={{...part, media_type: MediaType.MOVIE}} 
                            onClick={handleRecClick} 
                        />
                    ))}
                </div>
             </div>
        )}

        {recommendations.length > 0 && (
           <div className="mt-12 border-t border-[var(--border-color)] pt-10">
               <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[rgb(var(--primary-color))]" /> You Might Also Like</h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">{recommendations.map(rec => <MediaCard key={rec.id} item={rec} onClick={handleRecClick} />)}</div>
           </div>
        )}
      </div>
      
      <div className="relative z-10 w-full">
        <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
};
