import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-950/40 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                Comply<span className="text-cyan-600 dark:text-cyan-400">Lens</span>
              </span>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                AI-Powered E-Commerce Compliance Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-700 dark:text-slate-300 font-bold">
            <span>Legal Metrology Act (2009)</span>
            <span>•</span>
            <span>Packaged Commodities Rules (2011)</span>
            <span>•</span>
            <span>E-Commerce Rules (2020)</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            © {new Date().getFullYear()} ComplyLens Engine. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}
