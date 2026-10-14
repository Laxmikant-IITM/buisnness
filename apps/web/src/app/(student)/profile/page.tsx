'use client';

/**
 * Student Profile & Identity Dashboard
 * Module: Student Management (apps/web/src/app/(student)/profile/page.tsx)
 *
 * Full-featured profile dashboard providing students with:
 * 1. User credentials, internal security tracking number (SEC-XXXXXX), and referral code.
 * 2. IITM curriculum identity (Level, Cohort, Term) with modal editor.
 * 3. Gamification stats (XP points, current level, daily streak, and wallet coin balance).
 * 4. Earned achievement badges ledger.
 * 5. Historical security and learning activity audit trail with category filtering.
 * 6. Self-service account deletion requests with 24-hour grace period and cancellation.
 * 7. Automatic unskippable ProfileSetupModal if user profile is incomplete.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Award,
  Sparkles,
  Flame,
  Coins,
  GraduationCap,
  Calendar,
  Clock,
  Trash2,
  Copy,
  Check,
  Edit3,
  AlertTriangle,
  ArrowRight,
  LogOut,
  RefreshCw,
  Activity,
  History,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ProfileSetupModal } from '@/components/auth/profile-setup-modal';
import { IdentitySetupModal } from '@/components/auth/identity-setup-modal';

interface UserContext {
  id: string;
  name: string;
  email: string;
  role: string;
  roleRank: number;
  securityNumber: string | null;
  referralCode: string | null;
  avatar: string | null;
  mobileNumber: string | null;
  gender: string | null;
  age: number | null;
  state: string | null;
  aboutMe: string | null;
  iitmLevel: string | null;
  iitmUserType: string | null;
  iitmJoinYear: number | null;
  iitmJoinMonth: number | null;
  xp: number;
  highestLevelReached: number;
  streakDays: number;
  lastStreakDate: string | null;
  walletBalance: number;
  lifetimeReferrals: number;
  quarterlyReferrals: number;
  isProfileComplete: boolean;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: 'activity' | 'login';
  action: string;
  details: unknown;
  createdAt: string;
}

interface DeletionRequestInfo {
  id: string;
  reason: string;
  status: string;
  gracePeriodEndsAt: string;
  createdAt: string;
}

export default function StudentProfilePage() {
  const router = useRouter();

  // Profile data
  const [user, setUser] = useState<UserContext | null>(null);
  const [badges, setBadges] = useState<Array<{ badge: string; awardedAt: string }>>([]);
  const [pendingDeletion, setPendingDeletion] = useState<DeletionRequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Deletion Form
  const [deleteReason, setDeleteReason] = useState('Found alternative platform');
  const [deleteDetails, setDeleteDetails] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Activity logs
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityCategory, setActivityCategory] = useState<'all' | 'activity' | 'logins'>('all');
  const [loadingActivities, setLoadingActivities] = useState(false);

  // UI helpers
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSec, setCopiedSec] = useState(false);

  /**
   * Loads current authenticated user context from /api/auth/me.
   */
  async function loadUserProfile() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/me');
      if (response.status === 401) {
        router.replace('/sign-in');
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to load profile.');
      }

      setUser(data.user);
      setBadges(data.badges || []);
      setPendingDeletion(data.pendingDeletion || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch profile details.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches paginated activity audit logs.
   */
  async function loadActivities(category: 'all' | 'activity' | 'logins') {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/user/activity?category=${category}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingActivities(false);
    }
  }

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      loadActivities(activityCategory);
    }
  }, [user, activityCategory]);

  /**
   * Copies text to clipboard with temporary confirmation badge.
   */
  function copyToClipboard(text: string, isReferral: boolean) {
    navigator.clipboard.writeText(text);
    if (isReferral) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedSec(true);
      setTimeout(() => setCopiedSec(false), 2000);
    }
  }

  /**
   * Submits self-service account deletion request.
   */
  async function submitDeletionRequest(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError('');
    setDeleteBusy(true);

    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deleteReason,
          details: deleteDetails || undefined,
          password: deletePassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to queue deletion request.');
      }

      setPendingDeletion({
        id: data.requestId,
        reason: deleteReason,
        status: 'PENDING',
        gracePeriodEndsAt: data.gracePeriodEndsAt,
        createdAt: new Date().toISOString(),
      });
      setIsDeleteModalOpen(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not submit deletion request.');
    } finally {
      setDeleteBusy(false);
    }
  }

  /**
   * Cancels pending account deletion request during 24h grace period.
   */
  async function cancelDeletionRequest() {
    setDeleteBusy(true);
    try {
      const res = await fetch('/api/user/delete-request', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to cancel deletion request.');
      setPendingDeletion(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not cancel deletion.');
    } finally {
      setDeleteBusy(false);
    }
  }

  /**
   * Signs the current user out.
   */
  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/sign-in');
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f5ef] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-700" />
          <p className="text-xs font-semibold text-neutral-600">Loading student profile…</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-[#f6f5ef] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded-xl border border-neutral-300 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-neutral-900">Profile Unavailable</h2>
          <p className="text-xs text-neutral-600">{error || 'Please sign in to access your profile.'}</p>
          <Link
            href="/sign-in"
            className="inline-block py-2 px-4 bg-brand-800 text-white rounded-lg text-xs font-semibold"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5ef] pb-16 font-sans text-neutral-900">
      {/* Top Learner Header */}
      <header className="border-b border-[#dedfd7] bg-[#fffefa]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link className="brand flex items-center gap-1.5" href="/">
              <span className="brand-icon">N</span>
              <span className="font-extrabold text-base tracking-tight font-display">
                northstar<span className="text-brand-700">.</span>
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-xs font-semibold text-neutral-600">
              <Link href="/learning" className="hover:text-neutral-900 transition-colors">
                My Learning
              </Link>
              <Link href="/tools" className="hover:text-neutral-900 transition-colors">
                Academic Tools
              </Link>
              <Link href="/profile" className="text-neutral-900 font-bold border-b-2 border-brand-700 pb-0.5">
                Profile
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Pending Deletion Alert Banner */}
        {pendingDeletion && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-900">Account Deletion Scheduled</p>
                <p className="text-amber-800">
                  Your deletion request is held in grace period ending on{' '}
                  <strong>{new Date(pendingDeletion.gracePeriodEndsAt).toLocaleString()}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={deleteBusy}
              onClick={cancelDeletionRequest}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0"
            >
              {deleteBusy ? 'Cancelling…' : 'Cancel Deletion Request'}
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <section className="bg-white rounded-2xl border border-[#dedfd7] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              name={user.name}
              src={user.avatar}
              size="xl"
              className="h-20 w-20 ring-4 ring-neutral-100"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold font-display text-neutral-900">{user.name}</h1>
                <Badge variant={user.role === 'STUDENT' ? 'neutral' : 'brand'}>
                  {user.role}
                </Badge>
                {user.iitmLevel && (
                  <Badge variant="brand" className="border-brand-300 text-brand-800 bg-brand-50/50">
                    {user.iitmLevel}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-neutral-500">{user.email}</p>
              {user.aboutMe && <p className="text-xs text-neutral-700 max-w-lg mt-1">{user.aboutMe}</p>}
            </div>
          </div>

          {/* Security & Referral Pills */}
          <div className="flex flex-col sm:items-end gap-2 text-xs w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
            {user.securityNumber && (
              <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
                <Shield className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-mono text-[11px] font-semibold text-neutral-700">
                  {user.securityNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.securityNumber!, false)}
                  className="text-neutral-400 hover:text-neutral-700"
                  title="Copy tracking ID"
                >
                  {copiedSec ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            {user.referralCode && (
              <div className="flex items-center gap-2 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 text-brand-900">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span className="font-mono text-[11px] font-bold tracking-wide">
                  REF: {user.referralCode}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.referralCode!, true)}
                  className="text-brand-600 hover:text-brand-900"
                  title="Copy referral code"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Gamification / Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* XP & Level */}
          <div className="bg-white rounded-xl border border-[#dedfd7] p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-500 font-semibold">
              <span>Experience Points</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-neutral-900">{user.xp}</span>
              <span className="text-xs font-semibold text-brand-700">Level {user.highestLevelReached}</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (user.xp % 500) / 5)}%` }}
              />
            </div>
          </div>

          {/* Daily Streak */}
          <div className="bg-white rounded-xl border border-[#dedfd7] p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-500 font-semibold">
              <span>Learning Streak</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-neutral-900">{user.streakDays}</span>
              <span className="text-xs text-neutral-500">consecutive days</span>
            </div>
            <p className="text-[10px] text-neutral-400">Keep learning daily to preserve your streak</p>
          </div>

          {/* Wallet Coins */}
          <div className="bg-white rounded-xl border border-[#dedfd7] p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-500 font-semibold">
              <span>Learning Coins</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-neutral-900">{user.walletBalance}</span>
              <span className="text-[11px] text-neutral-500">
                (≈ ₹{(user.walletBalance / 100).toFixed(2)})
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Redeemable against course materials & mock tests</p>
          </div>

          {/* Referral Stats */}
          <div className="bg-white rounded-xl border border-[#dedfd7] p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-500 font-semibold">
              <span>Peer Referrals</span>
              <Award className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-neutral-900">{user.lifetimeReferrals}</span>
              <span className="text-xs text-neutral-500">friends invited</span>
            </div>
            <p className="text-[10px] text-neutral-400">Earn 5,000 coins for every successful peer registration</p>
          </div>
        </section>

        {/* Academic Identity & Badges Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IITM Credentials Card */}
          <div className="bg-white rounded-2xl border border-[#dedfd7] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-brand-700" />
                <h2 className="text-base font-bold font-display text-neutral-900">
                  IITM Academic Credentials
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsIdentityModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Degree Level</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                  {user.iitmLevel || 'Not configured'}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Status</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                  {user.iitmUserType || 'Student'}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Admission Term</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                  {user.iitmJoinMonth === 1 ? 'January Term' : user.iitmJoinMonth === 5 ? 'May Term' : user.iitmJoinMonth === 9 ? 'September Term' : 'Term 1'}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Admission Year</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                  {user.iitmJoinYear || 2024}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-between">
              <span>Location: {user.state || 'India'}</span>
              <span>Age: {user.age || '—'}</span>
              <span>Contact: {user.mobileNumber || '—'}</span>
            </div>
          </div>

          {/* Badges & Achievements Card */}
          <div className="bg-white rounded-2xl border border-[#dedfd7] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold font-display text-neutral-900">
                Earned Badges ({badges.length})
              </h2>
            </div>

            {badges.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Complete lessons, quizzes, and maintain streaks to earn badges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.badge}
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col items-center text-center space-y-1"
                  >
                    <Award className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-bold text-neutral-800">
                      {b.badge.replaceAll('_', ' ')}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(b.awardedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Activity Audit Trail */}
        <section className="bg-white rounded-2xl border border-[#dedfd7] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-neutral-600" />
              <h2 className="text-base font-bold font-display text-neutral-900">
                Security & Activity Log
              </h2>
            </div>

            <div className="flex gap-2 text-xs font-semibold">
              {(['all', 'activity', 'logins'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivityCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    activityCategory === cat
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loadingActivities ? (
            <div className="py-6 text-center text-xs text-neutral-500">Loading audit trail…</div>
          ) : activities.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {activities.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-neutral-800">{item.action}</p>
                      <p className="text-[11px] text-neutral-400">
                        {item.type === 'login' ? 'Authentication Event' : 'System Activity'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone: Account Deletion */}
        <section className="bg-white rounded-2xl border border-red-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-base font-bold font-display">Account Deletion & Data Privacy</h2>
          </div>
          <p className="text-xs text-neutral-600 max-w-2xl">
            You may request permanent deletion of your LMS account, enrollments, and quiz progress.
            Requests are held in a 24-hour grace period during which you can cancel at any time.
          </p>

          <div>
            {pendingDeletion ? (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <span>Deletion pending until {new Date(pendingDeletion.gracePeriodEndsAt).toLocaleDateString()}</span>
                <button
                  onClick={cancelDeletionRequest}
                  className="text-red-700 underline font-bold hover:text-red-900"
                >
                  Cancel now
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200 transition-colors"
              >
                Request Account Deletion
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Unskippable Profile Setup Modal if profile is incomplete */}
      <ProfileSetupModal
        isOpen={!user.isProfileComplete}
        initialName={user.name}
        onComplete={(updated) => {
          setUser((prev) => (prev ? { ...prev, ...updated, isProfileComplete: true } : null));
        }}
      />

      {/* IITM Academic Identity Setup Modal */}
      <IdentitySetupModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        initialLevel={user.iitmLevel}
        initialUserType={user.iitmUserType}
        initialJoinYear={user.iitmJoinYear}
        initialJoinMonth={user.iitmJoinMonth}
        onSuccess={(updated) => {
          setUser((prev) => (prev ? { ...prev, ...updated } : null));
        }}
      />

      {/* Account Deletion Request Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="md"
        title={
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Confirm Account Deletion</span>
          </div>
        }
        description="Please confirm you wish to delete your account. A 24-hour grace period will be applied."
      >
        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {deleteError}
          </div>
        )}

        <form onSubmit={submitDeletionRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Primary Reason for Leaving <span className="text-red-500">*</span>
            </label>
            <select
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            >
              <option value="Completed degree program">Completed degree program</option>
              <option value="Found alternative platform">Found alternative platform</option>
              <option value="Privacy or data concerns">Privacy or data concerns</option>
              <option value="Taking a hiatus from studies">Taking a hiatus from studies</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Additional Feedback <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={deleteDetails}
              onChange={(e) => setDeleteDetails(e.target.value)}
              placeholder="What could we have improved?"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Account Password <span className="text-neutral-400 font-normal">(If set)</span>
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password to confirm"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Once submitted, you will have exactly 24 hours to cancel from this page before account purging commences.</span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="py-2 px-3 text-neutral-600 hover:bg-neutral-100 rounded-lg font-semibold"
            >
              Keep My Account
            </button>
            <button
              type="submit"
              disabled={deleteBusy}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg font-semibold shadow-xs"
            >
              {deleteBusy ? 'Submitting…' : 'Schedule Account Deletion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
