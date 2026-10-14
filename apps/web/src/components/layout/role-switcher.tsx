'use client';

/**
 * Role Switcher Component
 * Module: Layout Components (src/components/layout/role-switcher.tsx)
 *
 * Allows instant 1-click role elevation / switching directly from the app header
 * or sidebar to test Student, Instructor, and Manager clearance tiers.
 * Communicates with /api/auth/demo-login and reloads active session.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const ROLES = [
  {
    key: 'STUDENT',
    label: 'Student (Learner)',
    badge: 'IITM BS',
    desc: 'Courses, lectures, streak, XP & homework',
    icon: GraduationCap,
    color: 'text-emerald-400',
  },
  {
    key: 'INSTRUCTOR',
    label: 'Course Instructor',
    badge: 'Faculty',
    desc: 'Cohorts, doubt queue, homework grading',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    key: 'MANAGER',
    label: 'Operations Manager',
    badge: 'L4 Ops',
    desc: 'Course studio, telemetry & proctored mocks',
    icon: ShieldCheck,
    color: 'text-amber-400',
  },
  {
    key: 'SUPER_MANAGER',
    label: 'Super Manager',
    badge: 'L5 Root',
    desc: 'Platform authority, user directory & finance',
    icon: Sparkles,
    color: 'text-purple-400',
  },
];

export function RoleSwitcher({ currentRole = 'STUDENT' }: { currentRole?: string }) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const activeRole = ROLES.find(
    (r) => r.key === (currentRole || '').toUpperCase()
  ) || ROLES[0];

  const handleSelectRole = async (roleKey: string) => {
    if (roleKey === activeRole.key) return;

    try {
      setSwitching(true);
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleKey }),
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        alert('Failed to switch role. Please try again.');
        setSwitching(false);
      }
    } catch {
      alert('Network error switching role.');
      setSwitching(false);
    }
  };

  const Icon = activeRole.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-emerald-500/50 text-xs font-mono transition-all cursor-pointer focus:outline-none">
        <Icon className={`w-3.5 h-3.5 ${activeRole.color}`} />
        <span className="text-white font-semibold hidden sm:inline">
          {switching ? 'Switching...' : activeRole.badge}
        </span>
        <ChevronDown className="w-3 h-3 text-stone-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="right" className="w-72 bg-[#0f1411] border border-stone-800 text-stone-200 shadow-2xl p-1.5">
        <div className="px-3 py-2 border-b border-stone-800">
          <p className="text-xs font-bold text-white font-display">Switch Active Role</p>
          <p className="text-[11px] text-stone-400 font-mono mt-0.5">
            Test how dashboard features adapt dynamically.
          </p>
        </div>

        <DropdownMenuLabel>Role Clearance Tiers</DropdownMenuLabel>

        {ROLES.map((r) => {
          const ItemIcon = r.icon;
          const isSelected = r.key === activeRole.key;

          return (
            <DropdownMenuItem
              key={r.key}
              onClick={() => handleSelectRole(r.key)}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                isSelected ? 'bg-emerald-950/60 border border-emerald-800/80' : 'hover:bg-stone-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <ItemIcon className={`w-4 h-4 mt-0.5 ${r.color}`} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{r.label}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-stone-800 text-stone-300">
                      {r.badge}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{r.desc}</div>
                </div>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
