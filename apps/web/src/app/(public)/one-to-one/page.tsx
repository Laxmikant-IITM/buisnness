'use client';

/**
 * 1-on-1 Tutoring & Mentorship Appointment Booking Portal
 * Module: Tutoring & Mentorship (src/app/(public)/one-to-one/page.tsx)
 *
 * Allows students to schedule dedicated 1:1 doubt-clearing sessions with top IITM BS rankers.
 * Features:
 * - Next-14-days date selector.
 * - Granular morning, afternoon, and evening time slot pickers.
 * - Academic level and multi-subject selection.
 * - Real-time daily 3-booking limit enforcement via `/api/1on1/book`.
 * - Booking confirmation modal with unique reservation ID.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { SiteNavbar } from '@/components/layout/site-navbar';

const PLANS = [
  {
    id: 'single-doubt',
    name: 'Rapid Doubt Clearing',
    duration: '45 mins',
    price: '₹499',
    description: 'Solve specific assignment problems, dry-run code, or clarify difficult theorems.',
  },
  {
    id: 'deep-dive',
    name: 'Concept Masterclass (Recommended)',
    duration: '90 mins',
    price: '₹899',
    description: 'Comprehensive topic review, past exam question walkthrough, and personalized tips.',
  },
  {
    id: 'monthly-pack',
    name: 'Term Mentorship Pack',
    duration: '4 x 60 mins',
    price: '₹2,799',
    description: 'Dedicated weekly mentor check-ins across your entire Qualifier or Foundation term.',
  },
];

const TIME_SLOTS = [
  { time: '10:00 AM - 11:00 AM', period: 'Morning' },
  { time: '11:30 AM - 12:30 PM', period: 'Morning' },
  { time: '02:00 PM - 03:00 PM', period: 'Afternoon' },
  { time: '03:30 PM - 04:30 PM', period: 'Afternoon' },
  { time: '06:00 PM - 07:00 PM', period: 'Evening' },
  { time: '07:30 PM - 08:30 PM', period: 'Evening' },
  { time: '09:00 PM - 10:00 PM', period: 'Evening' },
];

const SUBJECTS_LIST = [
  'Computational Thinking',
  'Mathematics for Data Science 1',
  'Statistics for Data Science 1',
  'English 1',
  'Mathematics for Data Science 2',
  'Statistics for Data Science 2',
  'Programming in Python',
  'Machine Learning Foundations',
];

export default function OneToOneBookingPage() {
  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Starting tomorrow
    return d;
  });

  // Booking form state
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates[0].toISOString().split('T')[0],
  );
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0].time);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([SUBJECTS_LIST[0]]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('Qualifier');
  const [userNotes, setUserNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    slotDate: string;
    slotTime: string;
    plan: string;
  } | null>(null);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.length > 1
          ? prev.filter((s) => s !== subject)
          : prev
        : [...prev, subject],
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email, and mobile number.');
      return;
    }

    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject for tutoring.');
      return;
    }

    setIsSubmitting(true);

    try {
      const planObj = PLANS.find((p) => p.id === selectedPlan);
      const res = await fetch('/api/1on1/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          level,
          subjects: selectedSubjects,
          slotDate: selectedDate,
          slotTime: selectedTime,
          plan: planObj?.name || '1-on-1 Mentorship',
          userNotes: userNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to confirm booking.');
      } else {
        setConfirmedBooking({
          id: data.booking.id,
          slotDate: data.booking.slotDate,
          slotTime: data.booking.slotTime,
          plan: data.booking.plan,
        });
      }
    } catch {
      setError('Connection failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 font-sans selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Dedicated Academic Mentorship</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202824] tracking-tight font-display">
            Book 1-on-1 Tutoring & Doubt Clearing
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Get personalized guidance from top-performing IIT Madras BS alumni and instructors. Clear complex assignment doubts, debug Python scripts, and plan your exam targets.
          </p>
        </div>

        {confirmedBooking ? (
          /* Confirmation State */
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-neutral-900 font-display">
                Session Confirmed!
              </h2>
              <p className="text-xs text-neutral-500">
                Reservation ID: <span className="font-mono font-bold text-neutral-800">{confirmedBooking.id}</span>
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 text-xs text-left space-y-2 border border-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-500">Scheduled Date:</span>
                <span className="font-semibold text-neutral-800">{confirmedBooking.slotDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Time Slot:</span>
                <span className="font-semibold text-neutral-800">{confirmedBooking.slotTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Plan:</span>
                <span className="font-semibold text-neutral-800">{confirmedBooking.plan}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Google Meet connection link has been sent to your email. Your mentor will review your notes before the call.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setConfirmedBooking(null)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg text-xs transition"
              >
                Book Another Slot
              </button>
              <Link
                href="/courses"
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg text-xs flex items-center justify-center transition"
              >
                Explore Courses
              </Link>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookingSubmit} className="space-y-8">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Select Plan */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select Mentorship Plan</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-5 rounded-xl border cursor-pointer transition ${
                      selectedPlan === plan.id
                        ? 'border-emerald-700 bg-emerald-50/40 ring-1 ring-emerald-700'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-bold text-sm text-neutral-900 font-display">
                        {plan.name}
                      </span>
                      <span className="text-base font-extrabold text-neutral-900 font-mono">
                        {plan.price}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-800 font-semibold mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{plan.duration}</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Date Selector */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Choose Appointment Date</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {availableDates.map((d) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      type="button"
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-[11px] font-medium uppercase">{dayName}</span>
                      <span className="text-xl font-extrabold font-mono my-0.5">{dayNum}</span>
                      <span className="text-[10px] opacity-80">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Time Slot Selector */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <span>Select Available Time Slot</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      type="button"
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                        {slot.period}
                      </div>
                      <div className="text-xs font-bold font-mono mt-0.5">{slot.time}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Subject & Academic Level */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  4
                </span>
                <span>Academic Focus & Subjects</span>
              </h2>

              <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Your IITM BS Degree Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full sm:w-72 px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Qualifier">Qualifier Stage</option>
                    <option value="Foundation">Foundation Level (Term 1 - 4)</option>
                    <option value="Diploma">Diploma Level (Data Science / Programming)</option>
                    <option value="Degree">Degree / Capstone Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Select Subject(s) to Discuss
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS_LIST.map((subj) => {
                      const isPicked = selectedSubjects.includes(subj);
                      return (
                        <button
                          type="button"
                          key={subj}
                          onClick={() => toggleSubject(subj)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition ${
                            isPicked
                              ? 'bg-emerald-800 text-white font-semibold'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {subj}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    What specific questions or topics do you want help with? (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Need assistance with Week 3 recursion assignment, and dry running past Quiz 1 question 8..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Student Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  5
                </span>
                <span>Your Contact Details</span>
              </h2>

              <div className="bg-white p-6 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@student.iitm.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">WhatsApp Mobile</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="text-xs text-neutral-500">
                <span>Maximum 3 bookings per day limit strictly enforced.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#29493e] hover:bg-[#1f382f] disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm 1:1 Appointment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
