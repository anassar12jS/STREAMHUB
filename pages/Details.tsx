import React, { useEffect, useState } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream, TMDBVideo } from '../types';
import { getDetails, getVideos } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { getAiInsight } from '../services/geminiService';
import { TMDB_IMAGE_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { ArrowLeft, Star, Calendar, Clock, Sparkles, Layers, Youtube, PlayCircle } from 'lucide-react';

interface DetailsProps {
  item: TMDBResult;
  onBack: () => void;
}

export const Details: React.FC<DetailsProps> = ({ item, onBack }) => {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

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

        // Fetch AI Insight
        if (d.overview) {
            const insight = await getAiInsight(d.title || d.name || '', d.overview);
            setAiInsight(insight);
        }

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

  if (!detail) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-gray-500">Loading content info...</p>
      </div>
    );
  }

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
            
            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 justify-center">
                {detail.genres.map(g => (
                  <span key={g.id} className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-sm rounded-full text-gray-300 border border-gray-700/50">
                    {g.name}
                  </span>
                ))}
            </div>

            {trailer && (
              <a 
                href={`https://www.youtube.com/watch?v=${trailer.key}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center w-full gap-3 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transform hover:-translate-y-1"
              >
                <Youtube className="w-6 h-6" /> 
                <span>Watch Trailer</span>
              </a>
            )}
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

            {/* AI Insight Section */}
            {aiInsight && (
              <div className="mb-8 p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/10 rounded-2xl border border-purple-500/20 backdrop-blur-sm shadow-lg">
                <div className="flex items-center gap-2 text-purple-300 font-bold mb-3 text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> 
                  Gemini AI Insight
                </div>
                <div className="text-gray-200 text-base leading-relaxed font-light whitespace-pre-line">
                  {aiInsight}
                </div>
              </div>
            )}

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
                  <PlayCircle className="w-5 h-5 text-purple-500" /> Select Episode
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
                  <span className="w-1.5 h-8 bg-purple-600 rounded-full block shadow-[0_0_15px_rgba(147,51,234,0.6)]"></span>
                  Available Streams
                </h2>
                {loadingStreams && (
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium animate-pulse">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Searching networks...
                    </div>
                )}
              </div>
              
              <div className="bg-blue-900/10 border border-blue-800/30 p-4 rounded-lg mb-6 text-sm text-blue-200 flex gap-3 items-start">
                <div className="mt-0.5 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">i</div>
                </div>
                 <div>
                    <p className="font-semibold mb-1">How to watch:</p>
                    <ul className="space-y-1.5 text-blue-300/80">
                      <li className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                         <span><strong>Play Button:</strong> Direct stream. May work in-browser or require a player extension.</span>
                      </li>
                      <li className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                         <span><strong>Magnet Button:</strong> Opens external Torrent Client (uTorrent, qBittorrent).</span>
                      </li>
                    </ul>
                 </div>
              </div>
              
              <StreamList streams={streams} loading={loadingStreams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};