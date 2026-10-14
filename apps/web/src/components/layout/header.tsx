'use client';

/**
 * Header Component
 * Module: Layout Components (src/components/layout/header.tsx)
 *
 * Top application header bar providing breadcrumb navigation context,
 * global search input, notifications toggle, and user profile dropdown.
 */

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  User,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Avatar } from '../ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { RoleSwitcher } from './role-switcher';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HeaderUser {
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface HeaderProps {
  /** Optional breadcrumbs path */
  breadcrumbs?: BreadcrumbItem[];
  /** Current signed-in user data */
  user?: HeaderUser;
  /** Notification count */
  notificationCount?: number;
  /** Callback when search is submitted or clicked */
  onSearchClick?: () => void;
  /** Callback for mobile menu toggle button */
  onMobileMenuToggle?: () => void;
  /** Sign out handler */
  onSignOut?: () => void;
  /** Custom class names */
  className?: string;
}

/**
 * Top navigation and action header component.
 */
export function Header({
  breadcrumbs = [{ label: 'Platform', href: '/dashboard' }, { label: 'Overview' }],
  user = {
    name: 'Learner',
    email: 'user@example.com',
    role: 'Student',
  },
  notificationCount = 2,
  onSearchClick,
  onMobileMenuToggle,
  onSignOut,
  className = '',
}: HeaderProps) {
  return (
    <header
      className={[
        'h-16 w-full bg-white/95 dark:bg-[#1C1C1A]/95 backdrop-blur-xs border-b border-[#E8E6E1] dark:border-[#2D2D2A] px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0 select-none text-[#1A1A19] dark:text-[#F5F3EF]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Left Area: Mobile Menu Button & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            aria-label="Open mobile navigation menu"
            className="lg:hidden p-2 -ml-2 rounded-lg text-[#8C8C87] hover:bg-[#F5F3EF] dark:hover:bg-[#2D2D2A] hover:text-[#1A1A19] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A33]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs font-sans min-w-0">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;

            return (
              <React.Fragment key={crumb.label + idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#B5B3AD] shrink-0" />}
                {isLast || !crumb.href ? (
                  <span className="font-semibold text-[#1A1A19] dark:text-[#F5F3EF] truncate font-display">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right Area: Search, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger */}
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search courses, exams, and notes"
          className="hidden md:flex items-center gap-2 h-9 px-3 text-xs text-[#8C8C87] bg-[#F5F3EF] dark:bg-[#242422] hover:bg-[#EDEBE5] dark:hover:bg-[#2D2D2A] hover:text-[#1A1A19] dark:hover:text-white border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A33]"
        >
          <Search className="w-3.5 h-3.5 text-[#8C8C87]" />
          <span>Search curriculum...</span>
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#8C8C87] bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Role Quick Switcher */}
        <RoleSwitcher currentRole={user.role} />

        {/* Theme appearance toggle */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Notifications button */}
        <button
          type="button"
          aria-label={`Notifications (${notificationCount} unread)`}
          className="relative p-2 rounded-lg text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white hover:bg-[#F5F3EF] dark:hover:bg-[#242422] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A33] cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E05A33] ring-2 ring-white dark:ring-[#1C1C1A]"
              aria-hidden="true"
            />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-xl bg-[#F5F3EF] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all cursor-pointer">
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="sm"
              status="online"
            />
            <div className="hidden xl:flex flex-col text-left pr-1">
              <span className="text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display truncate max-w-[110px]">{user.name}</span>
              <span className="text-[10px] text-[#8C8C87] font-mono -mt-0.5">{user.role || 'STUDENT'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C8C87] mr-1 hidden sm:inline" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="right" className="w-64 bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-[#1A1A19] dark:text-[#F5F3EF] shadow-xl p-1.5">
            <div className="px-3 py-2 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
              <p className="text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-[#8C8C87] font-mono truncate">
                {user.email}
              </p>
              {user.role && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] border border-[#F5B8A3] dark:border-[#7D2F1A] font-mono">
                  {user.role}
                </span>
              )}
            </div>

            <DropdownMenuLabel>Account & Settings</DropdownMenuLabel>

            <DropdownMenuItem
              icon={<User className="w-4 h-4 text-[#E05A33]" />}
              onClick={() => {}}
            >
              <Link href="/profile" className="w-full">My Profile & ID</Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              icon={<Settings className="w-4 h-4 text-stone-400" />}
              onClick={() => {}}
            >
              <Link href="/profile" className="w-full">Account Settings</Link>
            </DropdownMenuItem>

            {['SUPER_MANAGER', 'MANAGER', 'ADMIN'].includes((user.role || '').toUpperCase()) && (
              <DropdownMenuItem
                icon={<Shield className="w-4 h-4 text-amber-400" />}
                onClick={() => {}}
              >
                <Link href="/manager" className="w-full">Manager Console</Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              danger
              icon={<LogOut className="w-4 h-4 text-rose-400" />}
              onClick={async () => {
                if (onSignOut) {
                  onSignOut();
                  return;
                }
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } finally {
                  window.location.href = '/sign-in';
                }
              }}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
