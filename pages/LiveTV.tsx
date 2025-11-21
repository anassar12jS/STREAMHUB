import React, { useState, useEffect, useRef } from 'react';
import { IPTVChannel } from '../types';
import { Tv2, Search, AlertCircle, Upload, Globe, Layers, Film, Filter } from 'lucide-react';
import Hls from 'hls.js';

// Custom Virtual List implementation to replace react-window due to type errors
interface ListChildComponentProps {
  index: number;
  style: React.CSSProperties;
}

const List: React.FC<{
  height: number;
  width: number;
  itemCount: number;
  itemSize: number;
  className?: string;
  children: React.ComponentType<ListChildComponentProps>;
}> = ({ height, width, itemCount, itemSize, className, children: Row }) => {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = itemCount * itemSize;
  const overscan = 5;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + height) / itemSize) + overscan
  );

  const items = [];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push(
      <Row
        key={i}
        index={i}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${itemSize}px`,
          transform: `translateY(${i * itemSize}px)`,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ height, width, overflowY: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {items}
      </div>
    </div>
  );
};

// Custom hook for debouncing input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const LiveTV: React.FC = () => {
  const [playlistUrl, setPlaylistUrl] = useState('https://iptv-org.github.io/iptv/index.m3u');
  const [playlistSource, setPlaylistSource] = useState<'global' | 'country' | 'category'>('global');
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<IPTVChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<IPTVChannel | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  
  const debouncedSearch = useDebounce(search, 300);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetchPlaylist(playlistUrl);
  }, []);

  useEffect(() => {
    if (!listContainerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setListDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    resizeObserver.observe(listContainerRef.current);
    return () => resizeObserver.disconnect();
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
      setSelectedGroup('All');
  };

  const parseM3U = (content: string): { channels: IPTVChannel[], groups: string[] } => {
    const lines = content.split('\n');
    const channelsResult: IPTVChannel[] = [];
    const groupsResult = new Set<string>();
    let currentChannel: Partial<IPTVChannel> = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#EXTINF:')) {
            const info = trimmed.substring(8);
            const name = info.split(',').pop() || '';
            const logo = trimmed.match(/tvg-logo="([^"]*)"/)?.[1];
            const group = trimmed.match(/group-title="([^"]*)"/)?.[1] || 'Uncategorized';
            currentChannel = { name, logo, group };
            if (group) groupsResult.add(group);
        } else if (trimmed.length > 0 && !trimmed.startsWith('#')) {
            if (currentChannel.name) {
                channelsResult.push({ ...currentChannel, url: trimmed } as IPTVChannel);
                currentChannel = {};
            }
        }
    }
    return { channels: channelsResult, groups: Array.from(groupsResult).sort() };
  };

  const fetchPlaylist = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch playlist');
        const text = await res.text();
        const { channels: parsedChannels, groups: parsedGroups } = parseM3U(text);
        
        if (parsedChannels.length === 0) throw new Error('No channels found');
        
        setChannels(parsedChannels);
        setGroups(['All', ...parsedGroups]);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    let tempChannels = channels;
    if (selectedGroup !== 'All') {
        tempChannels = tempChannels.filter(c => c.group === selectedGroup);
    }
    if (debouncedSearch.trim() !== '') {
        const lowerCaseSearch = debouncedSearch.toLowerCase();
        tempChannels = tempChannels.filter(c => 
            c.name.toLowerCase().includes(lowerCaseSearch) || 
            (c.group && c.group.toLowerCase().includes(lowerCaseSearch))
        );
    }
    setFilteredChannels(tempChannels);
  }, [debouncedSearch, channels, selectedGroup]);

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

  const ChannelRow: React.FC<ListChildComponentProps> = ({ index, style }) => {
    const channel = filteredChannels[index];
    if (!channel) return null; // Safety check
    return (
      <div style={style}>
        <button
            onClick={() => setActiveChannel(channel)}
            className={`w-full text-left p-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-all h-full duration-200 ${activeChannel?.url === channel.url ? 'bg-[rgb(var(--primary-color))]/10' : ''}`}
        >
            <div className={`w-1 absolute left-0 top-0 bottom-0 transition-all duration-300 ${activeChannel?.url === channel.url ? 'bg-[rgb(var(--primary-color))]' : 'bg-transparent'}`}></div>
            <div className="w-12 h-12 bg-white/5 rounded-md flex items-center justify-center shrink-0 overflow-hidden ml-2">
                {channel.logo ? ( 
                    <img 
                        src={channel.logo} 
                        alt="" 
                        className="w-full h-full object-contain" 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.classList.add('flex', 'items-center', 'justify-center');
                                parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--text-muted)]"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 15h4M14 15h2M7 11h2M13 11h4M7 7h4M15 7h2"/></svg>`;
                            }
                        }} 
                    />
                ) : ( 
                    <Tv2 className="w-5 h-5 text-[var(--text-muted)]" /> 
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${activeChannel?.url === channel.url ? 'text-[rgb(var(--primary-color))]' : 'text-[var(--text-main)]'}`}>{channel.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{channel.group}</p>
            </div>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen animate-fade-in flex flex-col h-screen relative overflow-hidden">
        {activeChannel?.logo && <img src={activeChannel.logo} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125 transition-all duration-500" />}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-main)]/80 to-[var(--bg-main)] backdrop-blur-sm"></div>

        <div className="max-w-7xl mx-auto px-4 py-6 w-full z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
                <div className="flex items-center gap-3"><Tv2 className="w-8 h-8 text-green-500" /><h1 className="text-3xl font-bold text-[var(--text-main)]">Live TV</h1></div>
                <div className="flex gap-2"><div className="flex bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border-color)]"><button onClick={() => handleSourceChange('global')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${playlistSource === 'global' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><Globe className="w-3 h-3" /> All</button><button onClick={() => handleSourceChange('category')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${playlistSource === 'category' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><Layers className="w-3 h-3" /> Category</button><button onClick={() => handleSourceChange('country')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${playlistSource === 'country' ? 'bg-[rgb(var(--primary-color))] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}><Globe className="w-3 h-3" /> Country</button></div><button onClick={handleImport} className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 h-full"><Upload className="w-3 h-3" /> Import</button></div>
            </div>
        </div>

        <div className="flex-1 min-h-0 z-10 max-w-7xl w-full mx-auto px-4 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-[var(--border-color)] relative">
                        {activeChannel ? ( <video id="tv-player" controls className="w-full h-full" autoPlay></video> ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] p-8">
                                <div className="p-4 bg-[var(--bg-card)] rounded-full mb-6 border border-[var(--border-color)]"><Film className="w-12 h-12 text-[rgb(var(--primary-color))]" /></div>
                                <h3 className="text-xl font-bold text-[var(--text-main)]">Welcome to Live TV</h3>
                                <p className="text-center mt-2">Select a channel from the list to start watching.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                    <div className="p-4 border-b border-[var(--border-color)]">
                        <div className="grid grid-cols-2 gap-2">
                           <div className="relative"><input type="text" placeholder="Search..." className="w-full bg-[var(--bg-input)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-main)] focus:outline-none border border-[var(--border-color)]" value={search} onChange={(e) => setSearch(e.target.value)} /><Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" /></div>
                           <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full bg-[var(--bg-input)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none border border-[var(--border-color)]">
                              {groups.map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0" ref={listContainerRef}>
                        {loading ? ( <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-[rgb(var(--primary-color))] border-t-transparent rounded-full animate-spin"></div>Loading Playlist...</div>
                        ) : error ? ( <div className="p-8 text-center text-red-500 flex flex-col items-center"><AlertCircle className="w-8 h-8 mb-2" />{error}</div>
                        ) : listDimensions.height > 0 ? (
                            <List height={listDimensions.height} itemCount={filteredChannels.length} itemSize={76} width={listDimensions.width} className="custom-scrollbar">
                                {ChannelRow}
                            </List>
                        ) : null}
                    </div>
                    <div className="p-2 border-t border-[var(--border-color)] text-xs text-center text-[var(--text-muted)]">
                        {loading ? '...' : `${filteredChannels.length} / ${channels.length}`} Channels
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};