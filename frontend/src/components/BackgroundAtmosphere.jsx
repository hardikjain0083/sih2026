import React from 'react';

export default function BackgroundAtmosphere() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      
      {/* Layer 1: Micro Grid Texture Overlay */}
      <div className="absolute inset-0 bg-saas-grid opacity-50 dark:opacity-30 transition-opacity duration-500" />

      {/* Layer 2: PRIMARY LARGE CYAN HERO LIGHT FIELD (Ultra-Diffused, Broad Spread) */}
      <div 
        className="absolute top-[380px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1400px] h-[550px] sm:h-[700px] rounded-full blur-[130px] sm:blur-[160px] animate-hero-glow transition-colors duration-500
                   bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(6,182,212,0.30)_0%,rgba(14,165,233,0.18)_40%,transparent_75%)]
                   dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(6,182,212,0.40)_0%,rgba(14,165,233,0.25)_40%,transparent_75%)]" 
      />

      {/* Layer 3: SECONDARY DEEP BLUE ATMOSPHERIC LIGHT FIELD (Horizontally Offset) */}
      <div 
        className="absolute top-[340px] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[1250px] h-[480px] sm:h-[620px] rounded-full blur-[120px] sm:blur-[150px] animate-hero-glow-secondary transition-colors duration-500
                   bg-[radial-gradient(ellipse_75%_50%_at_45%_50%,rgba(59,130,246,0.20)_0%,rgba(37,99,235,0.10)_45%,transparent_80%)]
                   dark:bg-[radial-gradient(ellipse_75%_50%_at_45%_50%,rgba(59,130,246,0.30)_0%,rgba(37,99,235,0.18)_45%,transparent_80%)]" 
      />

      {/* Layer 4: INDIGO / VIOLET ACCENT GLOW (Offset Right) */}
      <div 
        className="absolute top-[420px] left-[62%] -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[950px] h-[400px] sm:h-[520px] rounded-full blur-[110px] sm:blur-[140px] transition-colors duration-500 opacity-80
                   bg-[radial-gradient(ellipse_65%_45%_at_60%_50%,rgba(139,92,246,0.15)_0%,rgba(168,85,247,0.06)_45%,transparent_75%)]
                   dark:bg-[radial-gradient(ellipse_65%_45%_at_60%_50%,rgba(139,92,246,0.22)_0%,rgba(168,85,247,0.12)_45%,transparent_75%)]" 
      />

      {/* Layer 5: PERIPHERAL VIGNETTE EDGE SHADOW */}
      <div 
        className="absolute inset-0 transition-opacity duration-500
                   bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(248,250,252,0.70)_100%)]
                   dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,7,13,0.85)_100%)]" 
      />

    </div>
  );
}
