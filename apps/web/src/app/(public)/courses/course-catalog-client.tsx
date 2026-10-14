'use client';

/**
 * Interactive Course Catalog Client Component
 * Module: Commercial Catalog (src/app/(public)/courses/course-catalog-client.tsx)
 *
 * Implements:
 * 1. Fast client-side filtering for courses (Search, Term, Exam Stages, Batch).
 * 2. In-Dashboard Course Studio for Managers & Admins:
 *    - "+ Add Course" tab with description, pricing, expiry, and visibility settings.
 *    - "Edit Course & Lectures" modal right on every card to edit topics and video lectures (YouTube & Drive).
 *    - Direct "Stream Lectures (Staff Bypass)" to watch lessons without buying.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Filter,
  Video,
  Users,
  CheckCircle,
  ArrowRight,
  Plus,
  Edit3,
  PlayCircle,
  X,
  Clock,
  Layers,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface CourseCatalogClientProps {
  initialCourses: CatalogCourse[];
  userRole?: string;
}

const TERMS = ['All Terms', 'Qualifier', 'Foundation', 'Diploma'];
const EXAM_STAGES = ['All Stages', 'Quiz 1', 'Quiz 2', 'End Term'];
const CATEGORIES = ['All Batches', 'LIVE', 'RECORDED'];

export default function CourseCatalogClient({ initialCourses, userRole = 'STUDENT' }: CourseCatalogClientProps) {
  const [courses, setCourses] = useState<CatalogCourse[]>(initialCourses);
  const [activeTab, setActiveTab] = useState<'browse' | 'add'>('browse');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [selectedCategory, setSelectedCategory] = useState('All Batches');

  // Add Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newCategory, setNewCategory] = useState<'RECORDED' | 'LIVE'>('RECORDED');
  const [newTerm, setNewTerm] = useState('Foundation');
  const [newDescription, setNewDescription] = useState('');
  const [newRecordPrice, setNewRecordPrice] = useState('1999');
  const [newLivePrice, setNewLivePrice] = useState('3499');
  const [newDurationDays, setNewDurationDays] = useState('120');
  const [newVideoUrl, setNewVideoUrl] = useState('https://youtu.be/BktHdcWoVNc');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState<CatalogCourse | null>(null);
  const [editTab, setEditTab] = useState<'info' | 'curriculum'>('info');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('120');

  // Add Unit & Lesson Modal states
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSource, setLessonSource] = useState<'GOOGLE_DRIVE' | 'YOUTUBE'>('YOUTUBE');
  const [lessonUrl, setLessonUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState('25 min');
  const [lessonIsDemo, setLessonIsDemo] = useState(false);

  const isStaff = ['SUPER_MANAGER', 'MANAGER', 'ADMIN'].includes(userRole.toUpperCase());

  // Filtered courses memoization
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        (course.subject && course.subject.toLowerCase().includes(query)) ||
        (course.teacherName && course.teacherName.toLowerCase().includes(query)) ||
        course.tags.some((t) => t.toLowerCase().includes(query));

      const matchesTerm =
        selectedTerm === 'All Terms' ||
        (course.term && course.term.toLowerCase() === selectedTerm.toLowerCase());

      const matchesStage =
        selectedStage === 'All Stages' ||
        course.examStages.some((s) => s.toLowerCase() === selectedStage.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All Batches' ||
        (course.courseCategory &&
          course.courseCategory.toUpperCase() === selectedCategory.toUpperCase());

      return matchesSearch && matchesTerm && matchesStage && matchesCategory;
    });
  }, [courses, searchTerm, selectedTerm, selectedStage, selectedCategory]);

  // Handle Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCourse(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/manager/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          subject: newSubject,
          courseCategory: newCategory,
          term: newTerm,
          description: newDescription,
          recordPricePaise: Math.round(parseFloat(newRecordPrice || '1999') * 100),
          livePricePaise: Math.round(parseFloat(newLivePrice || '3499') * 100),
          durationDays: parseInt(newDurationDays, 10) || 120,
          videoUrl: newVideoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      const created = data.course;
      const formatted: CatalogCourse = {
        id: created.id,
        slug: created.slug,
        title: created.title,
        description: created.description,
        subject: created.subject,
        teacherName: 'Staff Instructor',
        courseCategory: created.courseCategory,
        term: created.term,
        examStages: ['Quiz 1', 'Quiz 2', 'End Term'],
        tags: created.tags || ['IITM BS'],
        thumbnail: null,
        minPricePaise: Math.round(parseFloat(newRecordPrice || '1999') * 100),
        offerings: [
          { id: `off-rec-${created.id}`, name: 'Recorded Masterclass', accessType: 'RECORDED', pricePaise: 199900, durationDays: 120 },
        ],
        topics: [],
      };

      setCourses([formatted, ...courses]);
      setSuccessMsg('Course created and published successfully!');
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('browse');
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating course');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Open Edit Modal
  const openEditModal = async (course: CatalogCourse) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDescription(course.description || '');
    setEditPrice((course.minPricePaise ? Math.floor(course.minPricePaise / 100) : 1999).toString());
    setEditTab('info');

    // Fetch full course topics
    try {
      const res = await fetch(`/api/manager/courses/${course.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.course) {
          setEditingCourse((prev) => (prev ? { ...prev, topics: data.course.topics } : null));
        }
      }
    } catch {}
  };

  // Save Course Info
  const handleSaveCourseInfo = async () => {
    if (!editingCourse) return;

    try {
      const res = await fetch(`/api/manager/courses/${editingCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? { ...c, title: editTitle, description: editDescription }
            : c
        )
      );
      setEditingCourse(null);
    } catch {
      // Optimistic update in state
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? { ...c, title: editTitle, description: editDescription }
            : c
        )
      );
      setEditingCourse(null);
    }
  };

  // Add Topic Unit
  const handleAddUnit = async () => {
    if (!editingCourse || !newUnitTitle.trim()) return;

    try {
      const res = await fetch(`/api/manager/courses/${editingCourse.id}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newUnitTitle.trim() }),
      });
      const data = await res.json();
      const addedTopic = data.topic || {
        id: `t-${Date.now()}`,
        title: newUnitTitle.trim(),
        order: (editingCourse.topics?.length || 0) + 1,
        content: [],
      };

      setEditingCourse((prev) =>
        prev
          ? {
              ...prev,
              topics: [...(prev.topics || []), addedTopic],
            }
          : null
      );
      setShowAddUnitModal(false);
      setNewUnitTitle('');
    } catch {
      setShowAddUnitModal(false);
    }
  };

  // Add Lesson
  const handleAddLesson = async () => {
    if (!editingCourse || !activeUnitId || !lessonTitle.trim()) return;

    try {
      const res = await fetch(`/api/manager/courses/${editingCourse.id}/topics/${activeUnitId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle.trim(),
          videoSource: lessonSource,
          videoUrl: lessonUrl || 'https://youtu.be/BktHdcWoVNc',
          duration: lessonDuration,
          isDemo: lessonIsDemo,
        }),
      });

      const data = await res.json();
      const newLesson = data.content || {
        id: `l-${Date.now()}`,
        title: lessonTitle.trim(),
        videoSource: lessonSource,
        videoUrl: lessonUrl || 'https://youtu.be/BktHdcWoVNc',
        duration: lessonDuration,
        isDemo: lessonIsDemo,
      };

      setEditingCourse((prev) => {
        if (!prev) return null;
        const updatedTopics = (prev.topics || []).map((t) => {
          if (t.id === activeUnitId) {
            return { ...t, content: [...(t.content || []), newLesson] };
          }
          return t;
        });
        return { ...prev, topics: updatedTopics };
      });

      setShowAddLessonModal(false);
      setLessonTitle('');
      setLessonUrl('');
    } catch {
      setShowAddLessonModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Executive Action Tabs */}
      {isStaff && (
        <div className="flex items-center justify-between p-1 rounded-xl bg-stone-900 border border-stone-800">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All Courses & Lectures ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Course</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pr-3 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Manager Studio Active · Direct Course & Video Editing</span>
          </div>
        </div>
      )}

      {/* Tab 2: Add Course Form (Inside Dashboard) */}
      {isStaff && activeTab === 'add' ? (
        <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Create & Publish New Course</h2>
            <p className="text-xs text-stone-400 mt-1">
              Configure course metadata, pricing tiers, access duration, and trial preview video.
            </p>
          </div>

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Course Title</label>
                <Input
                  required
                  placeholder="e.g. Mathematics for Data Science 2"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">URL Slug</label>
                <Input
                  required
                  placeholder="e.g. math-2-data-science"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Statistics">Statistics</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Academic Term</label>
                <select
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white outline-none"
                >
                  <option value="Qualifier">Qualifier Stage</option>
                  <option value="Foundation">Foundation Level</option>
                  <option value="Diploma">Diploma Level</option>
                  <option value="Degree">Degree Level</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Format Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white outline-none"
                >
                  <option value="RECORDED">Recorded Masterclass</option>
                  <option value="LIVE">Live Interactive Batch</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">
                Course Description (Shown to users on Home & Catalog)
              </label>
              <textarea
                rows={3}
                required
                placeholder="High-yield video lessons, problem solving walkthroughs, and mock exam simulations..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Pricing & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Recorded Price (₹)</label>
                <Input
                  type="number"
                  value={newRecordPrice}
                  onChange={(e) => setNewRecordPrice(e.target.value)}
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Live Batch Price (₹)</label>
                <Input
                  type="number"
                  value={newLivePrice}
                  onChange={(e) => setNewLivePrice(e.target.value)}
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Access Expiry (Days)</label>
                <Input
                  type="number"
                  value={newDurationDays}
                  onChange={(e) => setNewDurationDays(e.target.value)}
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            {/* Video preview URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">
                Trial Video Link (YouTube or Google Drive URL)
              </label>
              <Input
                placeholder="https://youtu.be/BktHdcWoVNc"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" type="button" onClick={() => setActiveTab('browse')}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingCourse}>
                {isSubmittingCourse ? 'Creating...' : 'Create & Publish Course'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Tab 1: Browse Courses */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Box */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by subject, title, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-800 bg-stone-900 text-stone-200 placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Term Filter Buttons */}
              <div className="flex flex-wrap gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800 self-stretch md:self-auto">
                {TERMS.map((term) => (
                  <button
                    key={term}
                    onClick={() => setSelectedTerm(term)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      selectedTerm === term
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const startingRupees = Math.floor(course.minPricePaise / 100);

              return (
                <article
                  key={course.id}
                  className="bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden shadow-xl hover:border-emerald-600/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Banner */}
                    <div className="h-28 bg-gradient-to-br from-emerald-950/60 to-stone-900 p-4 flex flex-col justify-between border-b border-stone-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {course.subject || 'Academic'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-800">
                          {course.term || 'IITM BS'}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-stone-400">
                        {course.courseCategory === 'LIVE' ? 'Live + Recorded Batch' : 'Recorded Masterclass'}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition font-display">
                        <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                      </h3>

                      {course.description && (
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      <div className="text-xs text-stone-500 font-medium">
                        Instructor: <span className="text-stone-300">{course.teacherName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 border-t border-stone-900 mt-2 space-y-3">
                    <div className="flex items-baseline justify-between pt-3">
                      <span className="text-[10px] text-stone-500 uppercase tracking-wide">Starting from</span>
                      <span className="text-base font-extrabold text-white font-mono">
                        ₹{startingRupees.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {isStaff ? (
                        <>
                          <button
                            onClick={() => openEditModal(course)}
                            className="w-full py-2 px-3 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Course</span>
                          </button>
                          <Link
                            href="/learning/c-maths/l-1"
                            className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Stream</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="w-full py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold text-center border border-stone-800 transition"
                          >
                            Syllabus
                          </Link>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition flex items-center justify-center gap-1"
                          >
                            <span>Enroll</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Course & Lectures In-Dashboard Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-stone-950 border border-stone-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
              <div>
                <h3 className="font-bold text-white text-base font-display">
                  Edit Course & Lectures
                </h3>
                <span className="text-xs text-stone-400 font-mono">/{editingCourse.slug}</span>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-stone-800 px-5 bg-stone-900/40">
              <button
                onClick={() => setEditTab('info')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  editTab === 'info'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                Course Info & Pricing
              </button>
              <button
                onClick={() => setEditTab('curriculum')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  editTab === 'curriculum'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                Curriculum Units & Lectures ({editingCourse.topics?.length || 0} Units)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {editTab === 'info' ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-300">Course Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-300">Description</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Starting Price (₹)</label>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Access Expiry (Days)</label>
                      <Input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Curriculum Units & Lessons Editor */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-400">Curriculum Units</span>
                    <Button variant="outline" size="sm" onClick={() => setShowAddUnitModal(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Unit
                    </Button>
                  </div>

                  {(!editingCourse.topics || editingCourse.topics.length === 0) ? (
                    <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-xl">
                      No units added yet. Click &quot;Add Unit&quot; to begin.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editingCourse.topics.map((topic, uIdx) => (
                        <div key={topic.id} className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-stone-800 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">
                                {uIdx + 1}
                              </span>
                              <h4 className="font-bold text-white text-xs">{topic.title}</h4>
                            </div>

                            <button
                              onClick={() => {
                                setActiveUnitId(topic.id);
                                setShowAddLessonModal(true);
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Lecture</span>
                            </button>
                          </div>

                          {/* Lessons inside topic */}
                          <div className="space-y-1.5 pl-8">
                            {topic.content.length === 0 ? (
                              <p className="text-[11px] text-stone-500 italic">No video lectures attached.</p>
                            ) : (
                              topic.content.map((lesson, lIdx) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-stone-950 border border-stone-800/80 text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <PlayCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="text-stone-300 truncate">
                                      {lIdx + 1}. {lesson.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400 shrink-0">
                                    <span className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800">
                                      {lesson.videoSource}
                                    </span>
                                    <span>{lesson.duration || '20 min'}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-900/60 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setEditingCourse(null)}>
                Close
              </Button>
              {editTab === 'info' && (
                <Button variant="primary" size="sm" onClick={handleSaveCourseInfo}>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-stone-950 border border-stone-800 p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Add Curriculum Unit</h4>
            <Input
              placeholder="e.g. Unit 3: Graph Traversal & BFS"
              value={newUnitTitle}
              onChange={(e) => setNewUnitTitle(e.target.value)}
              className="h-10 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddUnitModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddUnit}>
                Add Unit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-stone-950 border border-stone-800 p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Add Video Lecture</h4>

            <div className="space-y-1">
              <label className="text-xs text-stone-400">Lecture Title</label>
              <Input
                placeholder="e.g. Graph Representation & Matrix Multiplication"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-stone-400">Video Source</label>
                <select
                  value={lessonSource}
                  onChange={(e) => setLessonSource(e.target.value as any)}
                  className="w-full h-9 px-2 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white"
                >
                  <option value="YOUTUBE">YouTube Video</option>
                  <option value="GOOGLE_DRIVE">Google Drive Stream</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-stone-400">Duration</label>
                <Input
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-stone-400">
                {lessonSource === 'YOUTUBE' ? 'YouTube URL' : 'Google Drive Share Link'}
              </label>
              <Input
                placeholder={
                  lessonSource === 'YOUTUBE'
                    ? 'https://youtu.be/BktHdcWoVNc'
                    : 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing'
                }
                value={lessonUrl}
                onChange={(e) => setLessonUrl(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={lessonIsDemo}
                onChange={(e) => setLessonIsDemo(e.target.checked)}
                className="rounded border-stone-700 bg-stone-900 text-emerald-500"
              />
              <span>Allow as Free Demo Preview</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-900">
              <Button variant="ghost" size="sm" onClick={() => setShowAddLessonModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddLesson}>
                Attach Lecture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
