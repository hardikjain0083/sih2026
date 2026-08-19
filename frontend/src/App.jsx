import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import WorkflowStepper from './components/WorkflowStepper';
import UrlInput from './components/UrlInput';
import ResultsPanel from './components/ResultsPanel';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';
import BackgroundAtmosphere from './components/BackgroundAtmosphere';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('regulator'); // 'regulator' or 'seller'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('complylens-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply .dark class to <html> document root cleanly
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('complylens-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const scrollToInput = () => {
    const el = document.getElementById('analyzer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 font-sans selection:bg-cyan-500/30">
      
      {/* Layered Atmospheric Background Light Field */}
      <BackgroundAtmosphere />

      {/* Permanently Fixed Glass Header Navbar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        mode={mode}
        setMode={setMode}
        onAnalyzeClick={scrollToInput}
      />

      {/* Main Content with top padding offset for fixed header */}
      <main className="w-full relative z-10 pt-16 sm:pt-20">
        
        {/* Hero Section */}
        <HeroSection mode={mode} onScrollToInput={scrollToInput} />

        {/* Core Product Interaction / Analyzer Section */}
        <section id="analyzer" className="scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

            <UrlInput onResult={setReport} onError={setError} />

            {/* Polished Error Toast / Alert State */}
            {error && (
              <div className="max-w-4xl mx-auto my-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-4 shadow-lg animate-fade-up">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">Analysis Failed</h4>
                    <p className="text-xs sm:text-sm font-medium opacity-90 mt-0.5 text-rose-800 dark:text-rose-200">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-900 dark:text-rose-100 transition-colors flex-shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Results Audit Dashboard */}
            {report && (
              <div className="max-w-5xl mx-auto my-12">
                <ResultsPanel report={report} />
              </div>
            )}

          </div>
        </section>

        {/* Workflow Stepper */}
        <WorkflowStepper />

        {/* Features Showcase */}
        <FeaturesSection />

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
