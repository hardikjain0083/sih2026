import React, { useState } from 'react';
import ComplianceScore from './ComplianceScore';
import CrossCheckTable from './CrossCheckTable';
import { AlertTriangle, ShieldCheck, Sparkles, ChevronDown, ChevronUp, FileText, Image, Info } from 'lucide-react';

export default function ResultsPanel({ report }) {
  if (!report) return null;
  const [debugOpen, setDebugOpen] = useState(false);

  const tier = (report.severity_tier || 'COMPLIANT').toUpperCase();
  const isCritical = tier === 'CRITICAL';
  const isHigh = tier === 'HIGH' || tier === 'MEDIUM';

  const tierColor = isCritical 
    ? 'text-rose-800 dark:text-rose-300 bg-rose-500/15 border-rose-500/40' 
    : isHigh 
    ? 'text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/40' 
    : 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/40';

  return (
    <div className="space-y-8 animate-fade-up duration-700 pb-12">
      
      {/* Top Banner */}
      <div className="animate-fade-up flex items-center justify-between p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-900 dark:text-cyan-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
          <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 animate-pulse" />
          <span>Audit Complete for Legal Metrology (Packaged Commodities Rules 2011)</span>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-500/40">
          Verified Audit
        </span>
      </div>

      {/* Grid Row 1: Score Gauge & Violations Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Score Card */}
        <div className="animate-fade-up delay-100 p-6 rounded-3xl saas-card flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400 mb-4">
              Overall Compliance Score
            </h3>
            <ComplianceScore score={report.compliance_score} />
          </div>
          
          <div className="mt-6 w-full pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border transition-transform hover:scale-105 ${tierColor}`}>
              {tier} RISK
            </span>
          </div>
        </div>

        {/* Violations Card */}
        <div className="animate-fade-up delay-200 lg:col-span-2 p-6 rounded-3xl saas-card flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Detected Compliance Violations ({report.violations ? report.violations.length : 0})
            </h3>

            {report.violations && report.violations.length > 0 ? (
              <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {report.violations.map((v, i) => (
                  <li 
                    key={i} 
                    style={{ animationDelay: `${i * 80}ms` }}
                    className="animate-fade-up p-3.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 text-xs sm:text-sm font-semibold flex items-start gap-3 hover:border-rose-400 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      !
                    </span>
                    <span className="leading-relaxed">{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-emerald-700 dark:text-emerald-400 animate-fade-up">
                <ShieldCheck className="w-14 h-14 mb-3 opacity-80 animate-bounce text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold text-base text-slate-900 dark:text-white">Full Compliance Verified!</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 max-w-sm">
                  No Legal Metrology violations were detected in this product listing text or package images.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross Check Table Card */}
      <div className="animate-fade-up delay-300 p-6 rounded-3xl saas-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400">
            Cross-Verification Matrix (Listing vs Label)
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
            {report.cross_checks ? report.cross_checks.length : 0} Declarations Audited
          </span>
        </div>
        <CrossCheckTable checks={report.cross_checks} />
      </div>

      {/* Suggested Corrections */}
      {report.corrections && report.corrections.length > 0 && (
        <div className="animate-fade-up delay-400 p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 dark:bg-slate-900/60 saas-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" /> Recommended Remediation Steps
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.corrections.map((c, i) => (
              <li key={i} className="flex items-start p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-cyan-500/50 transition-colors">
                <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-xs font-bold mr-2.5 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extraction Debug Inspector */}
      {(report.text_fields || report.image_fields) && (
        <div className="animate-fade-up delay-500 rounded-3xl border border-slate-300 dark:border-slate-800 overflow-hidden saas-card">
          <button
            onClick={() => setDebugOpen(o => !o)}
            className="w-full flex items-center justify-between p-5 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">
                Extraction Debug Inspector
              </span>
              {report.images_scanned != null && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[11px] font-bold">
                  {report.images_scanned} label image{report.images_scanned !== 1 ? 's' : ''} OCR scanned
                </span>
              )}
            </div>
            <div className="transition-transform duration-300">
              {debugOpen ? <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            </div>
          </button>

          {debugOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 dark:divide-slate-800 border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/40 animate-fade-up">

              {/* NLP Text Extraction */}
              <div className="p-6">
                <h4 className="text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Extracted Listing Text (NLP)
                </h4>
                {report.text_fields ? (
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {Object.entries(report.text_fields).map(([k, v]) => (
                        <tr key={k} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 pr-3 text-slate-700 dark:text-slate-400 font-semibold capitalize w-36">{k.replace(/_/g, ' ')}</td>
                          <td className="py-2 break-all font-mono font-bold text-slate-900 dark:text-slate-200">
                            {v != null && v !== 'null' && String(v) !== '' ? String(v) : <span className="text-slate-400 italic font-normal">none</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-xs italic font-medium">No NLP data available.</p>}

                {report.raw_text && (
                  <details className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <summary className="text-xs text-slate-600 dark:text-slate-400 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                      View Raw Scraped HTML Text
                    </summary>
                    <pre className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-[11px] overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                      {report.raw_text}
                    </pre>
                  </details>
                )}
              </div>

              {/* OCR Image Extraction */}
              <div className="p-6">
                <h4 className="text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Image className="w-4 h-4" /> Package Label OCR Extraction
                </h4>
                {report.image_fields ? (
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {Object.entries(report.image_fields)
                        .filter(([k]) => k !== 'images_scanned')
                        .map(([k, v]) => (
                        <tr key={k} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 pr-3 text-slate-700 dark:text-slate-400 font-semibold capitalize w-36">{k.replace(/_/g, ' ')}</td>
                          <td className="py-2 break-all font-mono font-bold text-slate-900 dark:text-slate-200">
                            {v != null && v !== 'null' && String(v) !== '' ? String(v) : <span className="text-slate-400 italic font-normal">none</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-xs italic font-medium">No OCR image data available.</p>}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
