import React from 'react';
import { Stream } from '../types';
import { Download, Magnet, Play, HardDrive, AlertCircle } from 'lucide-react';

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
        <p className="text-sm mt-1 text-gray-500">Try a different source or check your connection.</p>
      </div>
    );
  }

  const handleStreamClick = (stream: Stream) => {
    if (stream.url) {
      // Direct HTTP stream
      window.open(stream.url, '_blank');
    } else if (stream.infoHash) {
      // Magnet link
      const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
      window.location.href = magnet;
    }
  };

  return (
    <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {streams.map((stream, idx) => {
        const titleLines = (stream.title || '').split('\n');
        const nameLines = (stream.name || '').split('\n');
        
        const quality = titleLines[0] || 'Unknown';
        const size = nameLines[1] || '';
        const source = nameLines[0] || 'P2P';
        
        const is4k = quality.includes('4k') || quality.includes('2160p');
        const is1080 = quality.includes('1080p');
        
        const badgeColor = is4k ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                        : is1080 ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                        : 'bg-gray-700 text-gray-300 border-gray-600';

        const isDirect = !!stream.url;

        return (
          <button 
            key={idx}
            onClick={() => handleStreamClick(stream)}
            className="w-full text-left flex items-center justify-between bg-gray-800/40 hover:bg-gray-700/60 p-3 rounded-lg cursor-pointer transition-all group border border-gray-700/50 hover:border-gray-600 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 z-10">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${isDirect ? 'bg-blue-900/50 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-emerald-900/50 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                {isDirect ? <Play className="w-5 h-5 ml-0.5" /> : <Magnet className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200 truncate">{source}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeColor} font-bold whitespace-nowrap`}>{quality}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-mono flex items-center gap-2">
                   <span className="whitespace-nowrap">{size}</span>
                   {size && <span className="w-1 h-1 bg-gray-600 rounded-full"></span>}
                   <span className="truncate">{titleLines.slice(1).join(' ')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 z-10 pl-4 shrink-0">
               {isDirect ? (
                 <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider hidden sm:block">Play Now</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider hidden sm:block">Magnet</span>
                 </div>
               )}
            </div>
            
            {/* Hover Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />
          </button>
        );
      })}
    </div>
  );
};