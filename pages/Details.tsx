import React, { useEffect, useState } from 'react';
import { TMDBResult, TMDBDetail, MediaType, Stream } from '../types';
import { getDetails } from '../services/tmdb';
import { getStreams, getEpisodeStreams } from '../services/addonService';
import { getAiInsight } from '../services/geminiService';
import { TMDB_IMAGE_BASE } from '../constants';
import { StreamList } from '../components/StreamList';
import { ArrowLeft, Star, Calendar, Clock, Sparkles, Layers } from 'lucide-react';

interface DetailsProps {
  item: TMDBResult;
  onBack: () => void;
}

export const Details: React.FC<DetailsProps> = ({ item, onBack }) => {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
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
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
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
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Browse
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          {/* Poster Column */}
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden shadow-2xl shadow-purple-900/20 border border-gray-800">
              <img 
                src={`${TMDB_IMAGE_BASE}${detail.poster_path}`} 
                alt={detail.title} 
                className="w-full h-auto"
              />
            </div>
            
            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 justify-center">
                {detail.genres.map(g => (
                  <span key={g.id} className="px-2 py-1 bg-gray-800 text-xs rounded text-gray-300 border border-gray-700">
                    {g.name}
                  </span>
                ))}
            </div>
          </div>

          {/* Content Column */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{detail.title || detail.name}</h1>
            
            <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
              <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                <Star className="w-4 h-4 fill-yellow-500" /> {detail.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {detail.release_date || detail.first_air_date}
              </span>
              {detail.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {detail.runtime} min
                </span>
              )}
            </div>

            {/* AI Insight Section */}
            {aiInsight && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 font-bold mb-2 text-sm">
                  <Sparkles className="w-4 h-4" /> 
                  Gemini Insight
                </div>
                <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                  {aiInsight}
                </div>
              </div>
            )}

            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              {detail.overview}
            </p>

            {/* Series Control */}
            {item.media_type === MediaType.TV && (
              <div className="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-4 text-white font-semibold">
                  <Layers className="w-5 h-5" /> Episode Selector
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Season</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value) || 1)}
                      className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-20 text-center focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Episode</label>
                     <input 
                      type="number" 
                      min="1" 
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(parseInt(e.target.value) || 1)}
                      className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-20 text-center focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Streams */}
            <div className="border-t border-gray-800 pt-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-8 bg-purple-600 rounded-full block"></span>
                Available Streams
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                 Powered by Torrentio. Click a stream to open magnet link or play.
                 <br/>
                 <span className="text-xs italic text-red-400">Note: Browser cannot play magnet links directly. It will open your torrent client.</span>
              </p>
              
              <StreamList streams={streams} loading={loadingStreams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
