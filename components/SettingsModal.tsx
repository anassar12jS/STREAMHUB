import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { TORRENTIO_BASE_URL } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('torrentio_url');
    setUrl(stored || TORRENTIO_BASE_URL);
  }, [isOpen]);

  const handleSave = () => {
    let cleanUrl = url.trim();
    // Basic validation
    if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
    }
    // Remove trailing slash/manifest.json if user pasted full link
    cleanUrl = cleanUrl.replace('/manifest.json', '').replace(/\/$/, '');
    
    localStorage.setItem('torrentio_url', cleanUrl);
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
        window.location.reload(); // Reload to apply changes
    }, 800);
  };

  const handleReset = () => {
    localStorage.removeItem('torrentio_url');
    setUrl(TORRENTIO_BASE_URL);
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
        window.location.reload();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#121212] border border-gray-800 w-full max-w-lg rounded-xl shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-purple-500" />
          Addon Configuration
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Configure the data source for streams. By default, this uses the public Torrentio instance.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Torrentio URL</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
              placeholder="https://torrentio.strem.fun"
            />
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="text-xs text-blue-200 leading-relaxed">
              <span className="font-bold text-blue-400">Want faster speeds?</span>
              <br />
              Standard torrents rely on P2P seeders which can be slow in a browser.
              <br />
              <br />
              For <b>instant 4K streaming</b>, go to <a href="https://torrentio.strem.fun/configure" target="_blank" rel="noreferrer" className="underline hover:text-white">torrentio.strem.fun</a>, configure it with a Debrid provider (like Real-Debrid), and paste the generated URL above.
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
           <button 
             onClick={handleReset}
             className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
                Reset to Default
            </button>
            <button 
                onClick={handleSave}
                className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded font-bold flex items-center gap-2 transition-colors"
            >
                {saved ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Configuration'}
            </button>
        </div>
      </div>
    </div>
  );
};