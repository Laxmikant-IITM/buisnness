'use client';

/**
 * Public Credential Verification Portal
 * Module: Staff & Credentials
 * 
 * Allows students, employers, and educational institutions to verify
 * the active credentials and tenure of faculty, mentors, and staff.
 */

import React, { useState } from 'react';
import { ShieldCheck, Search, AlertCircle, CheckCircle2, UserCheck, Calendar, Briefcase, Printer } from 'lucide-react';
import { SiteNavbar } from '@/components/layout/site-navbar';

interface VerifiedEmployee {
  employeeId: string;
  fullName: string;
  department: string;
  role: string;
  tenure: string;
  status: string;
  photoUrl: string | null;
  issueDate: string;
}

export default function VerifyCredentialsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedEmployee | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(id)}`);
      const data = await res.json();

      if (!res.ok || !data.verified) {
        setError(data.error || 'Credential not found. Please check the ID.');
      } else {
        setResult(data.employee);
      }
    } catch {
      setError('Unable to connect to verification server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 font-sans selection:bg-emerald-800 selection:text-white">
      <SiteNavbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-800 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official Verification Ledger</span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900 font-display">
          Staff & Educator Verification
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-lg mx-auto">
          Verify active educators, mentors, teaching assistants, and verified personnel of the GenZ IITian ecosystem.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter Employee / Certificate ID (e.g. GZ-EDU-101)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm mb-8">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Verification Failed</div>
            <div className="text-xs text-red-700 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Verified Certificate Card */}
      {result && (
        <div className="max-w-2xl mx-auto bg-white border-2 border-emerald-600 rounded-2xl shadow-xl overflow-hidden print:border-black">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
                  Verified Official Credential
                </div>
                <div className="text-xl font-bold font-display">{result.fullName}</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs flex items-center gap-1.5 transition-colors print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

          {/* Details Body */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Credential ID
                </div>
                <div className="mt-1 font-mono font-bold text-base text-neutral-900">
                  {result.employeeId}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Credential Status
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      result.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {result.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  <span>Designation & Role</span>
                </div>
                <div className="mt-1 font-semibold text-sm text-neutral-900">{result.role}</div>
                <div className="text-xs text-neutral-500">{result.department}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Tenure & Standing</span>
                </div>
                <div className="mt-1 font-semibold text-sm text-neutral-900">{result.tenure}</div>
                <div className="text-xs text-neutral-500">
                  Issued: {new Date(result.issueDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <div>Cryptographically logged & signed by platform authority</div>
              <div className="font-mono text-[10px]">ID: {result.employeeId}</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
