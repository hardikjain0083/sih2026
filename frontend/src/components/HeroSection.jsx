import React from 'react';
import { Sparkles, Shield, Cpu, FileCheck, CheckCircle2, ArrowDown } from 'lucide-react';

export default function HeroSection({ mode, onScrollToInput }) {
  return (
    <section className="relative pt-10 pb-12 md:pt-16 md:pb-20 text-center">

      {/* ATMOSPHERIC HERO LIGHT FIELD — clipped inside own overflow-hidden layer, independent of content stacking context */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1300px] h-[550px] sm:h-[700px] rounded-full blur-[130px] sm:blur-[160px] animate-hero-glow
                     bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(6,182,212,0.48)_0%,rgba(14,165,233,0.26)_45%,transparent_75%)]
                     dark:bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(34,211,238,0.58)_0%,rgba(56,189,248,0.36)_45%,transparent_75%)]" 
        />
        <div 
          className="absolute top-[35%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[1100px] h-[480px] sm:h-[600px] rounded-full blur-[120px] sm:blur-[150px] animate-hero-glow-secondary
                     bg-[radial-gradient(ellipse_75%_50%_at_45%_50%,rgba(59,130,246,0.32)_0%,rgba(37,99,235,0.16)_45%,transparent_80%)]
                     dark:bg-[radial-gradient(ellipse_75%_50%_at_45%_50%,rgba(59,130,246,0.42)_0%,rgba(37,99,235,0.24)_45%,transparent_80%)]" 
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Announcement Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-cyan-500/30 dark:border-cyan-400/30 text-cyan-800 dark:text-cyan-300 text-xs font-bold tracking-wide mb-6 shadow-sm backdrop-blur-md hover:scale-105 transition-transform duration-300 cursor-default">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          <span>AI-Powered Legal Metrology Verification Engine</span>
        </div>

        {/* Proportional Hero Title */}
        <h1 className="animate-fade-up delay-100 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] mb-6">
          <span className="text-slate-900 dark:text-white drop-shadow-sm">
            Make e-commerce
          </span>
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-700 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
            compliance effortless.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up delay-200 max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-8">
          {mode === 'regulator'
            ? 'ComplyLens automatically extracts listing claims, scans physical packaging labels via computer vision, and detects Legal Metrology non-compliance in real-time.'
            : 'Pre-check your e-commerce product listings before publishing to prevent regulatory notices, fines, and platform delisting penalties.'}
        </p>

        {/* Hero CTA Buttons */}
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
          <button
            onClick={onScrollToInput}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Analyze a Product</span>
          </button>
          
          <a
            href="#workflow"
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300/80 dark:border-slate-800/80 font-bold text-sm sm:text-base transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group backdrop-blur-md shadow-sm"
          >
            <span>See How It Works</span>
            <ArrowDown className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:translate-y-0.5 transition-transform duration-200" />
          </a>
        </div>

        {/* Visual Workflow Feature Pills */}
        <div className="animate-fade-up delay-400 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
          {[
            { icon: Cpu, label: 'Listing Data NLP', color: 'text-cyan-600 dark:text-cyan-400' },
            { icon: FileCheck, label: 'Label OCR Vision', color: 'text-sky-600 dark:text-sky-400' },
            { icon: CheckCircle2, label: 'Metrology Rules Check', color: 'text-blue-600 dark:text-blue-400' },
            { icon: Shield, label: 'Risk Score Report', color: 'text-teal-600 dark:text-teal-400' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-cyan-500/50 hover:-translate-y-0.5 transition-all duration-300 cursor-default shadow-sm backdrop-blur-md"
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
