import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import CourseCatalogClient, { type CatalogCourse } from './course-catalog-client';

/**
 * Course Catalog Page
 * Module: Commercial Catalog (src/app/(public)/courses/page.tsx)
 *
 * Server-rendered course discovery catalog for IITM BS Degree & Foundation students.
 * Queries published courses with their active pricing offerings from the database
 * and renders an interactive, fast filtering interface by academic term, exam cycle, and category.
 */

import { SiteNavbar } from '@/components/layout/site-navbar';
import { getFullSession } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';

export const metadata: Metadata = {
  title: 'Explore Courses | IITM BS Prep & Foundation',
  description: 'Comprehensive academic courses, live problem solving batches, and proctored exam prep for IIT Madras BS Degree.',
};

// Fallback curated courses if the local database does not have published courses yet
const FALLBACK_COURSES: CatalogCourse[] = [
  {
    id: 'course-ct',
    slug: 'computational-thinking',
    title: 'Computational Thinking & Python Fundamentals',
    description: 'Master algorithmic logic, pseudocode tracing, and core Python data structures for IITM Qualifier and Foundation exams.',
    subject: 'Computer Science',
    teacherName: 'Prof. Anirudh Sharma',
    courseCategory: 'LIVE',
    term: 'Qualifier',
    examStages: ['Quiz 1', 'Quiz 2', 'End Term'],
    tags: ['Python', 'Algorithms', 'Qualifier Prep'],
    thumbnail: null,
    minPricePaise: 249900,
    offerings: [
      { id: 'off-ct-rec', name: 'Recorded Batch', accessType: 'RECORDED', pricePaise: 249900, durationDays: 120 },
      { id: 'off-ct-live', name: 'Live Interactive Batch', accessType: 'LIVE', pricePaise: 399900, durationDays: 120 },
    ],
  },
  {
    id: 'course-math1',
    slug: 'mathematics-for-data-science-1',
    title: 'Mathematics for Data Science 1 (Math 1)',
    description: 'Rigorous coverage of linear equations, functions, coordinate geometry, limits, and derivatives with step-by-step assignment walkthroughs.',
    subject: 'Mathematics',
    teacherName: 'Dr. Priya Sundaram',
    courseCategory: 'RECORDED',
    term: 'Foundation',
    examStages: ['Quiz 1', 'End Term'],
    tags: ['Calculus', 'Linear Algebra', 'Foundations'],
    thumbnail: null,
    minPricePaise: 199900,
    offerings: [
      { id: 'off-math1-rec', name: 'Comprehensive Recorded', accessType: 'RECORDED', pricePaise: 199900, durationDays: 180 },
    ],
  },
  {
    id: 'course-stats1',
    slug: 'statistics-for-data-science-1',
    title: 'Statistics for Data Science 1 (Stats 1)',
    description: 'Probability models, descriptive statistics, random variables, and distributions essential for data analysis and grading cutoffs.',
    subject: 'Statistics',
    teacherName: 'Rajesh Ramanujan',
    courseCategory: 'LIVE',
    term: 'Foundation',
    examStages: ['Quiz 2', 'End Term'],
    tags: ['Probability', 'Distributions', 'Problem Sets'],
    thumbnail: null,
    minPricePaise: 299900,
    offerings: [
      { id: 'off-stats1-live', name: 'Live Evening Batch', accessType: 'LIVE', pricePaise: 299900, durationDays: 90 },
      { id: 'off-stats1-rec', name: 'Recorded Masterclass', accessType: 'RECORDED', pricePaise: 219900, durationDays: 180 },
    ],
  },
  {
    id: 'course-eng1',
    slug: 'english-1-for-data-science',
    title: 'English 1 & Professional Communication',
    description: 'Grammar mechanics, critical reading, technical writing, and oral comprehension designed to secure top S-grade cutoffs.',
    subject: 'Humanities',
    teacherName: 'Meenakshi Iyer',
    courseCategory: 'RECORDED',
    term: 'Qualifier',
    examStages: ['Quiz 1', 'Quiz 2', 'End Term'],
    tags: ['Grammar', 'Reading', 'Communication'],
    thumbnail: null,
    minPricePaise: 149900,
    offerings: [
      { id: 'off-eng1-rec', name: 'Self-Paced recorded pack', accessType: 'RECORDED', pricePaise: 149900, durationDays: 120 },
    ],
  },
  {
    id: 'course-mlf',
    slug: 'machine-learning-foundations',
    title: 'Machine Learning Foundations (Diploma Level)',
    description: 'Hands-on regression, classification, gradient descent, and cross-validation with NumPy and Scikit-learn for Diploma in Data Science.',
    subject: 'Machine Learning',
    teacherName: 'Vikram Malhotra',
    courseCategory: 'LIVE',
    term: 'Diploma',
    examStages: ['Quiz 2', 'End Term'],
    tags: ['Scikit-Learn', 'NumPy', 'Regression'],
    thumbnail: null,
    minPricePaise: 499900,
    offerings: [
      { id: 'off-mlf-live', name: 'Live Weekend Cohort', accessType: 'LIVE', pricePaise: 499900, durationDays: 120 },
    ],
  },
];

export default async function CoursesCatalogPage() {
  const session = await getFullSession();
  const userRole = session?.role || 'STUDENT';

  let dbCourses: CatalogCourse[] = [];

  try {
    const rawCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        isDisabled: false,
      },
      include: {
        offerings: {
          where: { isActive: true },
          orderBy: { pricePaise: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (rawCourses.length > 0) {
      dbCourses = rawCourses.map((c) => {
        const minPrice = c.offerings.length > 0 ? c.offerings[0].pricePaise : 0;
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          subject: c.subject,
          teacherName: c.teacherName,
          courseCategory: c.courseCategory,
          term: c.term,
          examStages: c.examStages,
          tags: c.tags,
          thumbnail: c.thumbnail,
          minPricePaise: minPrice,
          offerings: c.offerings.map((o) => ({
            id: o.id,
            name: o.name,
            accessType: o.accessType,
            pricePaise: o.pricePaise,
            durationDays: o.durationDays,
          })),
        };
      });
    }
  } catch (error) {
    console.warn('[courses-page] Could not query database directly, using demo store or fallbacks:', error);
  }

  // If no DB courses, fall back to demoStore or curated list
  if (dbCourses.length === 0) {
    const storeCourses = demoStore.getCourses();
    if (storeCourses && storeCourses.length > 0) {
      dbCourses = storeCourses.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        subject: c.subject,
        teacherName: c.teacherName,
        courseCategory: c.courseCategory,
        term: c.term,
        examStages: c.examStages || ['Quiz 1', 'Quiz 2', 'End Term'],
        tags: c.tags || ['IITM BS', 'Online'],
        thumbnail: c.thumbnail,
        minPricePaise: c.offerings?.[0]?.pricePaise || 199900,
        offerings: c.offerings || [
          { id: `off-${c.id}-rec`, name: 'Recorded Pack', accessType: 'RECORDED', pricePaise: 199900, durationDays: 120 },
        ],
        topics: c.topics,
      }));
    }
  }

  const initialCourses = dbCourses.length > 0 ? dbCourses : FALLBACK_COURSES;

  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 font-sans selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar />

      {/* Catalog Hero */}
      <section className="bg-gradient-to-b from-[#090d0b] via-stone-950 to-[#090d0b] border-b border-stone-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center md:text-left md:flex md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 mb-3">
              <span>IIT Madras BS Degree Support</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Targeted Academic Courses & Batches
            </h1>
            <p className="mt-2 text-stone-300 text-sm sm:text-base leading-relaxed">
              Designed for Qualifier, Foundation, and Diploma stages. Live doubt-solving, recorded
              concept breakdowns, and exam practice tailored to absolute grading rubrics.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-4 justify-center">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Guaranteed Floor
              </div>
              <div className="text-sm font-bold text-emerald-800 font-mono">
                From ₹1,499 / term
              </div>
            </div>
            <Link
              href="/refer"
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
            >
              <span>Have a referral code? Get 5% OFF</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Catalog Filter & Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseCatalogClient initialCourses={initialCourses} userRole={userRole} />
      </div>
    </div>
  );
}
