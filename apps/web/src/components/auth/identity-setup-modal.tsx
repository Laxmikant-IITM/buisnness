'use client';

/**
 * IITM Academic Identity Setup Modal
 * Module: Authentication & Profile (apps/web/src/components/auth/identity-setup-modal.tsx)
 *
 * Allows students to configure their official IIT Madras BS curriculum credentials:
 * - Current level (Qualifier, Foundation, Diploma, Degree).
 * - Academic user type (Student, Alumni, Prospective).
 * - Cohort admission term (Term month: Jan / May / Sept, and Year).
 * Updates user records via /api/profile/identity and reflects on certificates & leaderboards.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { GraduationCap, Award, Calendar, CheckCircle2 } from 'lucide-react';

export interface IdentitySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLevel?: string | null;
  initialUserType?: string | null;
  initialJoinYear?: number | null;
  initialJoinMonth?: number | null;
  onSuccess?: (updatedData: {
    iitmLevel: string;
    iitmUserType: string;
    iitmJoinYear: number;
    iitmJoinMonth: number;
  }) => void;
}

const IITM_LEVELS = ['Qualifier', 'Foundation', 'Diploma', 'Degree'] as const;
const IITM_USER_TYPES = [
  { value: 'STUDENT', label: 'Current Enrolled Student' },
  { value: 'ALUMNI', label: 'Program Alum / Graduate' },
  { value: 'PROSPECTIVE', label: 'Prospective / Applicant' },
] as const;

const IITM_TERMS = [
  { month: 1, label: 'January Term (Term 1)' },
  { month: 5, label: 'May Term (Term 2)' },
  { month: 9, label: 'September Term (Term 3)' },
];

/**
 * Dialog for updating IIT Madras academic level and cohort details.
 */
export function IdentitySetupModal({
  isOpen,
  onClose,
  initialLevel,
  initialUserType,
  initialJoinYear,
  initialJoinMonth,
  onSuccess,
}: IdentitySetupModalProps) {
  const currentYear = new Date().getFullYear();
  const [level, setLevel] = useState<string>(initialLevel || 'Foundation');
  const [userType, setUserType] = useState<string>(initialUserType || 'STUDENT');
  const [joinYear, setJoinYear] = useState<number>(initialJoinYear || currentYear);
  const [joinMonth, setJoinMonth] = useState<number>(initialJoinMonth || 1);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Submits updated IITM curriculum metadata.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setBusy(true);

    try {
      const response = await fetch('/api/profile/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iitmLevel: level,
          iitmUserType: userType,
          iitmJoinYear: joinYear,
          iitmJoinMonth: joinMonth,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to update academic identity.');
      }

      setSuccessMsg('Academic credentials updated successfully!');
      if (onSuccess) {
        onSuccess({
          iitmLevel: level,
          iitmUserType: userType,
          iitmJoinYear: joinYear,
          iitmJoinMonth: joinMonth,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setBusy(false);
    }
  }

  // Generate range of valid years: 2020 through currentYear + 1
  const years = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i).reverse();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-700" />
          <span>IITM Academic Credentials</span>
        </div>
      }
      description="Select your current stage in the IIT Madras BS Degree in Data Science and Applications."
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Academic Level */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
            Curriculum Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {IITM_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  level === lvl
                    ? 'bg-brand-50 border-brand-600 text-brand-900 ring-2 ring-brand-500/20'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* User Type */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
            Student Status
          </label>
          <div className="relative">
            <Award className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              {IITM_USER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Admission Term Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Admission Term
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <select
                value={joinMonth}
                onChange={(e) => setJoinMonth(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                {IITM_TERMS.map((term) => (
                  <option key={term.month} value={term.month}>{term.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Admission Year
            </label>
            <select
              value={joinYear}
              onChange={(e) => setJoinYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="py-2 px-4 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {busy ? 'Saving…' : 'Save Credentials'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
