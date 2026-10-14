'use client';

/**
 * Theme Toggle Component
 * Module: Layout Components (src/components/layout/theme-toggle.tsx)
 *
 * Provides instant switching between Dark and Light appearance modes.
 * Persists theme choice in localStorage and updates the html element class.
 * Zero raw emojis: uses sleek Lucide Sun & Moon SVG icons.
 */

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || (!stored && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);

    if (next === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-stone-900 border-stone-800 text-amber-400 hover:bg-stone-850 hover:border-amber-500/40 shadow-sm'
          : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
