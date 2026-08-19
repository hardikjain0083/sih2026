import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function CrossCheckTable({ checks }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="p-6 text-center text-slate-600 dark:text-slate-400 text-sm font-semibold italic">
        No verification data available.
      </div>
    );
  }

  const getStatusStyle = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'MATCH') {
      return 'text-emerald-800 bg-emerald-500/15 border-emerald-500/40 dark:text-emerald-300';
    }
    if (s === 'MISMATCH') {
      return 'text-rose-800 bg-rose-500/15 border-rose-500/40 dark:text-rose-300';
    }
    if (s === 'MISSING') {
      return 'text-amber-800 bg-amber-500/15 border-amber-500/40 dark:text-amber-300';
    }
    return 'text-slate-800 bg-slate-200 border-slate-300 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'MATCH') return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />;
    if (s === 'MISMATCH') return <XCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />;
    if (s === 'MISSING') return <AlertTriangle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />;
    return <HelpCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />;
  };

  const formatValue = (val) => {
    if (!val || val === 'null' || val === 'undefined') {
      return <span className="text-slate-500 dark:text-slate-500 italic font-medium">Not Specified</span>;
    }
    return <span className="text-slate-900 dark:text-slate-100 font-bold">{String(val)}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-300 dark:border-slate-800">
          <tr>
            <th className="px-5 py-3.5">Declaration Field</th>
            <th className="px-5 py-3.5">Listing Claim (Text)</th>
            <th className="px-5 py-3.5">Package Label (OCR)</th>
            <th className="px-5 py-3.5">Match Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/50">
          {checks.map((check, idx) => (
            <tr key={idx} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/50 transition-colors">
              <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100 capitalize whitespace-nowrap">
                {check.field_name ? check.field_name.replace(/_/g, ' ') : `Field #${idx + 1}`}
              </td>
              <td className="px-5 py-4 max-w-xs break-words">{formatValue(check.text_value)}</td>
              <td className="px-5 py-4 max-w-xs break-words">{formatValue(check.image_value)}</td>
              <td className="px-5 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(check.match_status)}`}>
                  {getStatusIcon(check.match_status)}
                  {(check.match_status || 'UNKNOWN').replace(/_/g, ' ').toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
