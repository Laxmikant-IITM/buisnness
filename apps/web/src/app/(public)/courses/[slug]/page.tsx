/**
 * Course Detail Page
 * Module: Commercial Catalog (src/app/(public)/courses/[slug]/page.tsx)
 *
 * Server-rendered course profile page fetching structured syllabus topics, lectures,
 * and commercial offerings (RECORDED, LIVE) with fallback catalog support.
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SiteNavbar } from '@/components/layout/site-navbar';
import CourseDetailClient, {
  type DetailTopic,
  type DetailOffering,
} from './course-detail-client';

import { getFullSession } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';

interface PageProps {
  params: { slug: string };
}

// Fallback topic and curriculum data when running without seeded database
const FALLBACK_TOPICS: DetailTopic[] = [
  {
    id: 't-1',
    title: 'Unit 1: Fundamentals & Algorithmic Problem Tracing',
    order: 1,
    lessons: [
      { id: 'l-1', title: 'Course Orientation & Absolute Grading Criteria', duration: 1200, order: 1, isDemo: true },
      { id: 'l-2', title: 'Flowcharts, Conditional Branches, and Iteration Loops', duration: 2400, order: 2 },
      { id: 'l-3', title: 'Pseudocode Dry-Running on Typical Past Papers', duration: 2100, order: 3 },
    ],
  },
  {
    id: 't-2',
    title: 'Unit 2: Core Data Structures & Functional Abstraction',
    order: 2,
    lessons: [
      { id: 'l-4', title: 'Lists, Tuples, Dictionaries, and Complexity Analysis', duration: 2800, order: 1 },
      { id: 'l-5', title: 'Recursive Function Calls & Call Stack Simulation', duration: 2500, order: 2 },
      { id: 'l-6', title: 'Week 4 Graded Assignment Detailed Walkthrough', duration: 1800, order: 3 },
    ],
  },
  {
    id: 't-3',
    title: 'Unit 3: Quiz 1 & Quiz 2 Mock Exam Solving',
    order: 3,
    lessons: [
      { id: 'l-7', title: 'Timed Mock Quiz 1: Speed Strategies & Trap Questions', duration: 3600, order: 1 },
      { id: 'l-8', title: 'High-Weightage Matrix & Graph Problem Sets', duration: 3200, order: 2 },
    ],
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { title: true, description: true },
    });
    if (course) {
      return {
        title: `${course.title} | IITM BS Courses`,
        description: course.description || undefined,
      };
    }
  } catch {}

  const humanTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${humanTitle} | IITM BS Prep`,
    description: `Comprehensive syllabus, live doubt sessions, and exam series for ${humanTitle}.`,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = params;
  const session = await getFullSession();
  const userRole = session?.role || 'STUDENT';

  let dbCourse = null;
  try {
    dbCourse = await prisma.course.findUnique({
      where: { slug },
      include: {
        offerings: {
          where: { isActive: true },
          orderBy: { pricePaise: 'asc' },
        },
        topics: {
          orderBy: { order: 'asc' },
          include: {
            content: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  } catch (error) {
    console.warn('[course-detail] Could not fetch course from DB, using fallback:', error);
  }

  // If not found in DB, check demoStore
  if (!dbCourse) {
    const storeCourse = demoStore.getCourses().find((c: any) => c.slug === slug || c.id === slug);
    if (storeCourse) {
      dbCourse = {
        ...storeCourse,
        offerings: storeCourse.offerings || [],
        topics: storeCourse.topics || [],
      };
    }
  }

  // If not found in DB or demoStore, provide high quality fallback so the user can test the UI smoothly
  const courseData = dbCourse
    ? {
        id: dbCourse.id,
        slug: dbCourse.slug,
        title: dbCourse.title,
        description: dbCourse.description,
        subject: dbCourse.subject,
        teacherName: dbCourse.teacherName,
        courseCategory: dbCourse.courseCategory,
        term: dbCourse.term,
        examStages: dbCourse.examStages || ['Quiz 1', 'Quiz 2', 'End Term'],
        videoUrl: dbCourse.videoUrl,
        tags: dbCourse.tags || ['IITM BS'],
        liveUpgradePrice: dbCourse.liveUpgradePrice,
      }
    : {
        id: `mock-${slug}`,
        slug,
        title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description:
          'Structured video lessons, live interactive problem-solving batches, and assignment walkthroughs tailored for IIT Madras BS Degree absolute grading cutoffs.',
        subject: 'Computer Science & Mathematics',
        teacherName: 'Prof. Anirudh Sharma',
        courseCategory: 'LIVE',
        term: 'Qualifier / Foundation',
        examStages: ['Quiz 1', 'Quiz 2', 'End Term'],
        videoUrl: null,
        tags: ['IITM BS', 'Qualifier', 'Live Batch'],
        liveUpgradePrice: 150000,
      };

  const offeringsData: DetailOffering[] =
    dbCourse && dbCourse.offerings && dbCourse.offerings.length > 0
      ? dbCourse.offerings.map((o: any) => ({
          id: o.id,
          name: o.name,
          accessType: o.accessType,
          pricePaise: o.pricePaise,
          durationDays: o.durationDays,
        }))
      : [
          {
            id: `off-rec-${slug}`,
            name: 'Recorded Masterclass',
            accessType: 'RECORDED',
            pricePaise: 199900,
            durationDays: 120,
          },
          {
            id: `off-live-${slug}`,
            name: 'Live Interactive Batch',
            accessType: 'LIVE',
            pricePaise: 349900,
            durationDays: 120,
          },
        ];

  const topicsData: DetailTopic[] =
    dbCourse && dbCourse.topics && dbCourse.topics.length > 0
      ? dbCourse.topics.map((t: any) => ({
          id: t.id,
          title: t.title,
          order: t.order,
          lessons: (t.content || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            duration: c.duration,
            order: c.order,
            isDemo: Boolean(c.isDemo),
          })),
        }))
      : FALLBACK_TOPICS;

  return (
    <div className="min-h-screen bg-[#f8f9f5] text-[#1e2722]">
      {/* Unified Site Navbar */}
      <SiteNavbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseDetailClient
          course={courseData}
          topics={topicsData}
          offerings={offeringsData}
          userRole={userRole}
        />
      </main>
    </div>
  );
}
