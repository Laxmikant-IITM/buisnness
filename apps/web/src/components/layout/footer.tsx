/**
 * Footer Component
 * Module: Layout Components (src/components/layout/footer.tsx)
 *
 * Public platform footer featuring organized link directories,
 * brand attribution, social connections, and copyright metadata.
 */

import React from 'react';
import Link from 'next/link';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Explore Courses', href: '/#catalog' },
      { label: 'Practice Exams', href: '/exams' },
      { label: 'My Learning', href: '/learning' },
      { label: 'Certificates', href: '/certificates' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Manager Portal', href: '/manager' },
      { label: 'User Directory', href: '/manager/users' },
      { label: 'Analytics', href: '/manager/analytics' },
      { label: 'Documentation', href: '/docs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Community', href: '/community' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export interface FooterProps {
  className?: string;
}

/**
 * Standard site footer for marketing and public platform pages.
 */
export function Footer({ className = '' }: FooterProps) {
  return (
    <footer
      className={[
        'bg-white border-t border-neutral-200/80 pt-12 pb-10 text-neutral-600 font-body',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-neutral-100">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-700 text-lime font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-display font-extrabold text-base text-neutral-900 tracking-tight">
                LMS<span className="text-brand-600">.</span>
              </span>
            </Link>

            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              Modern learning platform for structured coursework, video lectures,
              and interactive exam preparation. Built with high performance and accessibility.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter profile"
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn profile"
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="text-xs font-semibold text-neutral-900 font-display uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom copyright and legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>&copy; {new Date().getFullYear()} LMS Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-neutral-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-700 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-neutral-700 transition-colors">
              Cookie Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
