/**
 * @file apps/web/src/components/layout/site-navbar.tsx
 * @description Common, Unified Header & Navigation Bar for all public pages.
 *
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
      {/* Top Global Announcement Banner */}
      {!hideAnnouncement && (
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 border-b border-emerald-800/60 px-4 py-2 text-center text-xs font-medium text-emerald-200 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Summer 2026 Cohorts Open · Official IIT Madras BS Degree Companion · Over 15,000+ Students</span>
          <Link href="/courses" className="underline font-bold text-white hover:text-emerald-300 ml-1 hidden sm:inline">
            Explore Batches →
          </Link>
        </div>
      )}

      {/* Main SaaS Navbar */}
      <header className="w-full border-b border-stone-800/80 sticky top-0 bg-[#090d0b]/95 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-stone-950 font-serif font-black text-xl flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-lg shadow-emerald-900/30">
              G
            </span>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white font-display block leading-none">
                GenZ IITian<span className="text-emerald-500">.</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
                ACADEMIC LMS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-300">
            {navLinks.map((link) => {
              const active = isCurrent(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors flex items-center gap-1.5 py-1 ${
                    active ? 'text-emerald-400 font-bold' : 'hover:text-emerald-400 text-stone-300'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <Badge variant="brand" className="text-[9px] py-0 px-1 bg-emerald-950 text-emerald-400 border border-emerald-800">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-extrabold text-xs shadow-lg shadow-emerald-950 transition-all transform hover:-translate-y-0.5"
              >
                <Compass className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-xs font-bold text-stone-300 hover:text-white px-3 py-2 rounded-lg hover:bg-stone-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  <span>Role Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <Link
                href={user.role === 'STUDENT' ? '/dashboard' : '/manager'}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-stone-950 font-bold text-xs"
              >
                <span>Dashboard</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-800 bg-[#090d0b] px-6 py-6 space-y-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-sm font-semibold rounded-lg px-3 transition-colors ${
                    isCurrent(link.href)
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'text-stone-300 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-800 flex flex-col gap-2">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-stone-950 text-center font-bold text-sm"
                >
                  Enter Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-stone-700 text-center font-bold text-xs text-stone-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-center font-bold text-xs"
                  >
                    1-Click Role Sandbox
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
