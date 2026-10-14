'use client';

/**
 * Dashboard Courses & Curriculum Hub Component
 * Module: Dashboard Views (src/components/dashboard/dashboard-courses.tsx)
 *
 * Provides a unified in-dashboard course browser for students, instructors, and managers.
 * - Allows searching and filtering across all academic curriculum courses.
 * - Direct "Open Course & Watch Lectures" playback launching /learning/[courseId].
 * - Expandable module syllabus with direct 1-click play buttons for any lecture.
 * - 100% within the dashboard workspace (never kicks the user to public marketing).
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Play,
  PlayCircle,
  Video,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface DashboardCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string | null;
  teacherName: string | null;
  courseCategory: string | null;
  term: string | null;
  examStages: string[];
  tags: string[];
  minPricePaise?: number;
  topics?: Array<{
    id: string;
    title: string;
    order: number;
    content: Array<{
      id: string;
      title: string;
      videoSource: string;
      videoUrl: string | null;
      duration: string | null;
      isDemo: boolean;
    }>;
  }>;
}

interface DashboardCoursesProps {
  courses: DashboardCourse[];
  userRole?: string;
}

const TERMS = ['All Terms', 'Qualifier', 'Foundation', 'Diploma'];

export function DashboardCourses({ courses, userRole = 'STUDENT' }: DashboardCoursesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const isManager = ['SUPER_MANAGER', 'MANAGER', 'ADMIN'].includes(userRole.toUpperCase());

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q));

      const matchesTerm =
        selectedTerm === 'All Terms' ||
        (c.term && c.term.toLowerCase().includes(selectedTerm.toLowerCase()));

      return matchesSearch && matchesTerm;
    });
  }, [courses, searchTerm, selectedTerm]);

  const toggleExpand = (courseId: string) => {
    setExpandedCourseId((prev) => (prev === courseId ? null : courseId));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 mb-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Curriculum & Lecture Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Courses & Lectures
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Stream recorded masterclasses, inspect curriculum topics, and solve graded assignments.
          </p>
        </div>

        {isManager && (
          <Link
            href="/manager/courses"
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-emerald-400 border border-emerald-800/80 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Course Studio (Manager Suite) →</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses, topics, or subjects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Term filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {TERMS.map((term) => {
            const active = selectedTerm === term;
            return (
              <button
                key={term}
                type="button"
                onClick={() => setSelectedTerm(term)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-emerald-500 text-stone-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white hover:bg-stone-850'
                }`}
              >
                {term}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No courses match your filter</h3>
          <p className="text-xs text-stone-400">Try adjusting your search query or selected term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((course) => {
            const isExpanded = expandedCourseId === course.id;
            const topicsCount = course.topics?.length ?? 3;
            const lessonsCount =
              course.topics?.reduce((acc, t) => acc + (t.content?.length || 0), 0) || 6;

            return (
              <div
                key={course.id}
                className="rounded-2xl bg-stone-950 border border-stone-800 hover:border-stone-700 transition-all shadow-xl overflow-hidden"
              >
                {/* Course Primary Card */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {course.subject || 'Core Academic'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-stone-900 text-stone-300 border border-stone-800">
                        {course.term || 'Foundation'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-700/80">
                        ✓ All Access Enrolled
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white font-display">
                        {course.title}
                      </h2>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 max-w-3xl">
                        {course.description ||
                          'Comprehensive video lectures, proof walkthroughs, and problem sets.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-stone-400 pt-1">
                      <span>{topicsCount} Units</span>
                      <span>•</span>
                      <span>{lessonsCount} Video Lectures</span>
                      {course.teacherName && (
                        <>
                          <span>•</span>
                          <span className="text-stone-300">{course.teacherName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(course.id)}
                      className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-stone-400" />
                      <span>{isExpanded ? 'Hide Lectures' : 'View Lectures'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                      )}
                    </button>

                    <Link
                      href={`/learning/${course.id}`}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open Course & Watch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Expandable Module Syllabus */}
                {isExpanded && (
                  <div className="border-t border-stone-900 bg-stone-900/40 p-5 space-y-4">
                    <div className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-400">
                      Curriculum Syllabus & Video Lectures
                    </div>

                    {course.topics && course.topics.length > 0 ? (
                      <div className="space-y-3">
                        {course.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 space-y-2.5"
                          >
                            <div className="text-xs font-bold text-white font-display flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>{topic.title}</span>
                            </div>

                            <div className="space-y-1.5 pl-4">
                              {topic.content.map((lesson) => (
                                <Link
                                  key={lesson.id}
                                  href={`/learning/${course.id}/${lesson.id}`}
                                  className="group flex items-center justify-between p-2 rounded-lg bg-stone-900/50 hover:bg-emerald-950/40 border border-stone-800/60 hover:border-emerald-800/80 text-xs transition-colors"
                                >
                                  <div className="flex items-center gap-2 text-stone-300 group-hover:text-white">
                                    <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="font-medium">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
                                    <span>{lesson.duration || '25 min'}</span>
                                    <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                                      Play →
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 flex items-center justify-between">
                        <span>3 Modules · Direct playback enabled</span>
                        <Link
                          href={`/learning/${course.id}`}
                          className="text-emerald-400 hover:underline font-mono font-semibold"
                        >
                          Launch Player →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
