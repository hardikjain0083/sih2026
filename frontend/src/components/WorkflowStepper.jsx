import React, { useState } from 'react';
import { Link2, Database, Eye, Scale, Cpu, ShieldCheck, FileSpreadsheet, ArrowRight } from 'lucide-react';

const steps = [
  { 
    id: 1, 
    name: 'Product URL', 
    icon: Link2, 
    desc: 'Input listing link',
    details: 'ComplyLens connects to standard e-commerce product pages (Amazon, Flipkart, Blinkit, Zepto, Swiggy Instamart) and fetches publicly listed catalog data.',
    target: 'HTTP Listing Fetch & HTML Scraping'
  },
  { 
    id: 2, 
    name: 'Data Extraction', 
    icon: Database, 
    desc: 'Scrape claims & metadata',
    details: 'NLP parsing extracts structured claims from product titles, bullet points, specifications, MRP text, net quantity disclosures, and seller info.',
    target: 'Regex & LLM Attribute Extraction'
  },
  { 
    id: 3, 
    name: 'Label OCR', 
    icon: Eye, 
    desc: 'Scan physical package images',
    details: 'Multimodal vision models OCR-scan product packaging images to detect physical label disclosures (Net Wt, Mfg Date, Customer Care, FSSAI/Metrology marks).',
    target: 'Computer Vision OCR & Spatial Text Alignment'
  },
  { 
    id: 4, 
    name: 'Rule Checking', 
    icon: Scale, 
    desc: 'Legal Metrology PCR 2011',
    details: 'Verifies mandatory disclosures under Legal Metrology (Packaged Commodities) Rules 2011 & E-Commerce Amendments 2020.',
    target: 'PCR Rule Enforcement Matrix'
  },
  { 
    id: 5, 
    name: 'AI Analysis', 
    icon: Cpu, 
    desc: 'Cross-verify text vs label',
    details: 'Cross-checks online text claims against physical packaging OCR results to identify discrepancies, non-standard unit declarations, or deceptive pricing.',
    target: 'Cross-Check Verification Matrix'
  },
  { 
    id: 6, 
    name: 'Compliance Result', 
    icon: ShieldCheck, 
    desc: 'Risk tier & score',
    details: 'Generates an overall compliance score (0-100) and assigns a regulatory risk tier: CRITICAL, HIGH, MEDIUM, MINOR, or COMPLIANT.',
    target: 'Risk Score Engine'
  },
  { 
    id: 7, 
    name: 'Detailed Report', 
    icon: FileSpreadsheet, 
    desc: 'Actionable guidance',
    details: 'Provides regulatory compliance reports, highlighting specific field mismatches and providing corrective action guidelines for sellers and inspectors.',
    target: 'PDF / JSON Compliance Audit Certificate'
  },
];

export default function WorkflowStepper() {
  const [activeStepId, setActiveStepId] = useState(1);
  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

  return (
    <section id="workflow" className="py-14 md:py-18 transition-colors scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-400 mb-1.5 block">
            Interactive Inspection Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How ComplyLens Audits E-Commerce Listings
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1.5">
            Click any step below to explore the AI verification pipeline.
          </p>
        </div>

        {/* Stepper Buttons Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === activeStepId;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`relative p-3.5 rounded-2xl saas-card text-left transition-all duration-300 cursor-pointer outline-none ${
                  isActive
                    ? 'border-cyan-600 dark:border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10 -translate-y-1 bg-white dark:bg-slate-900'
                    : 'hover:-translate-y-0.5 opacity-90 hover:opacity-100 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs mb-2.5 border transition-colors duration-300 ${
                  isActive 
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-500' 
                    : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400">
                    Step 0{step.id}
                  </span>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                  )}
                </div>

                <h3 className={`text-xs font-extrabold transition-colors ${isActive ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                  {step.name}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Active Step Interactive Detail Card */}
        <div key={activeStep.id} className="p-5 sm:p-7 rounded-3xl saas-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl animate-fade-up">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-900 dark:text-cyan-300 text-xs font-bold border border-cyan-500/30">
                <span>Phase 0{activeStep.id}</span>
                <span>•</span>
                <span>{activeStep.target}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {activeStep.name} Module
              </h3>

              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-3xl">
                {activeStep.details}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveStepId((prev) => (prev % steps.length) + 1)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300/60 dark:border-slate-700/60 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
