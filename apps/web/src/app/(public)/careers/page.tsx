/**
 * @file apps/web/src/app/(public)/careers/page.tsx
 * @description Careers, Internships & Jobs Portal for IIT Madras BS Degree Students.
 */

import React from 'react';
import Link from 'next/link';
import { SiteNavbar } from '@/components/layout/site-navbar';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Careers & Internships | IITM BS Student Career Hub',
  description:
    'Verified data science, machine learning, and software internships tailored for IIT Madras BS students.',
};

interface JobOpening {
  id: string;
  role: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Internship' | 'Fellowship';
  stipend: string;
  termEligibility: string;
  skills: string[];
  postedAt: string;
  featured?: boolean;
}

const JOB_OPENINGS: JobOpening[] = [
  {
    id: 'job-1',
    role: 'Junior Data Scientist Intern',
    company: 'IITM Research Park Incubator',
    location: 'Chennai / Hybrid',
    type: 'Internship',
    stipend: '₹35,000 / mo',
    termEligibility: 'Foundation Term 2+ or Diploma',
    skills: ['Python', 'Pandas', 'SQL', 'Stats 1 & 2'],
    postedAt: '2 days ago',
    featured: true,
  },
  {
    id: 'job-2',
    role: 'Machine Learning Research Associate',
    company: 'Applied AI Labs Bangalore',
    location: 'Bengaluru / Remote',
    type: 'Full-time',
    stipend: '₹12 - 16 LPA',
    termEligibility: 'Diploma in DS / Degree Level',
    skills: ['PyTorch', 'Linear Algebra', 'NLP', 'Computer Vision'],
    postedAt: 'Just now',
    featured: true,
  },
  {
    id: 'job-3',
    role: 'Full-Stack Software Engineer (Python/Next.js)',
    company: 'VectorScale Systems',
    location: 'Hyderabad / Remote',
    type: 'Full-time',
    stipend: '₹9 - 14 LPA',
    termEligibility: 'Diploma in Programming',
    skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Python'],
    postedAt: '3 days ago',
  },
  {
    id: 'job-4',
    role: 'Quantitative Analytics Trainee',
    company: 'AlphaRisk Capital',
    location: 'Mumbai / Onsite',
    type: 'Internship',
    stipend: '₹40,000 / mo',
    termEligibility: 'Foundation Term 3+',
    skills: ['Math 1 & 2', 'Probability', 'Python Financial Modeling'],
    postedAt: '1 week ago',
  },
  {
    id: 'job-5',
    role: 'Undergraduate AI Research Fellow',
    company: 'Center for Responsible AI (CeRAI)',
    location: 'Remote',
    type: 'Fellowship',
    stipend: '₹25,000 / mo + Paper Co-authorship',
    termEligibility: 'Any IITM BS Enrolled Student',
    skills: ['Scientific Writing', 'Python', 'Ethics in AI'],
    postedAt: '5 days ago',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 flex flex-col justify-between selection:bg-emerald-800 selection:text-white">
      {/* Universal Site Navbar */}
      <SiteNavbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>IIT Madras BS Alumni & Partner Placement Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
            Careers, Internships & Jobs
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Curated opportunities tailored for students in the IIT Madras BS Degree. Filtered by Foundation, Diploma, and Degree level coursework so you can land roles relevant to your stage.
          </p>
        </div>

        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-stone-800 bg-stone-950/70 backdrop-blur space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Verified Companies</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Every opening recognizes the rigorous credit structure and grading standards of the IITM BS Degree.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-stone-800 bg-stone-950/70 backdrop-blur space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-950 border border-teal-800/80 flex items-center justify-center text-teal-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Level-Mapped Hiring</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Openings tagged by coursework: Foundation (Python & Math), Diploma (ML & Systems), and Degree.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-stone-800 bg-stone-950/70 backdrop-blur space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Alumni Referrals</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Direct connection and internal referrals from seniors currently working at Google, Microsoft, and IITM startups.
            </p>
          </div>
        </div>

        {/* Active Openings Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white font-display">Featured Openings & Internships</h2>
              <p className="text-xs text-stone-400">Verified by our academic faculty & placement team</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60 self-start sm:self-auto">
              5 Active Openings
            </span>
          </div>

          <div className="space-y-3">
            {JOB_OPENINGS.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-stone-800 bg-stone-950 hover:border-emerald-600/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {job.role}
                    </span>
                    {job.featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Featured
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-900 text-stone-300 border border-stone-800">
                      {job.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 font-mono">
                    <span className="flex items-center gap-1.5 text-stone-300">
                      <Building2 className="w-3.5 h-3.5 text-stone-500" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      {job.stipend}
                    </span>
                    <span className="flex items-center gap-1.5 text-stone-500">
                      <Clock className="w-3.5 h-3.5" />
                      {job.postedAt}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-stone-500 mr-1 font-mono">Target:</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-stone-900 text-teal-300 border border-teal-900/50 font-mono">
                      {job.termEligibility}
                    </span>
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded bg-stone-900/80 text-stone-400 border border-stone-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  <Link
                    href={`/support`}
                    className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5"
                  >
                    <span>Resume Review</span>
                  </Link>
                  <a
                    href="mailto:careers@iitm-bs.academic?subject=Application"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>Quick Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Support CTA Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-stone-900 to-teal-950/80 border border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white font-display">Need 1:1 Technical Interview Preparation?</h3>
            <p className="text-xs text-stone-300 max-w-xl">
              Book a 1:1 session with an IIT Madras alumnus working at top tech firms to review your resume, debug portfolio code, and simulate technical rounds.
            </p>
          </div>
          <Link
            href="/one-to-one"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-extrabold text-xs shrink-0 flex items-center gap-2 transition"
          >
            <span>Book 1:1 Mentorship</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-6 text-center text-xs text-stone-500 font-mono">
        © 2026 IITM BS Student Career Hub · Verified Opportunities for Data Science & AI
      </footer>
    </div>
  );
}
