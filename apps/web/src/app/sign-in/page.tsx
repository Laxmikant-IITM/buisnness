/**
 * @file apps/web/src/app/sign-in/page.tsx
 * @description Redesigned Modern SaaS Authentication & Role Switcher Hub.
 *
 * Provides:
 * - 1-Click Role Login Shortcuts for all 5 system roles with explicit clearance tiers and boundary notes.
 * - Granular Permissions & Limitations Matrix comparing feature access across roles.
 * - Standard Email & Password authentication for production accounts.
 * - Completely custom modern SaaS aesthetic (Notion/Linear-inspired dark canvas with emerald accents).
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteNavbar } from '@/components/layout/site-navbar';

interface RoleShortcut {
  role: 'SUPER_MANAGER' | 'MANAGER' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  title: string;
  badge: string;
  badgeVariant: 'brand' | 'success' | 'warning' | 'error' | 'neutral';
  icon: React.ReactNode;
  canDo: string[];
  cannotDo: string[];
  destination: string;
  demoEmail: string;
}

const ROLE_SHORTCUTS: RoleShortcut[] = [
  {
    role: 'SUPER_MANAGER',
    title: 'Super Manager',
    badge: 'L5 · ROOT ACCESS',
    badgeVariant: 'brand',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    canDo: [
      'Full platform control and settings',
      'Manage all users & promote/demote roles',
      'View platform financial totals and orders',
      'Orchestrate all courses and proctored exams',
    ],
    cannotDo: ['No limitations — highest authority tier'],
    destination: '/manager',
    demoEmail: 'supermanager@northstar.demo',
  },
  {
    role: 'MANAGER',
    title: 'Operations Manager',
    badge: 'L4 · OPERATIONS',
    badgeVariant: 'warning',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    canDo: [
      'Course Studio creator & publishing',
      'Proctored Exam operations center',
      'Live candidate telemetry (lock, unlock, allowances)',
      'Export formula-safe CSV candidate results',
    ],
    cannotDo: [
      'Cannot demote Super Managers or access platform root secrets',
    ],
    destination: '/manager/exams',
    demoEmail: 'manager@northstar.demo',
  },
  {
    role: 'ADMIN',
    title: 'Course Admin',
    badge: 'L3 · CURRICULUM',
    badgeVariant: 'neutral',
    icon: <UserCheck className="w-5 h-5 text-blue-400" />,
    canDo: [
      'Author curriculum topics & modules',
      'Attach video lessons (Drive / YouTube)',
      'Manage syllabus ordering & downloadable materials',
    ],
    cannotDo: [
      'Cannot manage global platform users or candidate proctor locks',
    ],
    destination: '/manager/courses',
    demoEmail: 'admin@northstar.demo',
  },
  {
    role: 'INSTRUCTOR',
    title: 'Course Instructor',
    badge: 'L2 · FACULTY',
    badgeVariant: 'neutral',
    icon: <GraduationCap className="w-5 h-5 text-sky-400" />,
    canDo: [
      'View assigned course workspaces',
      'Grade submitted student homework assignments',
      'Answer student helpdesk tickets & community queries',
    ],
    cannotDo: [
      'Read-only on course pricing and workspace publishing settings',
      'Cannot access platform user management',
    ],
    destination: '/manager',
    demoEmail: 'instructor@northstar.demo',
  },
  {
    role: 'STUDENT',
    title: 'Student / Learner',
    badge: 'L1 · LEARNER',
    badgeVariant: 'success',
    icon: <GraduationCap className="w-5 h-5 text-emerald-400" />,
    canDo: [
      'Watch lecture streams & track lesson progress',
      'Take Proctored Exams with full-screen anti-cheat lock',
      'Scientific calculator & LaTeX KaTeX math formula render',
      'Solve coding problems in Piston multi-language IDE',
      'Calculate grades with official IITM CGPA predictor',
      'Earn 5% wallet coins via referral hub',
    ],
    cannotDo: [
      'Strictly barred from all /manager workspaces (403 Forbidden)',
      'Cannot view exam answer keys or candidate telemetry',
    ],
    destination: '/learning',
    demoEmail: 'student@northstar.demo',
  },
];

export default function SignInPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'password'>('shortcuts');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);

  /**
   * 1-Click Role Login Shortcut Handler.
   */
  async function handleQuickLogin(shortcut: RoleShortcut) {
    setLoadingRole(shortcut.role);
    setError('');
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: shortcut.role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch role.');

      router.replace(data.redirectTo || shortcut.destination);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Try again.');
      setLoadingRole(null);
    }
  }

  /**
   * Traditional Password Login Handler.
   */
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in failed. Try again.');

      router.replace(data.role === 'STUDENT' ? '/learning' : '/manager');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0f0d] text-stone-100 font-sans flex flex-col justify-between selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar hideAnnouncement={true} />

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-12 space-y-10">
        {/* Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="brand">Unified SaaS Auth</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Select Your Role & Launch
          </h1>
          <p className="text-stone-400 text-sm">
            Experience the platform from each distinct perspective. Every role enforces strict clearance boundaries,
            guaranteeing student lockdown while granting managers operational control.
          </p>

          {/* Tab Selector */}
          <div className="inline-flex p-1 rounded-xl bg-stone-900 border border-stone-800 mt-2">
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'shortcuts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              1-Click Role Shortcuts
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'password'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Email & Password Login
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        {/* Tab 1: 1-Click Role Shortcuts Grid */}
        {activeTab === 'shortcuts' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ROLE_SHORTCUTS.map((s) => {
                const isLoading = loadingRole === s.role;

                return (
                  <div
                    key={s.role}
                    className={`relative rounded-xl border p-5 flex flex-col justify-between bg-stone-950/60 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:shadow-lg ${
                      s.role === 'SUPER_MANAGER'
                        ? 'border-emerald-800/80 ring-1 ring-emerald-500/30'
                        : s.role === 'STUDENT'
                        ? 'border-emerald-900/60'
                        : 'border-stone-800'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                            {s.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base leading-tight font-display">
                              {s.title}
                            </h3>
                            <span className="text-[11px] font-mono text-stone-500 block">
                              {s.demoEmail}
                            </span>
                          </div>
                        </div>
                        <Badge variant={s.badgeVariant}>{s.badge}</Badge>
                      </div>

                      {/* Capabilities (Can Do) */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
                          Permitted Capabilities
                        </span>
                        <ul className="space-y-1 text-xs text-stone-300">
                          {s.canDo.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Boundaries (Limitations) */}
                      <div className="space-y-1.5 pt-2 border-t border-stone-900">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                          Access Limitations
                        </span>
                        <ul className="space-y-1 text-xs text-stone-400">
                          {s.cannotDo.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <XCircle className="w-3.5 h-3.5 text-rose-500/80 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Launch Button */}
                    <div className="pt-6 mt-4 border-t border-stone-900">
                      <Button
                        variant={s.role === 'SUPER_MANAGER' ? 'primary' : 'outline'}
                        className="w-full text-xs font-bold justify-between group h-10"
                        onClick={() => handleQuickLogin(s)}
                        disabled={Boolean(loadingRole)}
                      >
                        <span>{isLoading ? 'Authenticating...' : `Launch as ${s.title}`}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Permissions Matrix Drawer Toggle */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setShowMatrix(!showMatrix)}
                className="text-xs text-stone-400 hover:text-emerald-400 font-mono inline-flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showMatrix ? 'Hide' : 'Inspect'} Full Role Clearance Matrix</span>
              </button>
            </div>

            {/* Permissions Matrix Table */}
            {showMatrix && (
              <div className="rounded-xl border border-stone-800 bg-stone-950 p-6 space-y-4">
                <h3 className="font-bold text-white text-base font-display">
                  Platform Clearance & Limitation Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 font-mono text-[11px] border-b border-stone-800 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">System Feature</th>
                        <th className="py-2.5 px-3 text-center text-emerald-400">Super Manager</th>
                        <th className="py-2.5 px-3 text-center text-amber-400">Manager</th>
                        <th className="py-2.5 px-3 text-center text-blue-400">Course Admin</th>
                        <th className="py-2.5 px-3 text-center text-sky-400">Instructor</th>
                        <th className="py-2.5 px-3 text-center text-emerald-500">Student</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-stone-200">Global User Administration & Roles</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-stone-200">Course Studio (Publishing & Offerings)</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-amber-500">VIEW ONLY</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-stone-200">Proctored Exam Operations & Anti-Cheat Telemetry</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">NO</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-stone-200">Take Exams in Lockdown & Calculator</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">PRIMARY</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-stone-200">Grade Homework & Answer Helpdesk</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">YES</td>
                        <td className="py-2.5 px-3 text-center text-rose-500">SUBMIT ONLY</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-stone-200">5% Peer Referrals & Wallet Coins</td>
                        <td className="py-2.5 px-3 text-center text-stone-500">—</td>
                        <td className="py-2.5 px-3 text-center text-stone-500">—</td>
                        <td className="py-2.5 px-3 text-center text-stone-500">—</td>
                        <td className="py-2.5 px-3 text-center text-stone-500">—</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">ACTIVE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Traditional Password Form */
          <div className="max-w-md mx-auto rounded-xl border border-stone-800 bg-stone-950 p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="font-bold text-white text-xl font-display">Account Sign In</h2>
              <p className="text-xs text-stone-400">Enter your registered email and password to access your space.</p>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-300">Password</label>
                  <Link href="/forgot-password" className="text-[11px] text-emerald-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button variant="primary" type="submit" disabled={busy} className="w-full">
                {busy ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="pt-4 border-t border-stone-800 text-center text-xs text-stone-400">
              Don&apos;t have an account yet?{' '}
              <Link href="/sign-up" className="text-emerald-400 hover:underline font-semibold">
                Sign up free
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
        <div className="flex items-center gap-2">
          <span>© 2026 Northstar LMS & Examination Suite</span>
          <span>·</span>
          <span>Role Isolation Active</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/verify" className="hover:text-stone-300">Staff Verification</Link>
          <Link href="/tools" className="hover:text-stone-300">Academic Predictor</Link>
          <Link href="/courses" className="hover:text-stone-300">Course Catalog</Link>
        </div>
      </footer>
    </div>
  );
}
