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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const applyTheme = (targetTheme: 'dark' | 'light') => {
      setTheme(targetTheme);
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }

    const handleSync = () => {
      const current = localStorage.getItem('theme');
      if (current === 'dark' || current === 'light') {
        applyTheme(current);
      }
    };

    window.addEventListener('theme-change', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('theme-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);

    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-neutral-800 border-neutral-700 text-amber-400 hover:border-amber-500/40 shadow-sm'
          : 'bg-white border-[#E8E6E1] text-neutral-600 hover:bg-[#F5F3EF] hover:border-neutral-400 shadow-sm'
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
