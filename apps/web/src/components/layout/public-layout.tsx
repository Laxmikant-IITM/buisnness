'use client';

/**
 * Public Layout Component
 * Module: Layout Components (src/components/layout/public-layout.tsx)
 *
 * Layout wrapper for public and marketing pages (landing, course catalog, about).
 * Features a streamlined public navigation bar and site footer.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { Footer } from './footer';

export interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const navLinks = [
  { label: 'Courses', href: '/#catalog' },
  { label: 'Practice Exams', href: '/exams' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Manager', href: '/manager' },
];

/**
 * Public view wrapper containing public top navbar and full footer.
 */
export function PublicLayout({ children, className = '' }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-body ${className}`}>
      {/* Public Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-700 text-lime font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="font-display font-extrabold text-base text-neutral-900 tracking-tight">
              LMS<span className="text-brand-600">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-xs font-semibold font-display text-neutral-600">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-3.5 py-1.5 text-xs font-semibold font-display text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold font-display text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-xs transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold font-display text-neutral-700 hover:bg-neutral-50 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold font-display text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-xs"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
