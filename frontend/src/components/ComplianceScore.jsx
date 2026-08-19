import React, { useEffect, useState } from 'react';

export default function ComplianceScore({ score }) {
  const safeScore = Math.min(100, Math.max(0, score || 0));
  const [animatedScore, setAnimatedScore] = useState(0);

  // Smooth counter animation from 0 to actual score on mount / update
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const steps = 30;
    const increment = safeScore / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= safeScore) {
        setAnimatedScore(safeScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [safeScore]);

  let strokeColor = '#10b981'; // emerald-500
  if (safeScore < 40) {
    strokeColor = '#f43f5e'; // rose-500
  } else if (safeScore <= 70) {
    strokeColor = '#f59e0b'; // amber-500
  }

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        {/* Background Ring */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="var(--border-color)"
          strokeWidth="14"
          fill="transparent"
          opacity="0.3"
        />
        {/* Animated Foreground Score Arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={strokeColor}
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-all duration-300">
          {Math.round(animatedScore)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
          Score
        </span>
      </div>
    </div>
  );
}
