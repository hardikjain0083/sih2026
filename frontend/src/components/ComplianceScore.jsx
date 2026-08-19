import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function ComplianceScore({ score }) {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  
  let color = '#10b981'; // emerald-500
  if (score < 40) color = '#f43f5e'; // rose-500
  else if (score <= 70) color = '#f59e0b'; // amber-500

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#1e293b" /> {/* slate-800 */}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white">{Math.round(score)}</span>
        <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Score</span>
      </div>
    </div>
  );
}
