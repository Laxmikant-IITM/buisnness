'use client';

/**
 * Candidate Telemetry Monitoring Component
 * Module: Dashboard Components (src/components/dashboard/candidate-telemetry-table.tsx)
 *
 * Real-time anti-cheat proctoring room monitor for managerial and administrative roles.
 * Displays candidate tab-blur counts, fullscreen locks, risk status, and manual room unlock controls.
 * Uses 100% clean SVG icons with zero emojis.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export interface TelemetrySession {
  id: string;
  candidateName: string;
  studentId: string;
  examTitle: string;
  tabBlurCount: number;
  maxViolations: number;
  fullscreenActive: boolean;
  durationMinutes: number;
  riskLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'SUBMITTED' | 'LOCKED';
}

const initialTelemetrySessions: TelemetrySession[] = [
  {
    id: 'tel-1',
    candidateName: 'Aditya Verma',
    studentId: 'IITM-24BS-1042',
    examTitle: 'Calculus & Linear Algebra Sunday Mock',
    tabBlurCount: 0,
    maxViolations: 3,
    fullscreenActive: true,
    durationMinutes: 42,
    riskLevel: 'NORMAL',
    status: 'ACTIVE',
  },
  {
    id: 'tel-2',
    candidateName: 'Pooja Iyer',
    studentId: 'IITM-24BS-0891',
    examTitle: 'Statistics for Data Science Quiz 2 Sim',
    tabBlurCount: 2,
    maxViolations: 3,
    fullscreenActive: true,
    durationMinutes: 58,
    riskLevel: 'WARNING',
    status: 'ACTIVE',
  },
  {
    id: 'tel-3',
    candidateName: 'Karthik Raja',
    studentId: 'IITM-23BS-3104',
    examTitle: 'Python OOP & DSA Benchmark Test',
    tabBlurCount: 3,
    maxViolations: 3,
    fullscreenActive: false,
    durationMinutes: 75,
    riskLevel: 'CRITICAL',
    status: 'LOCKED',
  },
  {
    id: 'tel-4',
    candidateName: 'Meera Nair',
    studentId: 'IITM-24BS-2045',
    examTitle: 'Calculus & Linear Algebra Sunday Mock',
    tabBlurCount: 0,
    maxViolations: 3,
    fullscreenActive: true,
    durationMinutes: 24,
    riskLevel: 'NORMAL',
    status: 'ACTIVE',
  },
];

export function CandidateTelemetryTable() {
  const [telemetrySessions, setTelemetrySessions] = useState<TelemetrySession[]>(initialTelemetrySessions);
  const [telemetryFilter, setTelemetryFilter] = useState<'ALL' | 'ACTIVE' | 'WARNING' | 'LOCKED'>('ALL');

  const handleUnlockCandidate = (sessionId: string) => {
    setTelemetrySessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, tabBlurCount: Math.max(0, s.tabBlurCount - 1), riskLevel: 'NORMAL', status: 'ACTIVE' }
          : s
      )
    );
  };

  const handleLockCandidate = (sessionId: string) => {
    setTelemetrySessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, status: 'LOCKED', riskLevel: 'CRITICAL' }
          : s
      )
    );
  };

  const filteredSessions = useMemo(() => {
    return telemetrySessions.filter((s) => {
      if (telemetryFilter === 'ACTIVE') return s.status === 'ACTIVE';
      if (telemetryFilter === 'WARNING') return s.riskLevel === 'WARNING' || s.riskLevel === 'CRITICAL';
      if (telemetryFilter === 'LOCKED') return s.status === 'LOCKED';
      return true;
    });
  }, [telemetrySessions, telemetryFilter]);

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-display">
              Candidate Anti-Cheat Telemetry
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Real-time proctoring telemetry with tab-blur limits, fullscreen lock, and session controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setTelemetryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                telemetryFilter === 'ALL' ? 'bg-stone-800 text-white font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({telemetrySessions.length})
            </button>
            <button
              type="button"
              onClick={() => setTelemetryFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                telemetryFilter === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800' : 'text-stone-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setTelemetryFilter('WARNING')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                telemetryFilter === 'WARNING' ? 'bg-amber-950 text-amber-400 font-bold border border-amber-800' : 'text-stone-400 hover:text-white'
              }`}
            >
              Flagged
            </button>
            <button
              type="button"
              onClick={() => setTelemetryFilter('LOCKED')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                telemetryFilter === 'LOCKED' ? 'bg-red-950 text-red-400 font-bold border border-red-800' : 'text-stone-400 hover:text-white'
              }`}
            >
              Locked
            </button>
          </div>

          <Link
            href="/manager/exams"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 text-xs font-mono text-stone-300 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-900/90 text-stone-400 font-mono text-[11px] border-b border-stone-800 uppercase">
            <tr>
              <th className="py-2.5 px-3">Candidate & ID</th>
              <th className="py-2.5 px-3">Exam Room</th>
              <th className="py-2.5 px-3">Tab-Blur</th>
              <th className="py-2.5 px-3">Fullscreen</th>
              <th className="py-2.5 px-3">Risk</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono">
            {filteredSessions.map((session) => (
              <tr key={session.id} className="hover:bg-stone-900/40 transition-colors">
                <td className="py-3 px-3 font-sans">
                  <div className="font-bold text-white text-xs">{session.candidateName}</div>
                  <div className="text-[11px] text-stone-500 font-mono">{session.studentId}</div>
                </td>
                <td className="py-3 px-3 text-stone-300 font-sans">
                  <div>{session.examTitle}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{session.durationMinutes}m elapsed</div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`font-bold ${
                      session.tabBlurCount === 0
                        ? 'text-emerald-400'
                        : session.tabBlurCount < session.maxViolations
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {session.tabBlurCount} / {session.maxViolations}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {session.fullscreenActive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-400 text-[11px]">
                      <Unlock className="w-3 h-3" />
                      <span>Exited</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      session.riskLevel === 'NORMAL'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : session.riskLevel === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                        : 'bg-red-950 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {session.riskLevel}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {session.status === 'LOCKED' ? (
                    <button
                      type="button"
                      onClick={() => handleUnlockCandidate(session.id)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 hover:text-stone-950 text-stone-200 text-[11px] font-sans font-bold transition-all shadow-sm"
                    >
                      Allow Unlock
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLockCandidate(session.id)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 hover:bg-red-950 hover:text-red-300 text-stone-400 text-[11px] font-sans transition-colors"
                    >
                      Lock Room
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
