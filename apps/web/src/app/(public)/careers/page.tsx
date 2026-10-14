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
  Sparkles,
  GraduationCap,
  Users,
} from 'lucide-react';

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
    location: 'Bangalore / Remote',
    type: 'Full-time',
    stipend: '₹12 - 16 LPA',
    termEligibility: 'Diploma in Data Science / Degree',
    skills: ['PyTorch', 'Scikit-Learn', 'Math 2', 'MLP'],
    postedAt: 'Just now',
    featured: true,
  },
  {
    id: 'job-3',
    role: 'Software Development Intern (Backend)',
    company: 'Veloce Data Systems',
    location: 'Hyderabad / Remote',
    type: 'Internship',
    stipend: '₹25,000 / mo',
    termEligibility: 'Foundation Qualifier Pass',
    skills: ['Python', 'Data Structures', 'FastAPI'],
    postedAt: '3 days ago',
  },
  {
    id: 'job-4',
    role: 'Analytics Engineer Trainee',
    company: 'FinMetrics Analytics',
    location: 'Mumbai / Hybrid',
    type: 'Full-time',
    stipend: '₹8 - 11 LPA',
    termEligibility: 'Diploma in DS / Programming',
    skills: ['SQL', 'Tableau', 'Business Data Mgmt'],
    postedAt: '4 days ago',
  },
  {
    id: 'job-5',
    role: 'Generative AI Engineering Fellow',
    company: 'IITM Tech Innovation Hub',
    location: 'Chennai / Remote',
    type: 'Fellowship',
    stipend: '₹45,000 / mo',
    termEligibility: 'Diploma Level & Above',
    skills: ['Transformers', 'Vector DBs', 'Python'],
    postedAt: '5 days ago',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] flex flex-col justify-between selection:bg-[#FDF0EB] selection:text-[#E05A33] transition-colors">
      {/* Universal Site Navbar */}
      <SiteNavbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] border border-[#F5B8A3] dark:border-[#7D2F1A]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>IIT Madras BS Alumni & Partner Placement Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display tracking-tight leading-tight">
            Careers & Internships
          </h1>

          <p className="text-[#6B6B66] dark:text-[#B5B3AD] text-sm sm:text-base leading-relaxed">
            Curated opportunities tailored for students in the IIT Madras BS Degree.
          </p>
        </div>

        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] flex items-center justify-center text-[#E05A33]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm">Verified Companies</h3>
            <p className="text-xs text-[#8C8C87] leading-relaxed">
              Openings recognizing the rigorous credit structure of the IITM BS Degree.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] flex items-center justify-center text-[#E05A33]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm">Level-Mapped Hiring</h3>
            <p className="text-xs text-[#8C8C87] leading-relaxed">
              Tagged by coursework: Foundation, Diploma, and Degree.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] space-y-2 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] flex items-center justify-center text-[#E05A33]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm">Alumni Referrals</h3>
            <p className="text-xs text-[#8C8C87] leading-relaxed">
              Direct connection from alumni working at tech leaders and startups.
            </p>
          </div>
        </div>

        {/* Active Openings Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E6E1] dark:border-[#2D2D2A] pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">Featured Openings</h2>
            </div>
            <span className="text-xs font-mono text-[#E05A33] bg-[#FDF0EB] dark:bg-[#3A150C] px-2.5 py-1 rounded border border-[#F5B8A3] dark:border-[#7D2F1A] font-semibold self-start sm:self-auto">
              5 Active Openings
            </span>
          </div>

          <div className="space-y-3">
            {JOB_OPENINGS.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] hover:border-[#E05A33]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#1A1A19] dark:text-[#F5F3EF] group-hover:text-[#E05A33] transition-colors">
                      {job.role}
                    </span>
                    {job.featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] border border-[#F5B8A3]">
                        Featured
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F3EF] dark:bg-[#242422] text-[#6B6B66] dark:text-[#B5B3AD] border border-[#E8E6E1] dark:border-[#2D2D2A]">
                      {job.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#8C8C87] font-mono">
                    <span className="flex items-center gap-1.5 text-[#4A4A46] dark:text-[#B5B3AD]">
                      <Building2 className="w-3.5 h-3.5 text-[#8C8C87]" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8C8C87]" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#E05A33] font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-[#E05A33]" />
                      {job.stipend}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#8C8C87]">
                      <Clock className="w-3.5 h-3.5" />
                      {job.postedAt}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#8C8C87] mr-1 font-mono">Target:</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#F5F3EF] dark:bg-[#242422] text-[#E05A33] border border-[#F5B8A3]/40 font-mono font-semibold">
                      {job.termEligibility}
                    </span>
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#F5F3EF] dark:bg-[#242422] text-[#8C8C87] border border-[#E8E6E1] dark:border-[#2D2D2A]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  <Link
                    href={`/support`}
                    className="px-3.5 py-2 rounded-lg bg-[#F5F3EF] dark:bg-[#242422] hover:bg-[#EDEBE5] border border-[#E8E6E1] dark:border-[#2D2D2A] text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] transition flex items-center gap-1.5"
                  >
                    <span>Resume Review</span>
                  </Link>
                  <a
                    href="mailto:careers@iitm-bs.academic?subject=Application"
                    className="px-4 py-2 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
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
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">Need 1:1 Technical Interview Preparation?</h3>
            <p className="text-xs text-[#8C8C87] max-w-xl">
              Book a session with an IIT Madras alumnus to review your resume, debug portfolio code, and simulate technical rounds.
            </p>
          </div>
          <Link
            href="/one-to-one"
            className="px-5 py-2.5 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-xs shrink-0 flex items-center gap-2 transition shadow-xs"
          >
            <span>Book 1:1 Mentorship</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E6E1] dark:border-[#2D2D2A] py-6 text-center text-xs text-[#8C8C87] font-mono">
        © 2026 IITM BS Student Career Hub · Verified Opportunities
      </footer>
    </div>
  );
}
