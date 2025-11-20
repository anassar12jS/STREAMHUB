
import React, { useState, useEffect } from 'react';
import { IPTVChannel } from '../types';
import { Tv2, Play, Search, Plus, AlertCircle, Upload, Globe, Layers } from 'lucide-react';
import Hls from 'hls.js';

export const LiveTV: React.FC = () => {
  const [playlistUrl, setPlaylistUrl] = useState('https://iptv-org.github.io/iptv/index.m3u');
  const [playlistSource, setPlaylistSource] = useState<'global' | 'country' | 'category'>('global');
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<IPTVChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<IPTVChannel | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylist(playlistUrl);
  }, []);

  const handleSourceChange = (source: 'global' | 'country' | 'category') => {
      setPlaylistSource(source);
      let url = 'https://iptv-org.github.io/iptv/index.m3u';
      if (source === 'country') url = 'https://iptv-org.github.io/iptv/index.country.m3u';
      if (source === 'category') url = 'https://iptv-org.github.io/iptv/index.category.m3u';
      setPlaylistUrl(url);
      fetchPlaylist(url);
      setActiveChannel(null);
      setSearch('');
  };

  const parseM3U = (content: string): IPTVChannel[] => {
    const lines = content.split('\n');
    const result: IPTVChannel[] = [];
    let currentChannel: Partial<IPTVChannel> = {};

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            // Extract metadata
            const info = line.substring(8);
            const parts = info.split(',');
            const name = parts[parts.length - 1];
            
            // Extract Logo
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const logo = logoMatch ? logoMatch[1] : undefined;
            
            // Extract Group
            const groupMatch = line.match(/group-title="([^"]*)"/);
            const group = groupMatch ? groupMatch[1] : 'Uncategorized';

            currentChannel = { name, logo, group };
        } else if (line.length > 0 && !line.startsWith('#')) {
            if (currentChannel.name) {
                result.push({ ...currentChannel, url: line } as IPTVChannel);
                currentChannel = {};
            }
        }
    });
    return result;
  };

  const fetchPlaylist = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch playlist');
        const text = await res.text();
        const parsed = parseM3U(text);
        
        if (parsed.length === 0) throw new Error('No channels found in playlist');
        
        setChannels(parsed);
        setFilteredChannels(parsed);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim() === '') {
        setFilteredChannels(channels);
    } else {
        setFilteredChannels(channels.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) || 
            (c.group && c.group.toLowerCase().includes(search.toLowerCase()))
        ));
    }
  }, [search, channels]);

  // HLS Player Logic
  useEffect(() => {
    const video = document.getElementById('tv-player') as HTMLVideoElement;
    if (!video || !activeChannel) return;

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(activeChannel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
        return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeChannel.url;
        video.play();
    }
  }, [activeChannel]);

  const handleImport = () => {
      const url = prompt("Enter M3U Playlist URL:");
      if (url) {
          setPlaylistUrl(url);
          fetchPlaylist(url);
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen animate-fade-in flex flex-col h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-3">
                <Tv2 className="w-8 h-8 text-green-500" />
                <h1 className="text-3xl font-bold text-[var(--text-main)]">Live TV</h1>
            </div>
            
            <div className="flex gap-2">
                 <div className="flex bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border-color)]">
                    <button 
                        onClick={() => handleSourceChange('global')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${playlistSource === 'global' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        <Globe className="w-3 h-3" /> All
                    </button>
                    <button 
                        onClick={() => handleSourceChange('category')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${playlistSource === 'category' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        <Layers className="w-3 h-3" /> Category
                    </button>
                    <button 
                        onClick={() => handleSourceChange('country')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${playlistSource === 'country' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        <Globe className="w-3 h-3" /> Country
                    </button>
                 </div>
                 <button onClick={handleImport} className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 h-full">
                    <Upload className="w-3 h-3" /> Import
                 </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-6">
            {/* Player Section (Left/Top) */}
            <div className="lg:w-2/3 flex flex-col gap-4">
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-[var(--border-color)] relative">
                    {activeChannel ? (
                        <video id="tv-player" controls className="w-full h-full" autoPlay></video>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
                            <Tv2 className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a channel to start watching</p>
                        </div>
                    )}
                </div>
                {activeChannel && (
                    <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)]">
                        <h2 className="text-xl font-bold text-[var(--text-main)]">{activeChannel.name}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{activeChannel.group}</p>
                    </div>
                )}
            </div>

            {/* Channel List (Right/Bottom) */}
            <div className="lg:w-1/3 flex flex-col bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)]">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search channels..." 
                            className="w-full bg-[var(--bg-input)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-main)] focus:outline-none border border-[var(--border-color)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-2">
                             <div className="w-6 h-6 border-2 border-[rgb(var(--primary-color))] border-t-transparent rounded-full animate-spin"></div>
                             Loading Playlist...
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 flex flex-col items-center">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            {error}
                        </div>
                    ) : filteredChannels.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-muted)]">No channels found</div>
                    ) : (
                        <div className="divide-y divide-[var(--border-color)]">
                            {filteredChannels.map((channel, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveChannel(channel)}
                                    className={`w-full text-left p-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-colors ${activeChannel?.url === channel.url ? 'bg-[rgb(var(--primary-color))]/10 border-l-4 border-[rgb(var(--primary-color))]' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt="" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        ) : (
                                            <Tv2 className="w-5 h-5 text-[var(--text-muted)]" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${activeChannel?.url === channel.url ? 'text-[rgb(var(--primary-color))]' : 'text-[var(--text-main)]'}`}>
                                            {channel.name}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] truncate">{channel.group}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-2 border-t border-[var(--border-color)] text-xs text-center text-[var(--text-muted)]">
                    {filteredChannels.length} Channels
                </div>
            </div>
        </div>
    </div>
  );
};
