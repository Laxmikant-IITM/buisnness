/**
 * @file apps/web/src/app/manager/courses/page.tsx
 * @description Manager Course Studio: Create and manage courses, curriculum topics, and video lessons.
 */

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface Offering {
  id: string;
  name: string;
  accessType: string;
  pricePaise: number;
  isActive: boolean;
}

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  subject: string | null;
  academicTerm: string | null;
  term: string | null;
  courseCategory: string | null;
  liveUpgradePrice: number | null;
  demoPrice: number | null;
  videoUrl: string | null;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    topics: number;
    enrollments: number;
    quizzes: number;
    materials: number;
  };
  offerings: Offering[];
}

interface LessonContent {
  id: string;
  title: string;
  videoSource: string;
  videoUrl: string | null;
  youtubeUrl: string | null;
  duration: string | null;
  isDemo: boolean;
  order: number;
}

interface TopicItem {
  id: string;
  title: string;
  order: number;
  content: LessonContent[];
}

interface CourseDetail extends CourseItem {
  topics: TopicItem[];
}

export default function ManagerCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Course Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newCategory, setNewCategory] = useState<'RECORDED' | 'LIVE' | 'QUALIFIER'>('RECORDED');
  const [newTerm, setNewTerm] = useState('Foundation');
  const [newRecordPrice, setNewRecordPrice] = useState('2999');
  const [newLivePrice, setNewLivePrice] = useState('4999');

  // Selected Course Curriculum Management
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);

  // Add Lesson Modal
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSource, setLessonSource] = useState<'GOOGLE_DRIVE' | 'YOUTUBE'>('GOOGLE_DRIVE');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState('20 min');
  const [lessonIsDemo, setLessonIsDemo] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await fetch('/api/manager/courses');
      if (!res.ok) throw new Error('Failed to load courses');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error loading courses' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function openCourseDetail(courseId: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/manager/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to load course details');
      const data = await res.json();
      setSelectedCourse(data.course);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error loading details' });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/manager/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug.toLowerCase().trim(),
          subject: newSubject,
          courseCategory: newCategory,
          term: newTerm,
          recordPricePaise: Math.round(parseFloat(newRecordPrice || '0') * 100),
          livePricePaise: Math.round(parseFloat(newLivePrice || '0') * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      setToastMessage({ type: 'success', text: 'Course created successfully!' });
      setShowCreateModal(false);
      setNewTitle('');
      setNewSlug('');
      fetchCourses();
      if (data.course?.id) {
        openCourseDetail(data.course.id);
      }
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error creating course' });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(courseId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/manager/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update course status');
      setToastMessage({ type: 'success', text: `Course status changed to ${nextStatus}` });
      fetchCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse({ ...selectedCourse, status: nextStatus });
      }
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    }
  }

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    setAddingTopic(true);
    try {
      const res = await fetch(`/api/manager/courses/${selectedCourse.id}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTopicTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add topic module');

      setToastMessage({ type: 'success', text: 'Module topic added!' });
      setShowAddTopicModal(false);
      setNewTopicTitle('');
      openCourseDetail(selectedCourse.id);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Add topic error' });
    } finally {
      setAddingTopic(false);
    }
  }

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse || !activeTopicId) return;
    setAddingLesson(true);
    try {
      const res = await fetch(`/api/manager/courses/${selectedCourse.id}/topics/${activeTopicId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          videoSource: lessonSource,
          videoUrl: lessonSource === 'GOOGLE_DRIVE' ? lessonVideoUrl : null,
          youtubeUrl: lessonSource === 'YOUTUBE' ? lessonVideoUrl : null,
          duration: lessonDuration,
          isDemo: lessonIsDemo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add lesson content');

      setToastMessage({ type: 'success', text: 'Lesson content added!' });
      setShowAddLessonModal(false);
      setLessonTitle('');
      setLessonVideoUrl('');
      openCourseDetail(selectedCourse.id);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Add lesson error' });
    } finally {
      setAddingLesson(false);
    }
  }

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/manager" className="text-emerald-400 hover:text-emerald-300 text-xs font-mono uppercase tracking-wider">
              ← Workspace Dashboard
            </Link>
            <span className="text-stone-600">/</span>
            <span className="text-stone-400 text-xs font-mono uppercase tracking-wider">Course Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Course Studio <Badge variant="brand">Manager Suite</Badge>
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Author and orchestrate courses, curriculum modules, Google Drive/YouTube video lectures, and live offerings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/manager/exams">
            <Button variant="outline" size="sm">Exam Ops ↗</Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + New Course
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Course Directory */}
        <section className={`space-y-4 ${selectedCourse ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search courses or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
              {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === st ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-stone-500">Loading courses...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center bg-stone-950 border-stone-800 text-stone-400">
              <p className="font-semibold text-white mb-1">No courses found</p>
              <p className="text-sm">Create a new course to launch into your academy catalog.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                + Create Course
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <Card
                    key={c.id}
                    className={`p-4 bg-stone-950 border transition-all cursor-pointer hover:border-emerald-500/50 ${
                      isSelected ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-stone-800'
                    }`}
                    onClick={() => openCourseDetail(c.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={c.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                            {c.status}
                          </Badge>
                          <span className="text-xs text-stone-500 font-mono">/{c.slug}</span>
                        </div>
                        <h3 className="font-bold text-white text-base leading-snug">{c.title}</h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-1">{c.subject || 'General'} · {c.term || 'All Terms'}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(c.id, c.status);
                        }}
                        className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
                          c.status === 'PUBLISHED'
                            ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/50'
                            : 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/50'
                        }`}
                      >
                        {c.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-900 flex items-center justify-between text-xs text-stone-400 font-mono">
                      <span>{c._count.topics} Modules</span>
                      <span>{c._count.enrollments} Students</span>
                      <span>₹{((c.offerings[0]?.pricePaise ?? 0) / 100).toLocaleString('en-IN')}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Course Curriculum & Content Studio */}
        {selectedCourse && (
          <section className="lg:col-span-7 space-y-6">
            <Card className="p-6 bg-stone-950 border-stone-800">
              <div className="flex items-start justify-between pb-4 border-b border-stone-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={selectedCourse.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {selectedCourse.status}
                    </Badge>
                    <span className="text-xs text-stone-400 font-mono">ID: {selectedCourse.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedCourse.title}</h2>
                  <p className="text-xs text-stone-400 mt-1">Slug: <span className="font-mono text-emerald-400">/{selectedCourse.slug}</span></p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/courses/${selectedCourse.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300"
                  >
                    View Storefront ↗
                  </a>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="text-stone-500 hover:text-white p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Curriculum Topics List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-base">Curriculum Modules & Lessons</h3>
                  <Button variant="primary" size="sm" onClick={() => setShowAddTopicModal(true)}>
                    + Add Module
                  </Button>
                </div>

                {loadingDetail ? (
                  <div className="py-12 text-center text-stone-500">Loading curriculum...</div>
                ) : selectedCourse.topics.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-stone-800 rounded-lg text-stone-500">
                    No curriculum modules yet. Add Module 1 to begin authoring lessons.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCourse.topics.map((topic, idx) => (
                      <div key={topic.id} className="border border-stone-800 rounded-lg bg-stone-900/60 overflow-hidden">
                        <div className="p-3 bg-stone-900 flex items-center justify-between border-b border-stone-800">
                          <span className="font-semibold text-sm text-stone-200">
                            {idx + 1}. {topic.title}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 h-7"
                            onClick={() => {
                              setActiveTopicId(topic.id);
                              setShowAddLessonModal(true);
                            }}
                          >
                            + Add Lesson
                          </Button>
                        </div>

                        {topic.content.length === 0 ? (
                          <div className="p-4 text-xs text-stone-500 text-center">
                            No lessons attached. Click "+ Add Lesson" to attach Google Drive video or YouTube class.
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-800/50">
                            {topic.content.map((lesson, lIdx) => (
                              <div key={lesson.id} className="p-3 flex items-center justify-between text-xs hover:bg-stone-800/30">
                                <div className="flex items-center gap-3">
                                  <span className="text-stone-500 font-mono">{idx + 1}.{lIdx + 1}</span>
                                  <div>
                                    <span className="font-medium text-stone-200">{lesson.title}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                                        {lesson.videoSource}
                                      </span>
                                      {lesson.isDemo && (
                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                          FREE PREVIEW
                                        </span>
                                      )}
                                      <span className="text-stone-500 text-[11px]">{lesson.duration || '15 min'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-stone-500 font-mono text-[11px] truncate max-w-[140px]">
                                  {lesson.videoUrl || lesson.youtubeUrl || 'No URL'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Offerings Snapshot */}
              <div className="mt-8 pt-6 border-t border-stone-800">
                <h4 className="font-bold text-sm text-stone-300 mb-3">Commercial Offerings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCourse.offerings.map((offering) => (
                    <div key={offering.id} className="p-3 rounded border border-stone-800 bg-stone-900/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-white">{offering.accessType}</span>
                        <Badge variant="brand">₹{(offering.pricePaise / 100).toLocaleString('en-IN')}</Badge>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">{offering.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>

      {/* Modal: Create Course */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Course Title</label>
            <Input
              required
              placeholder="e.g. Mathematics for Data Science I"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) {
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">URL Slug</label>
            <Input
              required
              placeholder="e.g. math-data-science-1"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
            <span className="text-[11px] text-stone-500 font-mono">Accessible at: /courses/{newSlug || 'slug'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Subject</label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Academic Stage</label>
              <select
                className="w-full bg-stone-900 border border-stone-700 rounded-md p-2 text-sm text-stone-100"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
              >
                <option value="Qualifier">Qualifier</option>
                <option value="Foundation">Foundation</option>
                <option value="Diploma">Diploma</option>
                <option value="Degree">Degree</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Recorded Price (₹)</label>
              <Input
                type="number"
                value={newRecordPrice}
                onChange={(e) => setNewRecordPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Live Batch Price (₹)</label>
              <Input
                type="number"
                value={newLivePrice}
                onChange={(e) => setNewLivePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Topic */}
      <Modal
        isOpen={showAddTopicModal}
        onClose={() => setShowAddTopicModal(false)}
        title="Add Curriculum Module"
      >
        <form onSubmit={handleAddTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Module Title</label>
            <Input
              required
              placeholder="e.g. Module 2: Functions and Continuity"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <Button variant="outline" type="button" onClick={() => setShowAddTopicModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={addingTopic}>
              {addingTopic ? 'Adding...' : 'Add Module'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Lesson Content */}
      <Modal
        isOpen={showAddLessonModal}
        onClose={() => setShowAddLessonModal(false)}
        title="Add Lesson Content"
      >
        <form onSubmit={handleAddLesson} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Lesson Title</label>
            <Input
              required
              placeholder="e.g. Lesson 2.1: Limits of Rational Functions"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Video Source</label>
              <select
                className="w-full bg-stone-900 border border-stone-700 rounded-md p-2 text-sm text-stone-100"
                value={lessonSource}
                onChange={(e) => setLessonSource(e.target.value as any)}
              >
                <option value="GOOGLE_DRIVE">Google Drive File ID</option>
                <option value="YOUTUBE">YouTube Video URL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Duration</label>
              <Input
                placeholder="e.g. 25 min"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {lessonSource === 'GOOGLE_DRIVE' ? 'Google Drive Video File ID' : 'YouTube URL'}
            </label>
            <Input
              placeholder={lessonSource === 'GOOGLE_DRIVE' ? 'e.g. 1a2b3c4d5e6f7g8h9' : 'https://youtube.com/watch?v=...'}
              value={lessonVideoUrl}
              onChange={(e) => setLessonVideoUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDemo"
              checked={lessonIsDemo}
              onChange={(e) => setLessonIsDemo(e.target.checked)}
              className="rounded bg-stone-900 border-stone-700 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="isDemo" className="text-xs text-stone-300">
              Make Free Preview / Demo Lesson (accessible without paid enrollment)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <Button variant="outline" type="button" onClick={() => setShowAddLessonModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={addingLesson}>
              {addingLesson ? 'Adding...' : 'Attach Lesson'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
              : 'bg-red-950 border-red-800 text-red-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white text-xs ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
