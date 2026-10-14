'use client';

/**
 * Sidebar Navigation Component
 * Module: Layout Components (src/components/layout/sidebar.tsx)
 *
 * Unified responsive navigation sidebar for the LMS SaaS shell.
 * - Warm editorial aesthetic: Light cream/white surface, clean borders, terracotta accents.
 * - Dynamic role-gated navigation: strictly separates Super Manager, Manager, Admin, Instructor, and Student.
 * - Same visual layout and design for every role with clear permission boundaries.
 * - User Profile & Quick Settings card with 1-click Sign Out.
 * - Zero raw emojis: clean Lucide SVG icons.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Video,
  Calendar,
  FileCheck,
  HelpCircle,
  Calculator,
  Library,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Coins,
  Code2,
  Sliders,
  User,
  Settings,
  LogOut,
  FolderPlus,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface SidebarProps {
  /** Role to dynamically filter permitted options */
  userRole?: string;
  /** User name for bottom profile card */
  userName?: string;
  /** Optional external control for collapsed state */
  isCollapsed?: boolean;
  /** Callback fired when collapse state toggles */
  onToggleCollapse?: (collapsed: boolean) => void;
  /** Additional custom class names */
  className?: string;
}

/**
 * Main application sidebar component.
 */
export function Sidebar({
  userRole = 'STUDENT',
  userName = 'Learner',
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = '',
}: SidebarProps) {
  const pathname = usePathname() || '';
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const role = (userRole || 'STUDENT').toUpperCase();
  const isSuperManager = role === 'SUPER_MANAGER';
  const isManager = role === 'MANAGER' || isSuperManager;
  const isAdmin = role === 'ADMIN' || isManager;
  const isInstructor = role === 'INSTRUCTOR';
  const isStudent = role === 'STUDENT';

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setInternalCollapsed(nextState);
    onToggleCollapse?.(nextState);
  };

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/app';
    }
    if (href === '/courses') {
      return pathname === '/courses' || pathname.startsWith('/courses/');
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-in';
    }
  };

  // Build curriculum items by role
  const curriculumItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      title: isInstructor ? 'Assigned Courses' : 'Courses & Lectures',
      href: '/courses',
      icon: BookOpen,
    },
    ...(isAdmin ? [{ title: 'Course Studio', href: '/manager/courses', icon: FolderPlus }] : []),
    { title: 'Live Classes', href: '/live', icon: Video, badge: 'LIVE' },
    ...(!isInstructor
      ? [
          { title: 'Proctored Exams', href: '/exams', icon: ShieldCheck, badge: 'MOCK' },
          { title: 'Practice Papers', href: '/papers', icon: FileText },
        ]
      : []),
    { title: 'Community Chat', href: '/community', icon: MessageSquare },
    { title: 'Academic Calendar', href: '/calendar', icon: Calendar },
  ];

  // Instructor specific desk
  const instructorItems: NavItem[] = [
    { title: 'Homework Review Desk', href: '/homework', icon: FileCheck },
    { title: 'Student Helpdesk', href: '/support', icon: HelpCircle },
  ];

  // Management & Ops items (only Managers and Super Managers)
  const managementItems: NavItem[] = [
    ...(isSuperManager
      ? [{ title: 'User & Staff Directory', href: '/manager/users', icon: Users, badge: 'ROOT' }]
      : []),
    { title: 'Exam Operations', href: '/manager/exams', icon: ShieldCheck, badge: 'PROCTOR' },
    { title: 'Operations Console', href: '/manager', icon: Library },
  ];

  // Academic learner toolkit (Students and Super Managers)
  const learnerToolkit: NavItem[] = [
    { title: 'Homework Desk', href: '/homework', icon: FileCheck },
    { title: 'Grade Predictor', href: '/tools', icon: Calculator, badge: 'IITM' },
    { title: '1:1 Mentorship', href: '/one-to-one', icon: Users },
    { title: 'Coding Sandbox', href: '/ide/1', icon: Code2 },
    { title: 'Refer & Earn', href: '/refer', icon: Coins, badge: '5%' },
    { title: 'Help & Support', href: '/support', icon: HelpCircle },
  ];

  const renderSection = (sectionTitle: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="py-2">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
            {sectionTitle}
          </div>
        )}
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={[
                    'group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E05A33]',
                    active
                      ? 'bg-[#FDF0EB] text-[#E05A33] font-semibold border-l-2 border-[#E05A33] dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#E86D45] shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60',
                    isCollapsed ? 'justify-center px-2' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Icon
                    className={[
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200',
                      active
                        ? 'text-[#E05A33] dark:text-[#EE8E6E]'
                        : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-300',
                    ].join(' ')}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate tracking-tight font-body">{item.title}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3]/70 dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#7D2F1A]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside
      className={[
        'flex flex-col bg-white dark:bg-[#111110] text-neutral-800 dark:text-neutral-200 border-r border-[#E8E6E1] dark:border-[#2D2D2A] select-none transition-all duration-300 z-30 shrink-0 shadow-xs',
        isCollapsed ? 'w-16' : 'w-64',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E05A33] rounded-md group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#E05A33] to-[#C94A26] text-white font-serif font-black text-base shadow-sm group-hover:scale-105 transition-transform">
            G
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight">
                GenZ IITian<span className="text-[#E05A33]">.</span>
              </span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono tracking-widest uppercase -mt-0.5 font-medium">
                ACADEMIC LMS
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E05A33]"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 no-scrollbar">
        {renderSection('Curriculum', curriculumItems)}

        {isInstructor && (
          <>
            <div className="h-px bg-[#E8E6E1] dark:bg-[#2D2D2A] my-2 mx-1" />
            {renderSection('Faculty Desk', instructorItems)}
          </>
        )}

        {isManager && (
          <>
            <div className="h-px bg-[#E8E6E1] dark:bg-[#2D2D2A] my-2 mx-1" />
            {renderSection('Management & Ops', managementItems)}
          </>
        )}

        {(isStudent || isSuperManager) && (
          <>
            <div className="h-px bg-[#E8E6E1] dark:bg-[#2D2D2A] my-2 mx-1" />
            {renderSection('Learner Toolkit', learnerToolkit)}
          </>
        )}
      </div>

      {/* Bottom Profile, Settings & Sign Out Panel */}
      <div className="p-3 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#161615]">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FDF0EB] border border-[#F5B8A3] text-[#E05A33] dark:bg-[#3A150C] dark:border-[#7D2F1A] dark:text-[#EE8E6E] font-bold text-xs flex items-center justify-center shrink-0">
                  {userName ? userName.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-[#E05A33] dark:group-hover:text-[#EE8E6E] transition-colors font-display">
                    {userName || 'My Account'}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono truncate uppercase">
                    {role}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                title="Sign out"
                onClick={handleSignOut}
                className="p-2 text-neutral-400 hover:text-[#C94B3E] hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-[#E2766A] dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
              <Link
                href="/profile"
                className="px-2 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-900 text-neutral-600 text-center transition-colors flex items-center justify-center gap-1 border border-[#E8E6E1] dark:bg-neutral-900 dark:hover:bg-neutral-850 dark:hover:text-white dark:text-neutral-400 dark:border-neutral-800"
              >
                <User className="w-3 h-3 text-[#E05A33] dark:text-[#EE8E6E]" />
                <span>Profile</span>
              </Link>
              <Link
                href="/profile"
                className="px-2 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-900 text-neutral-600 text-center transition-colors flex items-center justify-center gap-1 border border-[#E8E6E1] dark:bg-neutral-900 dark:hover:bg-neutral-850 dark:hover:text-white dark:text-neutral-400 dark:border-neutral-800"
              >
                <Settings className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/profile"
              title="Profile"
              className="w-8 h-8 rounded-lg bg-[#FDF0EB] border border-[#F5B8A3] text-[#E05A33] dark:bg-[#3A150C] dark:border-[#7D2F1A] dark:text-[#EE8E6E] font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform"
            >
              {userName ? userName.slice(0, 2).toUpperCase() : 'ST'}
            </Link>
            <button
              type="button"
              title="Sign out"
              onClick={handleSignOut}
              className="p-1.5 text-neutral-400 hover:text-[#C94B3E] hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-[#E2766A] dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
