'use client';

/**
 * Community Channel Layout Component
 * Module: Student Community (src/components/community/community-channel-layout.tsx)
 *
 * Provides a modern, responsive Slack/Discord-inspired layout:
 * - Left channel rail with all enrolled course communities, active indicator, and full titles without truncation.
 * - Mobile-friendly quick channel drawer.
 * - Right area hosting the active CommunityChat room.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Users, BookOpen, ChevronRight, Hash, Sparkles, ChevronDown } from 'lucide-react';
import { CommunityChat } from './community-chat';

export interface CommunityCourse {
  id: string;
  title: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
  subject?: string | null;
}

interface CommunityChannelLayoutProps {
  courses: CommunityCourse[];
  activeCourse: CommunityCourse;
  currentUserId: string;
  currentUserRole: string;
}

export function CommunityChannelLayout({
  courses,
  activeCourse,
  currentUserId,
  currentUserRole,
}: CommunityChannelLayoutProps) {
  const router = useRouter();
  const [mobileSelectOpen, setMobileSelectOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#7D2F1A] mb-2 font-mono">
            <Users className="w-3.5 h-3.5 text-[#E05A33]" />
            <span>Peer Learning Network</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
            Course Communities
          </h1>
          <p className="text-xs text-[#6B6B66] dark:text-[#9E9D97] mt-1">
            Real-time doubt resolution, coding discussions, and collaborative study groups.
          </p>
        </div>

        {/* Mobile Channel Switcher Dropdown */}
        <div className="md:hidden relative">
          <button
            type="button"
            onClick={() => setMobileSelectOpen(!mobileSelectOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF]"
          >
            <div className="flex items-center gap-2 truncate">
              <Hash className="w-3.5 h-3.5 text-[#E05A33] shrink-0" />
              <span className="truncate">{activeCourse.title}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#8C8C87] shrink-0" />
          </button>

          {mobileSelectOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 p-1.5 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-2xl z-30 space-y-1">
              {courses.map((course) => {
                const isSelected = course.id === activeCourse.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setMobileSelectOpen(false);
                      router.push(`/community?courseId=${course.id}`);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#FDF0EB] text-[#E05A33] font-bold border border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E]'
                        : 'text-[#6B6B66] dark:text-[#9E9D97] hover:bg-[#FAFAF7] dark:hover:bg-[#252522] hover:text-[#1A1A19] dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{course.title}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#E05A33]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Channels Rail + Active Chat */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Desktop Channel Sidebar (4 cols) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-3">
          <div className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs space-y-2">
            <div className="px-3 py-2 flex items-center justify-between border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8C8C87]">
                Course Channels ({courses.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-[#E05A33] animate-pulse" />
            </div>

            <div className="space-y-1.5">
              {courses.map((course) => {
                const isSelected = course.id === activeCourse.id;
                return (
                  <Link
                    key={course.id}
                    href={`/community?courseId=${course.id}`}
                    className={`group block p-3 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-[#FDF0EB] border-[#F5B8A3] text-[#E05A33] dark:bg-[#3A150C] dark:border-[#7D2F1A] dark:text-[#EE8E6E] shadow-xs'
                        : 'bg-[#FAFAF7] dark:bg-[#161615] border-[#E8E6E1] dark:border-[#2D2D2A] text-[#6B6B66] dark:text-[#9E9D97] hover:bg-white dark:hover:bg-[#20201D] hover:border-[#E05A33]/40 hover:text-[#1A1A19] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#E05A33] text-white'
                            : 'bg-[#E8E6E1] dark:bg-[#2D2D2A] text-[#6B6B66] dark:text-[#9E9D97]'
                        }`}
                      >
                        #
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-snug line-clamp-2">
                          {course.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-[#8C8C87]">
                            {course.subject || 'Academic Cohort'}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white dark:bg-[#1C1C1A] text-[#E05A33] border border-[#F5B8A3] dark:border-[#7D2F1A]">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Chat Column (8 cols on md, 9 cols on lg) */}
        <div className="md:col-span-8 lg:col-span-9">
          <CommunityChat
            courseId={activeCourse.id}
            courseTitle={activeCourse.title}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
    </div>
  );
}
