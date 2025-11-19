import React from 'react';
import { Stream } from '../types';
import { Download, Magnet, Play, HardDrive } from 'lucide-react';

interface StreamListProps {
  streams: Stream[];
  loading: boolean;
}

export const StreamList: React.FC<StreamListProps> = ({ streams, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 mt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-800 rounded-lg w-full border border-gray-700/50"></div>
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="p-8 bg-gray-800/30 rounded-lg text-center text-gray-400 mt-4 border border-gray-700 border-dashed">
        <div className="flex justify-center mb-3 opacity-50">
          <HardDrive className="w-10 h-10" />
        </div>
        <p className="text-lg font-medium text-gray-300">No streams found</p>
        <p className="text-sm mt-1 text-gray-500">Try a different movie or check your connection.</p>
      </div>
    );
  }

  const handleStreamClick = (stream: Stream) => {
    if (stream.url) {
      window.open(stream.url, '_blank');
    } else if (stream.infoHash) {
      const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
      window.location.href = magnet;
    }
  };

  return (
    <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {streams.map((stream, idx) => {
        // Parse title for quality/seeds info which is usually in the 'title' or 'name' field of Torrentio
        const titleLines = (stream.title || '').split('\n');
        const nameLines = (stream.name || '').split('\n');
        
        const quality = titleLines[0] || 'Unknown';
        const size = nameLines[1] || '';
        const source = nameLines[0] || 'P2P';
        
        // Heuristic to detect resolution for color coding
        const is4k = quality.includes('4k') || quality.includes('2160p');
        const is1080 = quality.includes('1080p');
        
        const badgeColor = is4k ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                        : is1080 ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                        : 'bg-gray-700 text-gray-300 border-gray-600';

        return (
          <div 
            key={idx}
            onClick={() => handleStreamClick(stream)}
            className="flex items-center justify-between bg-gray-800/40 hover:bg-gray-700/60 p-3 rounded-lg cursor-pointer transition-all group border border-gray-700/50 hover:border-gray-600"
          >
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${stream.url ? 'bg-blue-900/50 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-red-900/50 text-red-400 group-hover:bg-red-600 group-hover:text-white'}`}>
                {stream.url ? <Play className="w-5 h-5 ml-0.5" /> : <Magnet className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200">{source}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${badgeColor} font-bold`}>{quality}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-mono flex items-center gap-2">
                   <span>{size}</span>
                   <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                   <span className="truncate max-w-[200px] md:max-w-[300px]">{titleLines.slice(1).join(' ')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               {stream.url ? (
                 <span className="text-xs font-medium text-blue-400 uppercase tracking-wider hidden md:block">Play URL</span>
               ) : (
                 <span className="text-xs font-medium text-red-400 uppercase tracking-wider hidden md:block">Magnet</span>
               )}
               <div className="text-gray-500 group-hover:text-white transition-colors">
                 {stream.url ? <Download className="w-5 h-5" /> : <Magnet className="w-5 h-5" />}
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};