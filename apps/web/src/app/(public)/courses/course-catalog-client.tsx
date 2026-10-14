'use client';

/**
 * Interactive Course Catalog Client Component
 * Module: Commercial Catalog (src/app/(public)/courses/course-catalog-client.tsx)
 *
 * Provides instant, zero-latency client-side filtering for courses:
 * - Search keyword by title, subject, or instructor.
 * - Academic term filters (Qualifier, Foundation, Diploma).
 * - Exam stage filters (Quiz 1, Quiz 2, End Term).
 * - Delivery category (Recorded vs Live batches).
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Filter, Video, Users, CheckCircle, ArrowRight } from 'lucide-react';

export interface CatalogOffering {
  id: string;
  name: string;
  accessType: string;
  pricePaise: number;
  durationDays: number | null;
}

export interface CatalogCourse {
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
  thumbnail: string | null;
  minPricePaise: number;
  offerings: CatalogOffering[];
}

interface CourseCatalogClientProps {
  initialCourses: CatalogCourse[];
}

const TERMS = ['All Terms', 'Qualifier', 'Foundation', 'Diploma'];
const EXAM_STAGES = ['All Stages', 'Quiz 1', 'Quiz 2', 'End Term'];
const CATEGORIES = ['All Batches', 'LIVE', 'RECORDED'];

export default function CourseCatalogClient({ initialCourses }: CourseCatalogClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [selectedCategory, setSelectedCategory] = useState('All Batches');

  // Filtered courses memoization
  const filteredCourses = useMemo(() => {
    return initialCourses.filter((course) => {
      // Keyword match
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        (course.subject && course.subject.toLowerCase().includes(query)) ||
        (course.teacherName && course.teacherName.toLowerCase().includes(query)) ||
        course.tags.some((t) => t.toLowerCase().includes(query));

      // Term match
      const matchesTerm =
        selectedTerm === 'All Terms' ||
        (course.term && course.term.toLowerCase() === selectedTerm.toLowerCase());

      // Exam stage match
      const matchesStage =
        selectedStage === 'All Stages' ||
        course.examStages.some((s) => s.toLowerCase() === selectedStage.toLowerCase());

      // Category match
      const matchesCategory =
        selectedCategory === 'All Batches' ||
        (course.courseCategory &&
          course.courseCategory.toUpperCase() === selectedCategory.toUpperCase());

      return matchesSearch && matchesTerm && matchesStage && matchesCategory;
    });
  }, [initialCourses, searchTerm, selectedTerm, selectedStage, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e2e4dc] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by subject, title, or exam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
            />
          </div>

          {/* Quick Stats */}
          <div className="text-xs font-semibold text-neutral-500 self-end md:self-center">
            Showing <span className="font-bold text-neutral-900">{filteredCourses.length}</span> courses
          </div>
        </div>

        {/* Filter Pills */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap gap-4 items-center text-xs">
          {/* Academic Term */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px] mr-1">
              Term:
            </span>
            {TERMS.map((term) => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  selectedTerm === term
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Exam Stage */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px] mr-1">
              Exam:
            </span>
            {EXAM_STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  selectedStage === stage
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px] mr-1">
              Format:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center max-w-lg mx-auto">
          <Filter className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900">No matching courses found</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Try resetting your active filters or searching with different keywords.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTerm('All Terms');
              setSelectedStage('All Stages');
              setSelectedCategory('All Batches');
            }}
            className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-md hover:bg-emerald-900 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const defaultOffering = course.offerings[0];
            const startingRupees = Math.floor(course.minPricePaise / 100);

            return (
              <article
                key={course.id}
                className="bg-white rounded-xl border border-[#dedfd7] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Art Banner */}
                  <div className="h-32 bg-gradient-to-br from-[#e8ebe4] to-[#d6ded0] p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 text-neutral-800">
                        {course.subject || 'Academic'}
                      </span>
                      {course.courseCategory === 'LIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <Users className="w-3 h-3" /> Live Batch
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                          <Video className="w-3 h-3" /> Recorded
                        </span>
                      )}
                    </div>

                    <div className="z-10">
                      <span className="text-xs font-semibold text-neutral-700">
                        {course.term || 'IITM BS Degree'}
                      </span>
                    </div>

                    {/* Subtle decorative circles */}
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#c7d4be]/40 pointer-events-none" />
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-emerald-900 transition font-display">
                      <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                    </h3>

                    {course.description && (
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    )}

                    {/* Instructor */}
                    {course.teacherName && (
                      <div className="text-xs text-neutral-500 font-medium">
                        Instructor: <span className="text-neutral-800">{course.teacherName}</span>
                      </div>
                    )}

                    {/* Exam Stage Badges */}
                    {course.examStages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {course.examStages.map((stage) => (
                          <span
                            key={stage}
                            className="text-[10px] px-2 py-0.5 rounded font-mono bg-neutral-100 text-neutral-700"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Pricing & Action */}
                <div className="p-5 pt-0 border-t border-neutral-100 mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Starting from</div>
                    <div className="text-lg font-extrabold text-neutral-900 font-mono">
                      ₹{startingRupees.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Details
                    </Link>

                    {defaultOffering ? (
                      <Link
                        href={`/checkout/${defaultOffering.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-[#29493e] text-white hover:bg-[#1f382f] transition shadow-sm"
                      >
                        <span>Enroll</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-800 text-white hover:bg-emerald-900 transition"
                      >
                        Explore
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
