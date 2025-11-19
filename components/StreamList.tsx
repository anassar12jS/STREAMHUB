import React from 'react';
import { Stream } from '../types';
import { Download, Magnet, Play } from 'lucide-react';

interface StreamListProps {
  streams: Stream[];
  loading: boolean;
}

export const StreamList: React.FC<StreamListProps> = ({ streams, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 mt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-800 rounded-lg w-full"></div>
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="p-6 bg-gray-800/50 rounded-lg text-center text-gray-400 mt-4 border border-gray-700 border-dashed">
        <p>No streams found via Torrentio.</p>
        <p className="text-xs mt-2 text-gray-500">Ensure the content is released and popular enough to have public trackers.</p>
      </div>
    );
  }

  const handleStreamClick = (stream: Stream) => {
    if (stream.url) {
      window.open(stream.url, '_blank');
    } else if (stream.infoHash) {
      // Construct magnet link
      // This is a simplified magnet construction. 
      // Ideally, we need trackers, but just infoHash works for many clients.
      const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
      window.location.href = magnet;
    }
  };

  return (
    <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {streams.map((stream, idx) => {
        // Parse title for quality/seeds info which is usually in the 'title' or 'name' field of Torrentio
        // Torrentio format: title: "1080p\nBluRay\nSeeds: 50" name: "Torrentio\n1.5 GB"
        const titleLines = (stream.title || '').split('\n');
        const nameLines = (stream.name || '').split('\n');
        
        const quality = titleLines[0] || 'Unknown';
        const size = nameLines[1] || '';
        const source = nameLines[0] || 'P2P';

        return (
          <div 
            key={idx}
            onClick={() => handleStreamClick(stream)}
            className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-3 rounded-lg cursor-pointer transition-colors group border border-gray-700/50 hover:border-purple-500/50"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-purple-400 group-hover:text-white group-hover:bg-purple-600 transition-colors">
                {stream.url ? <Play className="w-5 h-5 ml-0.5" /> : <Magnet className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200">{source}</span>
                  <span className="text-xs bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded">{quality}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 font-mono">
                   {size} • {titleLines.join(' ')}
                </div>
              </div>
            </div>
            <div className="text-gray-500 group-hover:text-white">
              {stream.url ? <Download className="w-5 h-5" /> : <Magnet className="w-5 h-5" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
