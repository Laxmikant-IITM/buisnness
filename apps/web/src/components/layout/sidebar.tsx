'use client';

/**
 * Sidebar Navigation Component
 * Module: Layout Components (src/components/layout/sidebar.tsx)
 *
 * Unified responsive navigation sidebar for the LMS SaaS shell.
 * Features:
 * - Single source of truth for Dashboard navigation (/dashboard).
 * - Role-gated feature access: Management console only visible to staff roles.
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
  /** Optional external control for collapsed state */
  isCollapsed?: boolean;
  /** Callback fired when collapse state toggles */
  onToggleCollapse?: (collapsed: boolean) => void;
  /** Additional custom class names */
  className?: string;
}

const coreNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
    if (href === '/manager') {
      return pathname === '/manager';
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href));
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

      {/* Bottom Status Box */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-stone-900/80 border border-stone-800/90 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-bold text-stone-200 font-display">Active Session</p>
          </div>
          <p className="text-[11px] text-stone-400 font-body mt-1">
            {isStaff ? 'Staff management clearance verified.' : 'IIT Madras BS degree curriculum.'}
          </p>
        </div>
      )}
    </aside>
  );
}
