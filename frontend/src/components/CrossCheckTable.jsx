import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function CrossCheckTable({ checks }) {
  const getStatusStyle = (status) => {
    if (status === 'match') return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    if (status === 'MISMATCH') return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
    return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
  };

  const getStatusIcon = (status) => {
    if (status === 'match') return <CheckCircle className="w-4 h-4 mr-2" />;
    if (status === 'MISMATCH') return <XCircle className="w-4 h-4 mr-2" />;
    return <AlertCircle className="w-4 h-4 mr-2" />;
  };

  const formatText = (text) => text || <span className="text-slate-500 italic">null</span>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/20 backdrop-blur-md">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-800/80 text-slate-100 uppercase text-xs tracking-wider border-b border-slate-700">
          <tr>
            <th className="px-6 py-4 font-medium">Field Name</th>
            <th className="px-6 py-4 font-medium">Text Value (Listing)</th>
            <th className="px-6 py-4 font-medium">Image Value (Label)</th>
            <th className="px-6 py-4 font-medium">Match Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {checks.map((check, idx) => (
            <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-200 capitalize whitespace-nowrap">
                {check.field_name.replace(/_/g, ' ')}
              </td>
              <td className="px-6 py-4 break-words">{formatText(check.text_value)}</td>
              <td className="px-6 py-4 break-words">{formatText(check.image_value)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(check.match_status)}`}>
                  {getStatusIcon(check.match_status)}
                  {check.match_status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
