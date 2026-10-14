/**
 * Auth Layout Component
 * Module: Layout Components (src/components/layout/auth-layout.tsx)
 *
 * Dedicated centered layout container for authentication views (sign-in, sign-up,
 * password reset). Highlights brand identity with a clean card container.
 */

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export interface AuthLayoutProps {
  /** Page content / form rendered inside auth card */
  children: React.ReactNode;
  /** Primary title of the authentication step */
  title: string;
  /** Explanatory subtext */
  subtitle?: string;
  /** Optional footnote or bottom navigation links */
  footer?: React.ReactNode;
  /** Custom class for outer wrapper */
  className?: string;
}

/**
 * Centered Authentication view wrapper.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  footer,
  className = '',
}: AuthLayoutProps) {
  return (
    <div
      className={[
        'min-h-screen flex flex-col justify-between bg-neutral-100/60 p-4 sm:p-6 lg:p-8 font-body',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top Brand Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-700 text-lime font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="font-display font-extrabold text-base text-neutral-900 tracking-tight">
            LMS<span className="text-brand-600">.</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          Back to home
        </Link>
      </div>

      {/* Main Centered Auth Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-md p-6 sm:p-8">
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="text-2xl font-bold font-display text-neutral-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-neutral-500 font-body leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="space-y-4">{children}</div>

          {footer && (
            <div className="mt-6 pt-5 border-t border-neutral-100 text-center text-xs text-neutral-500 font-body">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-md mx-auto text-center pb-2">
        <p className="text-[11px] text-neutral-400 font-body">
          &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
