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
    <div className={`min-h-screen flex bg-[#090d0b] text-stone-100 font-sans selection:bg-emerald-800 selection:text-white ${className}`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar userRole={user?.role} userName={user?.name} className="sticky top-0 h-screen" />
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[#0a0e0c] shadow-2xl z-10 border-r border-stone-800">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close menu drawer"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar userRole={user?.role} userName={user?.name} className="h-full border-r-0" />
          </div>
        </div>
      )}

      {/* Main Area (Header + Content + Mobile Nav) */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
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
