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
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] flex flex-col justify-between selection:bg-[#FDF0EB] selection:text-[#E05A33]">
      <SiteNavbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-12 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
            ACADEMIC VAULT
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display tracking-tight">
            Study Resources & Formula Sheets
          </h1>
          <p className="text-xs sm:text-sm text-[#8C8C87]">
            Official syllabus notes, formula sheets, and past term solved papers.
          </p>
        </div>

        <div className="space-y-8">
          {RESOURCES.map((section) => (
            <div key={section.category} className="space-y-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E05A33]">
                {section.category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] flex items-center justify-between gap-4 hover:border-[#E05A33]/50 transition shadow-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm font-bold text-[#1A1A19] dark:text-[#F5F3EF] truncate font-display">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-[#8C8C87] font-mono mt-0.5">
                          <span>{item.type}</span>
                          <span>·</span>
                          <span>{item.size}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#F5F3EF] dark:bg-[#242422] text-[#4A4A46] dark:text-[#B5B3AD] border border-[#E8E6E1] dark:border-[#2D2D2A] text-[10px]">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="#download"
                      className="px-3.5 py-1.5 rounded-xl bg-[#F5F3EF] hover:bg-[#FDF0EB] dark:bg-[#242422] dark:hover:bg-[#3A150C] hover:text-[#E05A33] border border-[#E8E6E1] dark:border-[#2D2D2A] text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E05A33]" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#E8E6E1] dark:border-[#2D2D2A] py-6 text-center text-xs text-[#8C8C87] font-mono">
        IIT Madras BS Companion Study Hub · Academic Resources
      </footer>
    </div>
  );
}
