import React, { useState, useEffect } from 'react';
import { Search, Loader2, PlayCircle, Sparkles, ArrowRight, Check } from 'lucide-react';
import api from '../api';

const sampleUrls = [
  { name: 'Amazon Packaged Food', url: 'https://www.amazon.in/dp/B07XMD8M99' },
  { name: 'Flipkart Electronics', url: 'https://www.flipkart.com/p/itm123456789' },
  { name: 'Blinkit Personal Care', url: 'https://blinkit.com/prn/sample-soap/prid/9876' }
];

const loadingSteps = [
  "Connecting to e-commerce URL...",
  "Extracting product listing metadata & NLP attributes...",
  "Scanning packaging label images via Computer Vision OCR...",
  "Applying Legal Metrology Rules (PCR 2011)...",
  "Calculating compliance risk score..."
];

export default function UrlInput({ onResult, onError }) {
  const [url, setUrl] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedSample, setSelectedSample] = useState(null);

  // Cycle loading messages during scan with smooth progress calculation
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 700);
    } else {
      setCurrentStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleScan = async (e) => {
    if (e) e.preventDefault();
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
      onError(err.response?.data?.detail || err.message || "Unable to analyze this product. Please check the URL format or try Demo Mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sampleUrl, name) => {
    setUrl(sampleUrl);
    setSelectedSample(name);
  };

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / loadingSteps.length) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto my-8 scroll-mt-28">
      
      {/* Outer Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl saas-card backdrop-blur-2xl overflow-hidden transition-all duration-300">
        
        {/* Glow corner highlights */}
        <div className="absolute -top-24 -right-24 w-56 h-56 ambient-glow-cyan blur-2xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 ambient-glow-blue blur-2xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Row inside analyzer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                Product Listing Inspector
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Paste any product listing URL from Amazon, Flipkart, Blinkit, or Zepto.
              </p>
            </div>

            {/* Instant Demo Mode Toggle */}
            <label className="inline-flex items-center gap-3 p-1.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 cursor-pointer group hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300 shadow-sm">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isDemo} 
                  onChange={() => setIsDemo(!isDemo)} 
                  disabled={loading}
                />
                <div className={`block w-9 h-5 rounded-full transition-colors duration-300 ${isDemo ? 'bg-cyan-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform ${isDemo ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                Mock Demo Mode
              </span>
            </label>
          </div>

          {/* Form / URL Input Box */}
          <form onSubmit={handleScan} className="space-y-4">
            <div className="relative flex flex-col sm:flex-row gap-3">
              
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors duration-200">
                  <Search className="h-5 w-5" />
                </div>
                
                <input
                  type="url"
                  className="block w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 text-sm sm:text-base font-semibold transition-all duration-300 shadow-inner disabled:opacity-60"
                  placeholder={isDemo ? "Demo mode active (Click Analyze to run instant sample scan)" : "https://www.amazon.in/dp/B07XMD8M99..."}
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setSelectedSample(null); }}
                  disabled={loading || isDemo}
                />
              </div>

              <button
                type="submit"
                disabled={loading || (!url && !isDemo)}
                className="px-8 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-current" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Listing</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>

            {/* Preset Sample URLs Chips */}
            {!isDemo && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs animate-fade-up">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Quick Test:</span>
                {sampleUrls.map((s, idx) => {
                  const isSelected = selectedSample === s.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(s.url, s.name)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950 border border-cyan-500 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-cyan-500/50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </form>

          {/* Smooth Loading & Multi-Stage Scanning Progress Box */}
          {loading && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-200 space-y-3 animate-fade-up">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span className="text-slate-900 dark:text-white font-extrabold">AI Scanner Active</span>
                </div>
                <span className="font-mono text-cyan-700 dark:text-cyan-300">{progressPercent}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-2 rounded-full bg-cyan-500/20 overflow-hidden">
                <div 
                  className="h-full bg-cyan-600 dark:bg-cyan-400 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-cyan-800 dark:text-cyan-300 font-bold animate-pulse">
                {loadingSteps[currentStepIndex]}
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
