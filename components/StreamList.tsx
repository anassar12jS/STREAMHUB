import React, { useMemo, useState } from 'react';
import { Stream } from '../types';
import { Magnet, Play, HardDrive, Copy, Check, PlayCircle, Download, Users, Zap } from 'lucide-react';

interface StreamListProps {
  streams: Stream[];
  loading: boolean;
  onPlay: (stream: Stream) => void;
}

export const StreamList: React.FC<StreamListProps> = ({ streams, loading, onPlay }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Sorting and Parsing Logic
  const sortedStreams = useMemo(() => {
    return [...streams].sort((a, b) => {
      const getText = (s: Stream) => (s.title || '') + (s.name || '');
      const textA = getText(a).toLowerCase();
      const textB = getText(b).toLowerCase();

      // Quality Score
      const getQualityScore = (str: string) => {
        if (str.includes('2160p') || str.includes('4k') || str.includes('uhd')) return 4;
        if (str.includes('1080p')) return 3;
        if (str.includes('720p')) return 2;
        if (str.includes('480p')) return 1;
        return 0;
      };

      const qualA = getQualityScore(textA);
      const qualB = getQualityScore(textB);

      // Sort Direct (Debrid) links first
      if (!!a.url !== !!b.url) return !!a.url ? -1 : 1;

      if (qualA !== qualB) return qualB - qualA; // Higher quality first

      // Seeds Score (parsing "👤 123" or similar)
      const getSeeds = (str: string) => {
        const match = str.match(/👤\s*(\d+)/) || str.match(/seeders:\s*(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };

      const seedsA = getSeeds(a.title || '');
      const seedsB = getSeeds(b.title || '');

      return seedsB - seedsA; // More seeds first
    });
  }, [streams]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-white/5 rounded-md w-full"></div>
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center bg-white/5 rounded-xl border border-white/5">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500">
            <HardDrive className="w-6 h-6" />
        </div>
        <h3 className="text-base font-medium text-gray-300">No streams found</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-2">
            Try checking your internet connection or selecting a different title.
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

  const handleDownload = (stream: Stream) => {
    if (stream.url) {
      window.open(stream.url, '_blank');
    } else if (stream.infoHash) {
      const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
      window.location.href = magnet;
    }
  };

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
      {sortedStreams.map((stream, idx) => {
        const titleLines = (stream.title || '').split('\n');
        const nameLines = (stream.name || '').split('\n');
        
        // Parsing Metadata
        const fullText = (stream.title || '') + ' ' + (stream.name || '');
        const qualityMatch = fullText.match(/(2160p|4k|1080p|720p|480p)/i);
        const quality = qualityMatch ? qualityMatch[0].toUpperCase() : 'UNK';
        
        const sizeMatch = fullText.match(/(\d+(\.\d+)?\s?(GB|MB))/i);
        const size = sizeMatch ? sizeMatch[0] : '';

        const seedsMatch = fullText.match(/👤\s*(\d+)/);
        const seeds = seedsMatch ? seedsMatch[1] : null;
        
        const source = nameLines[0] || 'P2P';
        const isDirect = !!stream.url;

        return (
          <div 
            key={idx}
            className="group flex items-center justify-between bg-[#0a0a0a] hover:bg-[#161616] p-2.5 rounded-md border border-white/5 transition-colors"
          >
            {/* Left: Icon & Details */}
            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
              <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isDirect ? 'text-blue-400 bg-blue-900/10' : 'text-gray-400 bg-white/5'}`}>
                {isDirect ? <Zap className="w-4 h-4 fill-blue-400" /> : <Magnet className="w-4 h-4" />}
              </div>
              
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-200 font-medium leading-tight">
                   <span>{quality}</span>
                   {isDirect && <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">CACHED</span>}
                   {size && <span className="text-xs text-gray-500 font-normal">• {size}</span>}
                   {!isDirect && seeds && (
                     <span className="text-xs text-emerald-500 font-normal flex items-center gap-0.5">
                       <Users className="w-3 h-3" /> {seeds}
                     </span>
                   )}
                </div>
                <div className="text-[11px] text-gray-500 font-mono truncate">
                   {source} • {titleLines.slice(0, 1).join(' ')}
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onPlay(stream)}
                  className={`flex items-center gap-1.5 ${isDirect ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white hover:bg-gray-200 text-black'} px-3 py-1.5 rounded text-xs font-bold transition-colors`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Play</span>
                </button>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => handleCopy(stream, idx)}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        title="Copy Magnet Link"
                    >
                        {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    
                    <button 
                        onClick={() => handleDownload(stream)}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        title="Download Torrent"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};