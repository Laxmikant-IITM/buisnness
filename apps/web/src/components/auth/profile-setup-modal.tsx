'use client';

/**
 * Mandatory Profile Setup Blocker Modal
 * Module: Authentication & Onboarding (apps/web/src/components/auth/profile-setup-modal.tsx)
 *
 * Enforces profile completion for first-time students before allowing course interaction:
 * - Collects full name, phone number, gender, age, and home state.
 * - Non-dismissible / unskippable: disables backdrop dismiss and omits close button.
 * - Submits to /api/profile/setup, transitions isProfileComplete to true, and awards bonus XP.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { User, Phone, MapPin, Calendar, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export interface ProfileSetupModalProps {
  /** Visibility toggle. Must be true if user.isProfileComplete is false */
  isOpen: boolean;
  /** Initial name if known from Google / Registration */
  initialName?: string;
  /** Callback fired after profile is saved successfully */
  onComplete?: (updatedUser: Record<string, unknown>) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Other / International',
];

/**
 * Unskippable onboarding blocker dialog to collect student demographics.
 */
export function ProfileSetupModal({
  isOpen,
  initialName = '',
  onComplete,
}: ProfileSetupModalProps) {
  const [name, setName] = useState(initialName);
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'>('PREFER_NOT_TO_SAY');
  const [age, setAge] = useState<string>('');
  const [state, setState] = useState('Tamil Nadu');
  const [aboutMe, setAboutMe] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /**
   * Submits profile completion form to API.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }

    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number for SMS alerts.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      setError('Please enter a valid age between 10 and 100.');
      return;
    }

    if (!state.trim()) {
      setError('Please select your state or province.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          gender,
          age: ageNum,
          state: state.trim(),
          aboutMe: aboutMe.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Profile setup failed.');
      }

      if (onComplete) {
        onComplete(data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Non-dismissible
      closeOnBackdropClick={false}
      showCloseButton={false}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <span>Complete Your Profile</span>
        </div>
      }
      description="One quick step to personalize your academic workspace and unlock student privileges."
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laxmikant Sharma"
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              maxLength={100}
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="tel"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9876543210"
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              maxLength={15}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-neutral-500">Used for exam alerts and live session reminders.</p>
        </div>

        {/* Gender and Age Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Heart className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="number"
                required
                min={10}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="21"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1">
            State / Region <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Short Bio */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 mb-1">
            About Me <span className="text-neutral-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            rows={2}
            placeholder="Tell your peers about your interests, study goals, or coding projects…"
            className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            maxLength={500}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {busy ? 'Saving Profile…' : 'Save & Continue to Learning Space'}
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
}
