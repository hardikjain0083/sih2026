import React, { useState } from 'react';
import ComplianceScore from './ComplianceScore';
import CrossCheckTable from './CrossCheckTable';
import { AlertTriangle, ShieldCheck, Info, ChevronDown, ChevronUp, FileText, Image } from 'lucide-react';

export default function ResultsPanel({ report }) {
  if (!report) return null;
  const [debugOpen, setDebugOpen] = useState(false);

  const isCritical = report.severity_tier === 'CRITICAL';
  const isMinor = report.severity_tier === 'MINOR' || report.severity_tier === 'COMPLIANT';
  
  const tierColor = isCritical ? 'text-rose-400 bg-rose-400/10 border-rose-500/20' : 
                    isMinor ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' : 
                    'text-amber-400 bg-amber-400/10 border-amber-500/20';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Score Card */}
        <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md flex flex-col items-center justify-center shadow-xl">
          <h3 className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-6">Overall Compliance Score</h3>
          <ComplianceScore score={report.compliance_score} />
          <div className="mt-8 flex items-center justify-center">
            <span className={`px-5 py-2 rounded-full text-xs font-bold tracking-widest border ${tierColor}`}>
              {report.severity_tier} RISK
            </span>
          </div>
        </div>

        {/* Violations */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md flex flex-col shadow-xl">
          <h3 className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-6 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-400" /> Detected Violations
          </h3>
          {report.violations.length > 0 ? (
            <ul className="space-y-3 overflow-y-auto max-h-56 pr-2 custom-scrollbar">
              {report.violations.map((v, i) => (
                <li key={i} className="p-4 rounded-xl bg-rose-900/10 border border-rose-500/10 text-rose-200 text-sm leading-relaxed shadow-sm">
                  {v}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-emerald-400 opacity-80 py-8">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium text-lg">No violations detected!</p>
              <p className="text-sm text-emerald-400/60 mt-1">This listing complies with all Legal Metrology standards.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cross Check Table */}
      <div className="rounded-3xl bg-slate-800/20 border border-slate-700/50 backdrop-blur-sm p-6 shadow-xl">
        <h3 className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-6">Detailed Field Verifications</h3>
        <CrossCheckTable checks={report.cross_checks} />
      </div>

      {/* Corrections */}
      {report.corrections && report.corrections.length > 0 && (
        <div className="p-6 rounded-3xl bg-indigo-900/10 border border-indigo-500/20 backdrop-blur-md shadow-xl">
          <h3 className="text-indigo-300 text-xs uppercase tracking-widest font-semibold mb-6 flex items-center">
            <Info className="w-4 h-4 mr-2" /> Suggested Corrections
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.corrections.map((c, i) => (
              <li key={i} className="flex items-start p-4 rounded-xl bg-slate-800/50 border border-slate-700 shadow-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">{i+1}</span>
                <p className="text-slate-300 text-sm leading-relaxed">{c}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extraction Debug Panel */}
      {(report.text_fields || report.image_fields) && (
        <div className="rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl">
          <button
            onClick={() => setDebugOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-4 bg-slate-800/60 hover:bg-slate-800/80 transition-colors"
          >
            <span className="text-slate-300 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Extraction Debug Inspector
              {report.images_scanned != null && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs font-normal">
                  {report.images_scanned} image{report.images_scanned !== 1 ? 's' : ''} scanned
                </span>
              )}
            </span>
            {debugOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {debugOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-700/50">

              {/* NLP Text Extraction */}
              <div className="p-6 bg-slate-900/40">
                <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> NLP — Extracted from Listing Text
                </h4>
                {report.text_fields ? (
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-800">
                      {Object.entries(report.text_fields).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 pr-3 text-slate-400 font-medium capitalize w-36">{k.replace(/_/g, ' ')}</td>
                          <td className={`py-2 break-all ${v && v !== 'null' ? 'text-emerald-300' : 'text-slate-600 italic'}`}>
                            {v != null && v !== 'null' && String(v) !== '' ? String(v) : 'not found'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm italic">No NLP data returned.</p>}

                {report.raw_text && (
                  <details className="mt-4">
                    <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-300 transition-colors">Show raw scraped text ▾</summary>
                    <pre className="mt-2 p-3 rounded-lg bg-slate-950 text-slate-400 text-xs overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed">{report.raw_text}</pre>
                  </details>
                )}
              </div>

              {/* OCR Image Extraction */}
              <div className="p-6 bg-slate-900/40">
                <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Image className="w-3.5 h-3.5" /> OCR — Extracted from Product Images
                </h4>
                {report.image_fields ? (
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-800">
                      {Object.entries(report.image_fields)
                        .filter(([k]) => k !== 'images_scanned')
                        .map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 pr-3 text-slate-400 font-medium capitalize w-36">{k.replace(/_/g, ' ')}</td>
                          <td className={`py-2 break-all ${v && v !== 'null' ? 'text-indigo-300' : 'text-slate-600 italic'}`}>
                            {v != null && v !== 'null' && String(v) !== '' ? String(v) : 'not found'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm italic">No OCR data returned.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
