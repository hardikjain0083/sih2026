import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import ResultsPanel from './components/ResultsPanel';
import { Shield, AlertCircle } from 'lucide-react';

export default function App() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('regulator'); // 'regulator' or 'seller'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Navigation / Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 sm:h-20 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
                  SuRaksha MAPS
                </h1>
                <p className="text-xs text-emerald-500/80 font-semibold tracking-widest uppercase mt-0.5">Legal Metrology Compliance Engine</p>
              </div>
            </div>
            <div className="flex space-x-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50 shadow-inner">
              <button 
                onClick={() => setMode('regulator')}
                className={`px-5 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${mode === 'regulator' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >
                Regulator Mode
              </button>
              <button 
                onClick={() => setMode('seller')}
                className={`px-5 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${mode === 'seller' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >
                Seller Pre-Check
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Header Text */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Analyze E-Commerce <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400">Compliance</span> instantly.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium">
            {mode === 'regulator' 
              ? 'Enter a product URL below to run our AI-powered cross-check against Legal Metrology Rules.'
              : 'Test your product listing before publishing to avoid regulatory penalties.'}
          </p>
        </div>

        {/* Input Component */}
        <UrlInput onResult={setReport} onError={setError} />

        {/* Error State */}
        {error && (
          <div className="mt-8 max-w-4xl mx-auto p-5 rounded-2xl bg-rose-900/20 border border-rose-500/30 flex items-start text-rose-300 shadow-lg shadow-rose-900/10">
            <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-rose-400" />
            <p className="text-sm md:text-base font-medium">{error}</p>
          </div>
        )}

        {/* Results Component */}
        <div className="mt-16 max-w-5xl mx-auto">
          <ResultsPanel report={report} />
        </div>

      </main>
      
      {/* Base CSS for scrollbar and animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }
      `}} />
    </div>
  );
}
