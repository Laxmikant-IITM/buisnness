'use client';

/**
 * Mobile Bottom Navigation Component
 * Module: Layout Components (src/components/layout/mobile-nav.tsx)
 *
 * Fixed bottom navigation bar optimized for mobile viewports.
 * Provides instant app-like access to primary LMS sections: Dashboard, Courses, Live, Community, Menu.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Video, MessageSquare, Menu } from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const defaultMobileTabs: MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', icon: Home },
  { id: 'courses', label: 'Courses', href: '/courses', icon: BookOpen },
  { id: 'live', label: 'Live', href: '/live', icon: Video },
  { id: 'community', label: 'Chat', href: '/community', icon: MessageSquare },
  { id: 'more', label: 'Menu', href: '#menu', icon: Menu },
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
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/app';
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className={[
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white/95 dark:bg-[#1C1C1A]/95 backdrop-blur-md border-t border-[#E8E6E1] dark:border-[#2D2D2A]',
        'px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl',
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
                className="flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-[#F5F3EF] transition-all cursor-pointer active:scale-95"
              >
                <Icon className="w-5 h-5 mb-0.5 text-[#8C8C87]" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={[
                'flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all select-none active:scale-95',
                active
                  ? 'text-[#E05A33] font-bold bg-[#FDF0EB] dark:bg-[#3A150C]/60 border border-[#F5B8A3]/60 dark:border-[#7D2F1A]'
                  : 'text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-[#F5F3EF] font-medium',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon
                className={[
                  'w-5 h-5 mb-0.5 transition-transform duration-150',
                  active ? 'text-[#E05A33] scale-105' : 'text-[#8C8C87]',
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
