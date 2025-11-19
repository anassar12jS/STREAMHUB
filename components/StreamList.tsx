import React, { useState } from 'react';
import { Stream } from '../types';
import { Magnet, Play, HardDrive, Copy, ExternalLink, Check, PlayCircle } from 'lucide-react';

interface StreamListProps {
  streams: Stream[];
  loading: boolean;
  onPlay: (stream: Stream) => void;
}

export const StreamList: React.FC<StreamListProps> = ({ streams, loading, onPlay }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-lg w-full"></div>
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
            <HardDrive className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-300">No streams available</h3>
        <p className="text-sm text-gray-500 max-w-xs mt-2">
            This content might not have any active torrents found by the addons.
        </p>
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
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {streams.map((stream, idx) => {
        const titleLines = (stream.title || '').split('\n');
        const nameLines = (stream.name || '').split('\n');
        
        const quality = titleLines[0] || 'Unknown';
        const size = nameLines[1] || '';
        const source = nameLines[0] || 'P2P';
        
        const is4k = quality.toLowerCase().includes('4k') || quality.includes('2160p');
        const is1080 = quality.includes('1080p');
        const is720 = quality.includes('720p');
        
        const badgeClass = is4k ? 'bg-yellow-500 text-black border-yellow-600' 
                        : is1080 ? 'bg-purple-500 text-white border-purple-600' 
                        : is720 ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-gray-700 text-gray-300 border-gray-600';

        const isDirect = !!stream.url;

        return (
          <div 
            key={idx}
            className="group relative w-full flex items-center justify-between bg-[#111] hover:bg-[#161616] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all"
          >
            {/* Left Section: Icon & Info */}
            <div className="flex items-center gap-4 overflow-hidden flex-1 mr-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${isDirect ? 'bg-blue-900/20 text-blue-400' : 'bg-emerald-900/20 text-emerald-400'}`}>
                {isDirect ? <Play className="w-5 h-5 ml-0.5" /> : <Magnet className="w-5 h-5" />}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-black tracking-tight border ${badgeClass}`}>
                       {quality.replace('4k', '4K').replace('p', 'P')}
                   </span>
                   <span className="text-gray-400 text-xs truncate font-medium">{source}</span>
                   {size && <span className="text-gray-600 text-[10px] px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">{size}</span>}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate opacity-70 group-hover:opacity-100 transition-opacity">
                   {titleLines.slice(1).join(' ')}
                </div>
              </div>
            </div>
            
            {/* Right Section: Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {!isDirect && (
                  <button
                    onClick={() => onPlay(stream)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition-all shadow-lg shadow-emerald-900/20 font-bold text-xs tracking-wide"
                    title="Stream in Browser"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PLAY</span>
                  </button>
                )}

                <div className="flex bg-black/20 rounded-md p-0.5 border border-white/5">
                    <button 
                        onClick={() => handleCopy(stream, idx)}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors relative"
                        title="Copy Link"
                    >
                        {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="w-px bg-white/10 my-1"></div>
                    <button 
                        onClick={() => handleOpen(stream)}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        title={isDirect ? "Open URL" : "Open in External App"}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};