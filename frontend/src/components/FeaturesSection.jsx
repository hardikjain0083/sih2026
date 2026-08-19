import React from 'react';
import { Eye, Scale, ShieldAlert, FileSpreadsheet } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: "Multimodal Vision OCR",
    description: "Extracts fine packaging label declarations directly from high-res product photos using specialized OCR models."
  },
  {
    icon: Scale,
    title: "Legal Metrology PCR Engine",
    description: "Enforces mandatory PCR 2011 declarations including Manufacturer/Importer details, MRP, Net Quantities, and Country of Origin."
  },
  {
    icon: ShieldAlert,
    title: "Automated Discrepancy Detection",
    description: "Cross-checks physical label extractions against online listing text to catch deceptive marketing claims instantly."
  },
  {
    icon: FileSpreadsheet,
    title: "Audit-Ready Legal Reports",
    description: "Generates comprehensive compliance audit reports ready for regulatory notices or seller correction action plans."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-14 md:py-18 transition-colors scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
          <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-400 mb-1.5 block">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Engineered for Precision Legal Auditing
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base font-medium">
            ComplyLens combines NLP text extraction and optical label recognition to safeguard consumer protection standards across major e-commerce marketplaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i} 
                style={{ animationDelay: `${i * 100}ms` }}
                className="animate-fade-up p-5 rounded-3xl saas-card flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:border-cyan-500/50 transition-all duration-300 group cursor-default"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30 group-hover:bg-cyan-600 group-hover:text-white dark:group-hover:text-slate-950 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {f.description}
                  </p>
                </div>
                
                <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center text-xs font-bold text-cyan-700 dark:text-cyan-400">
                  <span>Explore module</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
