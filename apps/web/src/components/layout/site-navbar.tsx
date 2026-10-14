/**
 * @file apps/web/src/components/layout/site-navbar.tsx
 * @description Redesigned editorial Header & Navigation Bar for all public pages.
 *
 * Warm cream light-first design system with terracotta accents.
 * Ensures 100% visual and functional consistency across:
 * - Home (/)
 * - Course Catalog (/courses, /courses/[slug])
 * - Proctored Exams (/exams)
 * - Practice Papers (/papers)
 * - Grade Predictor (/tools)
 * - 1:1 Mentorship (/one-to-one)
 * - Staff Verification (/verify)
 * - Auth Pages (/sign-in, /sign-up)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  Menu,
  X,
  BookOpen,
  ShieldCheck,
  Calculator,
  Calendar,
  Users,
  Sparkles,
  FileText,
  Home,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from './theme-toggle';

export interface SiteNavbarUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SiteNavbarProps {
  initialUser?: SiteNavbarUser | null;
  hideAnnouncement?: boolean;
}

export function SiteNavbar({ initialUser, hideAnnouncement = false }: SiteNavbarProps) {
  const pathname = usePathname() || '';
  const [user, setUser] = useState<SiteNavbarUser | null>(initialUser ?? null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-fetch session if not provided by server component
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
            });
          }
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      }
    }
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [initialUser, pathname]);

  const navLinks = [
    { label: 'Courses & Batches', href: '/courses' },
    { label: 'Resources', href: '/resources' },
    { label: 'Careers & Jobs', href: '/careers', badge: 'HIRING' },
    { label: 'Grade Predictor', href: '/tools', badge: 'IITM' },
    { label: '1:1 Mentorship', href: '/one-to-one' },
    { label: 'Support & FAQ', href: '/support' },
  ];

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="w-full border-b border-[#E8E6E1] dark:border-[#2D2D2A] sticky top-0 bg-[#FAFAF7]/90 dark:bg-[#111110]/90 backdrop-blur-md z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E05A33] to-[#C94A26] text-white font-serif font-black text-xl flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-sm">
            G
          </span>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-[#1A1A19] dark:text-[#F5F3EF] font-display block leading-none">
              GenZ IITian<span className="text-[#E05A33]">.</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#8C8C87] uppercase mt-0.5 font-medium">
              ACADEMIC LMS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13px] font-medium font-body">
          {navLinks.map((link) => {
            const active = isCurrent(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors flex items-center gap-1.5 py-1 ${
                  active
                    ? 'text-[#E05A33] font-bold'
                    : 'text-[#2D2D2A] dark:text-[#EDEBE5] hover:text-[#E05A33] dark:hover:text-[#E05A33] font-medium'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <Badge
                    variant="neutral"
                    size="sm"
                    className="text-[9px] font-mono tracking-wider px-1.5 py-0 bg-[#FDF0EB] text-[#E05A33] border-[#F5B8A3]/70 dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#7D2F1A] rounded font-semibold"
                  >
                    {link.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Dynamic Auth Header CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-xs shadow-sm transition-all duration-150 transform hover:-translate-y-0.5"
            >
              <Compass className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-xs font-semibold text-[#2D2D2A] hover:text-[#1A1A19] dark:text-[#EDEBE5] dark:hover:text-white px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-semibold text-xs shadow-sm transition-all duration-150 transform hover:-translate-y-0.5"
              >
                <span>Role Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          {user && (
            <Link
              href={user.role === 'STUDENT' ? '/dashboard' : '/manager'}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E05A33] text-white font-semibold text-xs"
            >
              <span>Dashboard</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-[#E8E6E1] dark:border-[#2D2D2A] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#FAFAF7] dark:bg-[#111110] px-5 py-6 space-y-4">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isCurrent(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2.5 text-sm rounded-xl px-3.5 transition-colors font-body ${
                    active
                      ? 'bg-[#FDF0EB] text-[#E05A33] font-semibold dark:bg-[#3A150C] dark:text-[#EE8E6E] border border-[#F5B8A3]/60 dark:border-[#7D2F1A]'
                      : 'text-neutral-700 hover:text-[#E05A33] hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-[#EE8E6E] dark:hover:bg-neutral-900/60 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3]/60 dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#7D2F1A]">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col gap-2.5">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white text-center font-semibold text-sm shadow-sm transition-colors"
              >
                Enter Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] text-center font-semibold text-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white text-center font-semibold text-xs shadow-sm transition-colors"
                >
                  1-Click Role Sandbox
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Mobile Public Fixed Bottom Navigation Bar */}
    <nav
      aria-label="Public mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#090d0b]/95 backdrop-blur-md border-t border-stone-800/80 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        <Link
          href="/"
          className={`flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all select-none active:scale-95 ${
            pathname === '/'
              ? 'text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          href="/courses"
          className={`flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all select-none active:scale-95 ${
            pathname.startsWith('/courses')
              ? 'text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Courses</span>
        </Link>
        <Link
          href="/resources"
          className={`flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all select-none active:scale-95 ${
            pathname.startsWith('/resources')
              ? 'text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span>Library</span>
        </Link>
        <Link
          href="/tools"
          className={`flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all select-none active:scale-95 ${
            pathname.startsWith('/tools')
              ? 'text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Calculator className="w-5 h-5 mb-0.5" />
          <span>Predictor</span>
        </Link>
        <Link
          href={user ? (user.role === 'STUDENT' ? '/dashboard' : '/manager') : '/sign-in'}
          className={`flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all select-none active:scale-95 ${
            pathname.startsWith('/dashboard') || pathname.startsWith('/manager') || pathname.startsWith('/sign-in')
              ? 'text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/40'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>{user ? 'Dashboard' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
    </>
  );
}
