'use client';

/**
 * Sidebar Navigation Component
 * Module: Layout Components (src/components/layout/sidebar.tsx)
 *
 * Unified responsive navigation sidebar for the LMS SaaS shell.
 * Features:
 * - Single source of truth for Dashboard navigation (/dashboard).
 * - Direct link to Courses & Lectures (/courses) for immediate syllabus/module discovery.
 * - Role-gated feature access: Management console only visible to staff roles.
 * - User Profile & Quick Settings card with prominent 1-click Sign Out at bottom.
 * - Zero raw emojis: clean Lucide SVG icons.
 * - Active route detection and collapsible icon-only mode.
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
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface SidebarProps {
  /** Optional role to dynamically show or hide managerial tabs */
  userRole?: string;
  /** Optional user name for bottom profile card */
  userName?: string;
  /** Optional external control for collapsed state */
  isCollapsed?: boolean;
  /** Callback fired when collapse state toggles */
  onToggleCollapse?: (collapsed: boolean) => void;
  /** Additional custom class names */
  className?: string;
}

const coreNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Courses & Lectures', href: '/courses', icon: BookOpen },
  { title: 'Live Classes', href: '/live', icon: Video, badge: 'LIVE' },
  { title: 'Proctored Exams', href: '/exams', icon: ShieldCheck, badge: 'MOCK' },
  { title: 'Practice Papers', href: '/papers', icon: FileText },
  { title: 'Community Chat', href: '/community', icon: MessageSquare },
  { title: 'Academic Calendar', href: '/calendar', icon: Calendar },
];

const academicNavItems: NavItem[] = [
  { title: 'Homework Desk', href: '/homework', icon: FileCheck },
  { title: 'Grade Predictor', href: '/tools', icon: Calculator, badge: 'IITM' },
  { title: '1:1 Mentorship', href: '/one-to-one', icon: Users },
  { title: 'Coding Sandbox', href: '/ide/1', icon: Code2 },
  { title: 'Refer & Earn', href: '/refer', icon: Coins, badge: '5%' },
  { title: 'Help & Support', href: '/support', icon: HelpCircle },
];

const staffNavItems: NavItem[] = [
  { title: 'Manager Console', href: '/manager', icon: Library },
  { title: 'Course Studio', href: '/manager/courses', icon: BookOpen },
  { title: 'Exam Operations', href: '/manager/exams', icon: ShieldCheck },
  { title: 'User Directory', href: '/manager/users', icon: Sliders },
];

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

  const isStaff = ['SUPER_MANAGER', 'MANAGER', 'ADMIN', 'INSTRUCTOR'].includes(
    (userRole || '').toUpperCase()
  );

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setInternalCollapsed(nextState);
    onToggleCollapse?.(nextState);
  };

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/app' || pathname === '/learning';
    }
    if (href === '/courses') {
      return pathname === '/courses' || pathname.startsWith('/courses/') || pathname.startsWith('/learning/');
    }
    if (href === '/manager') {
      return pathname === '/manager';
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

  const renderSection = (sectionTitle: string, items: NavItem[]) => (
    <div className="py-2">
      {!isCollapsed && (
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500 font-mono">
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
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400',
                  active
                    ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-2 border-emerald-400 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-stone-900/60',
                  isCollapsed ? 'justify-center px-2' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Icon
                  className={[
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200',
                    active ? 'text-emerald-400' : 'text-stone-400 group-hover:text-emerald-300',
                  ].join(' ')}
                />
                {!isCollapsed && (
                  <span className="flex-1 truncate tracking-tight">{item.title}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
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

  return (
    <aside
      className={[
        'flex flex-col bg-[#0c100d] text-stone-300 border-r border-stone-800/80 select-none transition-all duration-300 z-30 shrink-0 shadow-xl',
        isCollapsed ? 'w-16' : 'w-64',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-stone-800">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded-md group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-stone-950 font-black font-serif text-base shadow-sm group-hover:rotate-6 transition-transform">
            G
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm text-white tracking-tight">
                GenZ IITian<span className="text-emerald-400">.</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase -mt-0.5">
                ACADEMIC LMS
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 no-scrollbar">
        {renderSection('Curriculum', coreNavItems)}
        <div className="h-px bg-stone-800/60 my-2 mx-1" />
        {renderSection('Toolkit & Desk', academicNavItems)}
        {isStaff && (
          <>
            <div className="h-px bg-stone-800/60 my-2 mx-1" />
            {renderSection('Management & Ops', staffNavItems)}
          </>
        )}
      </div>

      {/* Bottom Profile, Settings & Sign Out Panel */}
      <div className="p-3 border-t border-stone-800/80 bg-stone-950/70">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-stone-900 transition-colors group flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {userName ? userName.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {userName || 'My Account'}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono truncate uppercase">
                    {userRole || 'STUDENT'}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                title="Sign out"
                onClick={handleSignOut}
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
              <Link
                href="/profile"
                className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 hover:text-white text-stone-300 text-center transition-colors flex items-center justify-center gap-1 border border-stone-800"
              >
                <User className="w-3 h-3 text-emerald-400" />
                <span>Profile</span>
              </Link>
              <Link
                href="/profile"
                className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 hover:text-white text-stone-300 text-center transition-colors flex items-center justify-center gap-1 border border-stone-800"
              >
                <Settings className="w-3 h-3 text-stone-400" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/profile"
              title="My Profile"
              className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform"
            >
              {userName ? userName.slice(0, 2).toUpperCase() : 'ST'}
            </Link>
            <button
              type="button"
              title="Sign out"
              onClick={handleSignOut}
              className="p-1.5 text-stone-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
