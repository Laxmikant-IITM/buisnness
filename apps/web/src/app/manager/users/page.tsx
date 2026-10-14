'use client';

/**
 * @file apps/web/src/app/manager/users/page.tsx
 * @description Modern SaaS User & Staff Management Console.
 *
 * Provides Platform Managers with full control:
 * 1. View all student & staff accounts with security IDs, email, and IITM cohort level.
 * 2. Instant Course Assignment & Revocation (grant free course access or remove).
 * 3. Role promotion & demotion (Student -> Instructor -> Admin -> Manager -> Super Manager).
 * 4. Financial ledgers: view paid orders, wallet coins balance, and grant bonus coins.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Coins,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  securityNumber: string;
  referralCode: string;
  walletBalance: number;
  streakDays: number;
  xp: number;
  iitmLevel: string;
  isActive: boolean;
  enrolledCourseIds?: string[];
  totalSpentPaise?: number;
  createdAt: string;
  protectedRole?: boolean;
}

interface CourseOption {
  id: string;
  title: string;
}

const ALL_COURSES: CourseOption[] = [
  { id: 'course-math1', title: 'Mathematics for Data Science 1' },
  { id: 'course-ct', title: 'Computational Thinking & Python' },
  { id: 'course-stats1', title: 'Statistics for Data Science 1' },
];

export default function PeoplePage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('SUPER_MANAGER');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Assign course modal
  const [assignModalUser, setAssignModalUser] = useState<UserItem | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(ALL_COURSES[0].id);
  const [isAssigning, setIsAssigning] = useState(false);

  // Bonus coins modal
  const [coinModalUser, setCoinModalUser] = useState<UserItem | null>(null);
  const [coinsToAdd, setCoinsToAdd] = useState<string>('500');
  const [isAddingCoins, setIsAddingCoins] = useState(false);

  // Load user directory
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manager/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load user directory.');

      setUsers(data.users || []);
      setCurrentRole(data.role || 'SUPER_MANAGER');
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Error loading users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Role change handler
  const handleRoleChange = async (targetUser: UserItem, newRole: string) => {
    if (newRole === targetUser.role) return;

    try {
      const res = await fetch(`/api/manager/users/${encodeURIComponent(targetUser.id)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Role change failed.');

      setToast({ type: 'success', text: `Updated ${targetUser.name}'s role to ${newRole}.` });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update role.' });
    }
  };

  // Course assignment handler
  const handleAssignCourse = async () => {
    if (!assignModalUser || !selectedCourseId) return;
    setIsAssigning(true);

    try {
      const res = await fetch(`/api/manager/users/${encodeURIComponent(assignModalUser.id)}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ASSIGN', courseId: selectedCourseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign course.');

      setToast({ type: 'success', text: `Course assigned to ${assignModalUser.name}!` });
      setAssignModalUser(null);
      loadUsers();
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Assignment error.' });
    } finally {
      setIsAssigning(false);
    }
  };

  // Course revocation handler
  const handleRevokeCourse = async (targetUser: UserItem, courseId: string) => {
    try {
      const res = await fetch(`/api/manager/users/${encodeURIComponent(targetUser.id)}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE', courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke course.');

      setToast({ type: 'success', text: `Course access revoked.` });
      loadUsers();
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Revocation error.' });
    }
  };

  // Add coins handler
  const handleAddCoins = async () => {
    if (!coinModalUser) return;
    const amount = parseInt(coinsToAdd, 10);
    if (isNaN(amount) || amount <= 0) return;

    setIsAddingCoins(true);
    try {
      const res = await fetch(`/api/manager/users/${encodeURIComponent(coinModalUser.id)}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_COINS', coins: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to credit coins.');

      setToast({ type: 'success', text: `Credited ${amount} coins to ${coinModalUser.name}!` });
      setCoinModalUser(null);
      loadUsers();
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Credit error.' });
    } finally {
      setIsAddingCoins(false);
    }
  };

  const allowedRoles =
    currentRole === 'SUPER_MANAGER'
      ? ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'MANAGER', 'SUPER_MANAGER']
      : ['STUDENT', 'INSTRUCTOR', 'ADMIN'];

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.securityNumber && u.securityNumber.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'STAFF' && u.role !== 'STUDENT') ||
      (roleFilter === 'STUDENT' && u.role === 'STUDENT') ||
      u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand">Platform Administration</Badge>
            <span className="text-stone-600">/</span>
            <span className="text-xs font-mono text-stone-400">User & Staff Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            People & Roles Directory
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => loadUsers()}>
            Refresh List
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, or SEC-ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800 self-stretch sm:self-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'STAFF', label: 'Staff & Faculty' },
            { id: 'STUDENT', label: 'Students' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                roleFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-900/90 text-stone-400 uppercase font-mono text-[10px] tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">User & Security ID</th>
                <th className="py-3 px-4">Role & Access</th>
                <th className="py-3 px-4">Enrolled Courses</th>
                <th className="py-3 px-4">Wallet Coins</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-900 text-stone-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-500">
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isStaffMember = user.role !== 'STUDENT';
                  const userCourses = user.enrolledCourseIds || [];

                  return (
                    <tr key={user.id} className="hover:bg-stone-900/40 transition-colors">
                      {/* Person Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isStaffMember
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{user.name}</div>
                            <div className="text-[11px] text-stone-400 font-mono">{user.email}</div>
                            {user.securityNumber && (
                              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                {user.securityNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={user.role}
                          disabled={user.protectedRole}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-semibold cursor-pointer ${
                            user.role === 'SUPER_MANAGER'
                              ? 'bg-purple-950/80 border-purple-700 text-purple-200'
                              : user.role === 'MANAGER'
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                              : user.role === 'INSTRUCTOR'
                              ? 'bg-sky-950/80 border-sky-700 text-sky-200'
                              : user.role === 'ADMIN'
                              ? 'bg-blue-950/80 border-blue-700 text-blue-200'
                              : 'bg-stone-900 border-stone-800 text-stone-300'
                          }`}
                        >
                          {allowedRoles.map((r) => (
                            <option key={r} value={r} className="bg-stone-900 text-white">
                              {r.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Enrolled Courses */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {userCourses.length === 0 ? (
                            <span className="text-[11px] text-stone-500 italic">None</span>
                          ) : (
                            userCourses.map((cId) => {
                              const found = ALL_COURSES.find((c) => c.id === cId);
                              const label = found ? found.title : cId;
                              return (
                                <span
                                  key={cId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900 border border-stone-800 text-emerald-300"
                                >
                                  <span className="truncate max-w-[100px]">{label}</span>
                                  <button
                                    onClick={() => handleRevokeCourse(user, cId)}
                                    title="Revoke enrollment"
                                    className="hover:text-red-400 cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              );
                            })
                          )}
                          <button
                            onClick={() => {
                              setAssignModalUser(user);
                              setSelectedCourseId(ALL_COURSES[0].id);
                            }}
                            className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-emerald-300 transition cursor-pointer"
                            title="Assign Course"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Wallet Coins & Payments */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-950/50 text-amber-400">
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-mono font-bold text-white text-xs">
                              {user.walletBalance ?? 0}
                            </div>
                            <button
                              onClick={() => setCoinModalUser(user)}
                              className="text-[10px] text-emerald-400 hover:underline font-mono"
                            >
                              + Grant Coins
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => {
                            setAssignModalUser(user);
                            setSelectedCourseId(ALL_COURSES[0].id);
                          }}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Assign Course
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Course Modal */}
      {assignModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base font-display">Assign Course Access</h3>
              <button
                onClick={() => setAssignModalUser(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Grant immediate free access to{' '}
              <strong className="text-white">{assignModalUser.name}</strong> without requiring checkout.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-stone-400">Select Curriculum Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white outline-none"
              >
                {ALL_COURSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-900">
              <Button variant="ghost" size="sm" onClick={() => setAssignModalUser(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAssignCourse} disabled={isAssigning}>
                {isAssigning ? 'Assigning...' : 'Grant Enrollment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Coins Modal */}
      {coinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base font-display">Credit Wallet Coins</h3>
              <button onClick={() => setCoinModalUser(null)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Credit bonus referral coins to{' '}
              <strong className="text-white">{coinModalUser.name}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-stone-400">Coins Amount</label>
              <Input
                type="number"
                value={coinsToAdd}
                onChange={(e) => setCoinsToAdd(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-900">
              <Button variant="ghost" size="sm" onClick={() => setCoinModalUser(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddCoins} disabled={isAddingCoins}>
                {isAddingCoins ? 'Crediting...' : 'Credit Coins'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
