import React, { useState } from 'react';
import { Stream } from '../types';
import { Magnet, Play, HardDrive, Copy, ExternalLink, Check } from 'lucide-react';

interface StreamListProps {
  streams: Stream[];
  loading: boolean;
}

export const StreamList: React.FC<StreamListProps> = ({ streams, loading }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const handleCopy = (stream: Stream, index: number) => {
    if (stream.url) {
      navigator.clipboard.writeText(stream.url);
    } else if (stream.infoHash) {
      const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
      navigator.clipboard.writeText(magnet);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleOpen = (stream: Stream) => {
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
          <div 
            key={idx}
            className="w-full flex items-center justify-between bg-gray-800/40 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors group"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isDirect ? 'bg-blue-900/50 text-blue-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
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
            
            <div className="flex items-center gap-2 pl-2 shrink-0">
                <button 
                    onClick={() => handleCopy(stream, idx)}
                    className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                    title="Copy Link"
                >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                    onClick={() => handleOpen(stream)}
                    className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                    title={isDirect ? "Open URL" : "Open in App"}
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};