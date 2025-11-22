
import React, { useState, useEffect } from 'react';
import { SportsMatch, SportsMatchSource } from '../types';
import { getStreamUrl } from '../services/sports';
import { ArrowLeft, PlayCircle, AlertCircle, Loader2, Radio, Zap, ShieldCheck, MonitorPlay } from 'lucide-react';

interface SportsPlayerProps {
  match: SportsMatch;
  onBack: () => void;
}

export const SportsPlayer: React.FC<SportsPlayerProps> = ({ match, onBack }) => {
  const [activeSource, setActiveSource] = useState<SportsMatchSource | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with the first source
  useEffect(() => {
    if (match.sources.length > 0) {
      handleSourceChange(match.sources[0]);
    }
  }, [match]);

  const handleSourceChange = async (source: SportsMatchSource) => {
    setActiveSource(source);
    setLoading(true);
    setError(null);
    setStreamUrl(null);

    try {
      const url = await getStreamUrl(source.source, source.id);
      if (url) {
        setStreamUrl(url);
      } else {
        setError('Stream source unavailable. Please try a different server.');
      }
    } catch (e) {
      setError('Failed to connect to stream provider.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-4 z-20">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[var(--text-main)] truncate">{match.title}</h1>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="text-[rgb(var(--primary-color))] font-bold uppercase">{match.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-red-500 font-bold animate-pulse">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> LIVE
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Player Container */}
        <div className="flex-1 bg-black flex flex-col relative">
            <div className="relative w-full h-full flex items-center justify-center">
                {streamUrl ? (
                    <iframe 
                        src={streamUrl} 
                        className="w-full h-full absolute inset-0" 
                        frameBorder="0" 
                        allowFullScreen 
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="origin"
                    ></iframe>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        {loading ? (
                            <>
                                <Loader2 className="w-12 h-12 text-[rgb(var(--primary-color))] animate-spin mb-4" />
                                <p className="text-[var(--text-muted)] font-mono animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
                            </>
                        ) : error ? (
                            <>
                                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                                <p className="text-white font-bold mb-2">Connection Failed</p>
                                <p className="text-[var(--text-muted)] text-sm">{error}</p>
                            </>
                        ) : (
                            <MonitorPlay className="w-16 h-16 text-[var(--text-muted)] opacity-20" />
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar / Bottom Bar for Sources */}
        <div className="bg-[var(--bg-card)] border-l border-[var(--border-color)] w-full lg:w-80 flex flex-col shrink-0 lg:h-full max-h-[40vh] lg:max-h-none overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50">
                <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[rgb(var(--primary-color))]" /> 
                    Select Source
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    If a stream lags or fails, try a different source.
                </p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {match.sources.map((s, i) => {
                    const isActive = activeSource?.id === s.id && activeSource?.source === s.source;
                    return (
                        <button
                            key={i}
                            onClick={() => handleSourceChange(s)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${
                                isActive 
                                ? 'bg-[rgb(var(--primary-color))]/10 border-[rgb(var(--primary-color))]' 
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[rgb(var(--primary-color))] text-white' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
                                    {isActive ? <Zap className="w-4 h-4" /> : <span className="text-xs font-mono">{i + 1}</span>}
                                </div>
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-[rgb(var(--primary-color))]' : 'text-[var(--text-main)]'}`}>
                                        {s.source}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Secure Stream
                                    </p>
                                </div>
                            </div>
                            {isActive && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[rgb(var(--primary-color))] animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-[rgb(var(--primary-color))] rounded-full"></div>
                                    PLAYING
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            
            <div className="p-4 border-t border-[var(--border-color)] text-center">
                 <p className="text-[10px] text-[var(--text-muted)]">
                    StreamHub does not host any content. All streams are provided by third-party networks.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};
