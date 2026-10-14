/**
 * @file apps/web/src/app/(public)/resources/page.tsx
 * @description Academic Study Resources, PYQs & Revision Material Library.
 */

import React from 'react';
import Link from 'next/link';
import { SiteNavbar } from '@/components/layout/site-navbar';
import { FileText, Download, BookOpen, Calculator, Code, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Free Study Resources & PYQs | IITM BS Study Hub',
  description: 'Download previous year question papers, formula sheets, Python notebooks, and IITM grading rubrics.',
};

const RESOURCES = [
  {
    category: 'Formula Sheets & Cheatsheets',
    items: [
      { title: 'Mathematics 1 Comprehensive Formula Sheet', type: 'PDF', size: '2.4 MB', tag: 'Foundation' },
      { title: 'Statistics 1 Distributions & Probability Cheatsheet', type: 'PDF', size: '1.8 MB', tag: 'Foundation' },
      { title: 'Computational Thinking Pseudocode & Syntax Guide', type: 'PDF', size: '3.1 MB', tag: 'Qualifier' },
      { title: 'Mathematics 2 Calculus & Vector Spaces Quick Reference', type: 'PDF', size: '2.9 MB', tag: 'Foundation' },
    ],
  },
  {
    category: 'Previous Year Question Papers (PYQs)',
    items: [
      { title: 'Quiz 1 Past 4 Terms Official Solved Papers', type: 'PDF Set', size: '12 MB', tag: 'Exam Series' },
      { title: 'Quiz 2 Real Exam Papers with Step-by-Step Keys', type: 'PDF Set', size: '15 MB', tag: 'Exam Series' },
      { title: 'End Term Comprehensive Mock Compilation', type: 'PDF Set', size: '18 MB', tag: 'End Term' },
    ],
  },
  {
    category: 'Code Notebooks & Coding Challenges',
    items: [
      { title: 'Python Weekly Graded Assignment Solved Notebooks', type: 'IPYNB', size: '4.2 MB', tag: 'Python' },
      { title: 'Piston IDE 50 Must-Solve Practice Problems', type: 'ZIP', size: '1.2 MB', tag: 'Coding' },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#0c100d] text-stone-100 flex flex-col justify-between selection:bg-emerald-800 selection:text-white">
      <SiteNavbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="brand">Academic Library</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Study Resources & Formula Sheets
          </h1>
          <p className="text-stone-400 text-sm">
            Curated study notes, previous year question papers (PYQs), and algorithmic cheat sheets for all IIT Madras BS Degree cohorts.
          </p>
        </div>

        <div className="space-y-8">
          {RESOURCES.map((section) => (
            <div key={section.category} className="space-y-3">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-400">
                {section.category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 backdrop-blur-sm flex items-center justify-between gap-4 hover:border-emerald-600/50 transition"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-emerald-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-0.5">
                          <span>{item.type}</span>
                          <span>·</span>
                          <span>{item.size}</span>
                          <span className="px-1.5 py-0.2 rounded bg-stone-900 text-emerald-300 border border-stone-800 text-[10px]">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="#download"
                      className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-emerald-950 hover:text-emerald-300 border border-stone-800 text-xs font-semibold text-stone-300 flex items-center gap-1.5 transition shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-stone-900 py-6 text-center text-xs text-stone-600">
        IIT Madras BS Companion Study Hub · Free Community Academic Resources
      </footer>
    </div>
  );
}
