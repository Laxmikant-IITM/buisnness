'use client';

/**
 * App Shell Component
 * Module: Layout Components (src/components/layout/app-shell.tsx)
 *
 * Primary application layout container integrating the responsive dark sidebar,
 * top header, main scrollable content area, and mobile bottom navigation bar.
 */

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header, BreadcrumbItem, HeaderUser } from './header';
import { MobileNav } from './mobile-nav';
import { X } from 'lucide-react';

export interface AppShellProps {
  /** Page content rendered within the main view */
  children: React.ReactNode;
  /** Breadcrumb navigation items passed down to header */
  breadcrumbs?: BreadcrumbItem[];
  /** Signed-in user profile */
  user?: HeaderUser;
  /** Search button click handler */
  onSearchClick?: () => void;
  /** Sign out action handler */
  onSignOut?: () => void;
  /** Custom class for outer wrapper */
  className?: string;
}

/**
 * Responsive Application Shell adhering to modern SaaS ergonomics.
 */
export function AppShell({
  children,
  breadcrumbs,
  user,
  onSearchClick,
  onSignOut,
  className = '',
}: AppShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className={`h-screen w-screen flex overflow-hidden bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] font-sans selection:bg-[#FDF0EB] selection:text-[#E05A33] ${className}`}>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <Sidebar userRole={user?.role} userName={user?.name} className="h-full" />
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[#FAFAF7] dark:bg-[#1C1C1A] shadow-2xl z-10 border-r border-[#E8E6E1] dark:border-[#2D2D2A]">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close menu drawer"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white hover:bg-[#F5F3EF] dark:hover:bg-[#2D2D2A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A33]"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar userRole={user?.role} userName={user?.name} className="h-full border-r-0" />
          </div>
        </div>
      )}

      {/* Main Area (Header + Scrollable Content + Mobile Nav) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden pb-16 lg:pb-0">
        <Header
          breadcrumbs={breadcrumbs}
          user={user}
          onMobileMenuToggle={() => setMobileDrawerOpen(true)}
          onSearchClick={onSearchClick}
          onSignOut={onSignOut}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <MobileNav onMoreClick={() => setMobileDrawerOpen(true)} />
      </div>
    </div>
  );
}
