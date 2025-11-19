import React, { useEffect, useState } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream, TMDBVideo } from '../types';
import { getDetails, getVideos } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { getAiInsight } from '../services/geminiService';
import { TMDB_IMAGE_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { ArrowLeft, Star, Calendar, Clock, Sparkles, Layers, Youtube } from 'lucide-react';

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
      const d = await getDetails(item.id, item.media_type);
      setDetail(d);
      
      // Fetch Videos
      const videos = await getVideos(item.id, item.media_type);
      const officialTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
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
      } else if (item.media_type === MediaType.MOVIE && !d.external_ids?.imdb_id) {
        // Handle case where no IMDB ID exists
        console.warn("No IMDB ID found for movie");
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

  if (!detail) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 pb-20">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img 
           src={`${TMDB_IMAGE_BASE}${detail.backdrop_path}`} 
           alt="bg" 
           className="w-full h-full object-cover opacity-20 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <div className="p-2 rounded-full group-hover:bg-gray-800 transition-colors mr-2">
             <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-12">
          {/* Poster Column */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-gray-800">
              <img 
                src={`${TMDB_IMAGE_BASE}${detail.poster_path}`} 
                alt={detail.title} 
                className="w-full h-auto"
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
                className="flex items-center justify-center w-full gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                <Youtube className="w-5 h-5" /> Watch Trailer
              </a>
            )}
          </div>

          {/* Content Column */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{detail.title || detail.name}</h1>
            
            <div className="flex items-center gap-6 text-sm md:text-base text-gray-400 mb-8">
              <span className="flex items-center gap-1.5 text-yellow-400 font-semibold bg-yellow-400/10 px-2 py-1 rounded">
                <Star className="w-4 h-4 fill-yellow-400" /> {detail.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {detail.release_date || detail.first_air_date}
              </span>
              {detail.runtime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {detail.runtime} min
                </span>
              )}
            </div>

            {/* AI Insight Section */}
            {aiInsight && (
              <div className="mb-8 p-5 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-purple-400 font-bold mb-3 text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> 
                  Gemini AI Insight
                </div>
                <div className="text-gray-200 text-sm md:text-base whitespace-pre-line leading-relaxed font-light">
                  {aiInsight}
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
            <p className="text-gray-300 leading-relaxed mb-10 text-lg font-light">
              {detail.overview}
            </p>

            {/* Series Control */}
            {item.media_type === MediaType.TV && (
              <div className="mb-10 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 mb-4 text-white font-semibold text-lg">
                  <Layers className="w-5 h-5 text-purple-500" /> Select Episode
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Season</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 w-24 text-center focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Episode</label>
                     <input 
                      type="number" 
                      min="1" 
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 w-24 text-center focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Streams */}
            <div className="border-t border-gray-800 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-purple-600 rounded-full block shadow-[0_0_10px_rgba(147,51,234,0.5)]"></span>
                  Available Streams
                </h2>
                {loadingStreams && <div className="text-sm text-purple-400 animate-pulse">Searching networks...</div>}
              </div>
              
              <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mb-4 text-sm text-blue-200 flex gap-3 items-start">
                <div className="mt-0.5">ℹ️</div>
                 <div>
                    <p className="font-semibold">How to watch:</p>
                    <ul className="list-disc ml-4 mt-1 text-blue-300/80 space-y-1">
                      <li><strong>Play Button:</strong> Tries to open direct stream (HTTP). Might work in browser or require a video player extension.</li>
                      <li><strong>Magnet Button:</strong> Opens your local Torrent Client (uTorrent, qBittorrent, etc).</li>
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