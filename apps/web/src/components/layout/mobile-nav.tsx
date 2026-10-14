'use client';

/**
 * Mobile Bottom Navigation Component
 * Module: Layout Components (src/components/layout/mobile-nav.tsx)
 *
 * Fixed bottom navigation bar optimized for mobile viewports.
 * Provides quick access to primary LMS sections: Home, Courses, Exams, Community, More.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, GraduationCap, MessageSquare, MoreHorizontal } from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const defaultMobileTabs: MobileNavItem[] = [
  { id: 'home', label: 'Home', href: '/dashboard', icon: Home },
  { id: 'courses', label: 'Courses', href: '/learning', icon: BookOpen },
  { id: 'exams', label: 'Exams', href: '/exams', icon: GraduationCap },
  { id: 'community', label: 'Community', href: '/community', icon: MessageSquare },
  { id: 'more', label: 'More', href: '/manager', icon: MoreHorizontal },
];

export interface MobileNavProps {
  /** Optional custom tab list override */
  items?: MobileNavItem[];
  /** Optional callback when 'More' is clicked */
  onMoreClick?: () => void;
  /** Custom container class */
  className?: string;
}

/**
 * Mobile fixed bottom tab bar with tactile feedback and active highlights.
 */
export function MobileNav({
  items = defaultMobileTabs,
  onMoreClick,
  className = '',
}: MobileNavProps) {
  const pathname = usePathname() || '';

  const isTabActive = (href: string) => {
    if (href === '/dashboard' && (pathname === '/dashboard' || pathname === '/app' || pathname === '/')) {
      return true;
    }
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className={[
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white/90 backdrop-blur-md border-t border-neutral-200/90',
        'px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {items.map((item) => {
          const active = isTabActive(item.href);
          const Icon = item.icon;

          if (item.id === 'more' && onMoreClick) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={onMoreClick}
                className="flex flex-1 flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium font-body text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
              >
                <Icon className="w-5 h-5 mb-0.5 text-neutral-500" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={[
                'flex flex-1 flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-body transition-colors select-none',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500',
                active
                  ? 'text-brand-700 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 font-medium',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon
                className={[
                  'w-5 h-5 mb-0.5 transition-transform duration-150',
                  active ? 'text-brand-700 scale-105' : 'text-neutral-400',
                ].join(' ')}
              />
              <span className="truncate max-w-[54px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
