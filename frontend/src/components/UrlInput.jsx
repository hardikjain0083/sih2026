import React, { useState } from 'react';
import { Search, Loader2, PlayCircle } from 'lucide-react';
import api from '../api';

export default function UrlInput({ onResult, onError }) {
  const [url, setUrl] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url && !isDemo) return;

    setLoading(true);
    onError(null);
    onResult(null);

    try {
      const endpoint = isDemo ? '/api/scan-demo' : '/api/scan';
      const payload = isDemo ? {} : { url, mode: 'live' };
      
      const res = await api.post(endpoint, payload);
      onResult(res.data);
    } catch (err) {
      onError(err.response?.data?.detail || err.message || "An error occurred during the scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      
      {/* Decorative gradients */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>

      <form onSubmit={handleScan} className="relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-4 py-4 bg-slate-900/60 border border-slate-700 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner text-lg"
              placeholder="Paste e-commerce product URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading || isDemo}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!url && !isDemo)}
            className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 text-lg"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Scanning...</>
            ) : (
              'Initiate Scan'
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end text-sm">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isDemo} 
                onChange={() => setIsDemo(!isDemo)} 
                disabled={loading}
              />
              <div className={`block w-12 h-7 rounded-full transition-colors ${isDemo ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${isDemo ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors flex items-center">
              <PlayCircle className="w-4 h-4 mr-2 opacity-70" />
              Enable Mock Demo Mode (Instant)
            </span>
          </label>
        </div>
      </form>
    </div>
  );
}
