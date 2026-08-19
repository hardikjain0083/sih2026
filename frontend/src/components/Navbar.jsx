import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';

const navItems = [
  { id: 'analyzer', label: 'Product Analyzer' },
  { id: 'workflow', label: 'How It Works' },
  { id: 'features', label: 'Features' },
];

export default function Navbar({ theme, toggleTheme, mode, setMode, onAnalyzeClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('analyzer');
  const [isScrolled, setIsScrolled] = useState(false);

  // Track window scroll for glass effect transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section on scroll via IntersectionObserver
  useEffect(() => {
    const handleObserver = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (e, sectionId) => {
    if (e) e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      const navbarOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // True Frosted Glass styles with low-opacity backdrop fill & heavy 20px blur
  const glassBgStyle = theme === 'dark'
    ? {
        backgroundColor: isScrolled ? 'rgba(5, 7, 13, 0.65)' : 'rgba(5, 7, 13, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }
    : {
        backgroundColor: isScrolled ? 'rgba(248, 250, 252, 0.72)' : 'rgba(248, 250, 252, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      };

  return (
    <header 
      style={glassBgStyle}
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 border-b ${
        isScrolled
          ? 'border-slate-300/40 dark:border-slate-700/40 shadow-sm'
          : 'border-slate-200/30 dark:border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Minimal Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer group" 
            onClick={(e) => scrollToSection(e, 'analyzer')}
          >
            <div className="relative p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-sm group-hover:scale-105 group-hover:border-cyan-500/60 transition-all duration-300">
              <ShieldCheck className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping opacity-75" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
              Comply<span className="text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500 transition-colors">Lens</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`relative py-1 transition-colors duration-200 group cursor-pointer ${
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400 font-extrabold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400'
                  }`}
                >
                  {item.label}
                  {/* Animated Active Indicator */}
                  <span 
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-full transition-transform duration-300 ease-out origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} 
                  />
                </a>
              );
            })}
          </nav>

          {/* Controls: Mode Switcher, Theme Toggle, Primary CTA */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Animated Mode Switcher */}
            <div className="relative flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300/50 dark:border-slate-800/50 text-[11px] font-bold">
              <button
                onClick={() => setMode('regulator')}
                className={`relative z-10 px-3 py-1 rounded-lg transition-all duration-300 cursor-pointer ${
                  mode === 'regulator'
                    ? 'bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Regulator Mode
              </button>
              <button
                onClick={() => setMode('seller')}
                className={`relative z-10 px-3 py-1 rounded-lg transition-all duration-300 cursor-pointer ${
                  mode === 'seller'
                    ? 'bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Seller Pre-Check
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-300/50 dark:border-slate-800/50 bg-slate-100/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-all duration-300 group cursor-pointer active:scale-95 shadow-sm"
            >
              <div className="transition-transform duration-500 group-hover:rotate-45">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-800" />}
              </div>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={(e) => scrollToSection(e, 'analyzer')}
              className="inline-flex items-center px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all duration-300 shadow-md hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer group"
            >
              <span>Analyze Product</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-900/80"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-800" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div 
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          className="md:hidden border-b border-slate-300 dark:border-slate-800 bg-white/85 dark:bg-[#05070d]/85 px-4 pt-2 pb-6 space-y-4 animate-fade-up"
        >
          <nav className="flex flex-col space-y-3 font-bold text-sm text-slate-800 dark:text-slate-200">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  scrollToSection(e, item.id);
                }}
                className={`py-1.5 transition-colors ${
                  activeSection === item.id ? 'text-cyan-600 dark:text-cyan-400 font-extrabold' : 'hover:text-cyan-600'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-400">Mode:</span>
              <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <button
                  onClick={() => setMode('regulator')}
                  className={`px-3 py-1 rounded transition-colors ${mode === 'regulator' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Regulator
                </button>
                <button
                  onClick={() => setMode('seller')}
                  className={`px-3 py-1 rounded transition-colors ${mode === 'seller' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Seller
                </button>
              </div>
            </div>

            <button
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToSection(e, 'analyzer');
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950 font-bold text-sm flex items-center justify-center active:scale-95 transition-all"
            >
              Analyze Product Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
