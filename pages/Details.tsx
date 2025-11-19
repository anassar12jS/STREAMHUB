import React, { useEffect, useState, useRef } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream, TMDBVideo } from '../types';
import { getDetails, getVideos } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { TMDB_IMAGE_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { ArrowLeft, Star, Calendar, Clock, Layers, Youtube, PlayCircle, Tv, Film, X } from 'lucide-react';
// @ts-ignore
import webtor from '@webtor/embed-sdk-js';

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

  // Initialize Webtor Player when conditions are met
  useEffect(() => {
    if (showPlayer && playerMode === 'webtor' && currentMagnet && detail) {
        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            webtor.push({
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
  }, [showPlayer, playerMode, currentMagnet, detail, selectedSeason, selectedEpisode]);

  if (!detail) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-gray-500">Loading content info...</p>
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
        // Scroll to player
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDirectPlay = () => {
      setPlayerMode('embed');
      setShowPlayer(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 pb-20 animate-fade-in">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img 
           src={detail.backdrop_path ? `${TMDB_IMAGE_BASE}${detail.backdrop_path}` : ''} 
           alt="bg" 
           className="w-full h-full object-cover opacity-20 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6 group bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Browse</span>
        </button>

        {/* Player Overlay */}
        {showPlayer && (
            <div className="mb-8 rounded-2xl overflow-hidden aspect-video bg-black shadow-2xl border border-gray-800 relative animation-fade-in z-50">
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-mono text-white/70 pointer-events-auto border border-white/10">
                        {playerMode === 'webtor' ? '⚡ Torrent Stream (Webtor)' : '🌐 Web Player (HTTP)'}
                    </span>
                    <button 
                        onClick={() => { setShowPlayer(false); setCurrentMagnet(''); }}
                        className="bg-black/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-md pointer-events-auto"
                    >
                        <X className="w-6 h-6" />
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
                        <div className="text-gray-500 animate-pulse">Initializing Secure Stream...</div>
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-12">
          {/* Poster Column */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-gray-800 aspect-[2/3]">
              <img 
                src={detail.poster_path ? `${TMDB_IMAGE_BASE}${detail.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'} 
                alt={detail.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                {!showPlayer && (
                    <button 
                        onClick={handleDirectPlay}
                        className="flex items-center justify-center w-full gap-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-1"
                    >
                        <PlayCircle className="w-6 h-6" /> 
                        <span>Quick Play (Embed)</span>
                    </button>
                )}

                {trailer && (
                <a 
                    href={`https://www.youtube.com/watch?v=${trailer.key}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center w-full gap-3 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-600/50 font-bold py-3 px-4 rounded-xl transition-all"
                >
                    <Youtube className="w-6 h-6" /> 
                    <span>Watch Trailer</span>
                </a>
                )}
            </div>
            
             {/* Metadata badges */}
             <div className="flex flex-wrap gap-2 justify-center">
                {detail.genres.map(g => (
                  <span key={g.id} className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-sm rounded-full text-gray-300 border border-gray-700/50">
                    {g.name}
                  </span>
                ))}
            </div>
          </div>

          {/* Content Column */}
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">{detail.title || detail.name}</h1>
            
            <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm md:text-base text-gray-400 mb-8">
              <span className="flex items-center gap-1.5 text-yellow-400 font-semibold bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20">
                <Star className="w-4 h-4 fill-yellow-400" /> {detail.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {detail.release_date || detail.first_air_date}
              </span>
              {detail.runtime ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {detail.runtime} min
                </span>
              ) : null}
              {detail.number_of_seasons ? (
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> {detail.number_of_seasons} Seasons
                </span>
              ) : null}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
              <p className="text-gray-300 leading-relaxed text-lg font-light opacity-90">
                {detail.overview}
              </p>
            </div>

            {/* Series Control */}
            {item.media_type === MediaType.TV && (
              <div className="mb-10 p-6 bg-gray-900/60 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-2 mb-4 text-white font-semibold text-lg">
                  <Tv className="w-5 h-5 text-purple-500" /> Select Episode
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Season</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 w-24 text-center focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Episode</label>
                     <input 
                      type="number" 
                      min="1" 
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 w-24 text-center focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Streams */}
            <div className="border-t border-gray-800 pt-8 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Film className="w-6 h-6 text-purple-500" />
                  Torrent Streams
                </h2>
                {loadingStreams && (
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium animate-pulse">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Searching networks...
                    </div>
                )}
              </div>
              
              <div className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-lg mb-6 text-sm text-gray-300 flex gap-3 items-start">
                <div className="mt-0.5 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center font-bold">!</div>
                </div>
                 <div>
                    <p className="font-semibold mb-1 text-white">How to watch:</p>
                    <p>Click <span className="text-emerald-400 font-bold">Stream</span> to play directly in the browser using Webtor.</p>
                    <p className="mt-1 text-gray-400">Or use "Quick Play" above for a standard web stream.</p>
                 </div>
              </div>
              
              <StreamList streams={streams} loading={loadingStreams} onPlay={handleStreamPlay} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
