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
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] font-sans selection:bg-[#FDF0EB] selection:text-[#E05A33]">
      <SiteNavbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-xs font-semibold rounded-full border border-[#F5B8A3] dark:border-[#7D2F1A] mb-2 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Ledger</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
            Staff & Educator Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#8C8C87] max-w-md mx-auto">
            Verify official educator and mentor credentials.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C8C87] absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Credential ID (e.g. GZ-EDU-101)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-xl text-xs sm:text-sm text-[#1A1A19] dark:text-[#F5F3EF] placeholder:text-[#8C8C87] focus:outline-none focus:ring-1 focus:ring-[#E05A33] font-mono shadow-xs"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#E05A33] hover:bg-[#C94A26] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-800 dark:text-red-300 text-xs sm:text-sm mb-8">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Verification Failed</div>
              <div className="text-xs text-red-700 dark:text-red-400 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Verified Certificate Card */}
        {result && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-2xl shadow-xs overflow-hidden print:border-black">
            {/* Top Banner */}
            <div className="bg-[#FDF0EB] dark:bg-[#3A150C]/60 text-[#1A1A19] dark:text-[#F5F3EF] p-6 flex justify-between items-center border-b border-[#F5B8A3]/40 dark:border-[#7D2F1A]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white dark:bg-[#1C1C1A] rounded-xl flex items-center justify-center border border-[#F5B8A3] dark:border-[#7D2F1A] shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-[#2D7A4F]" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wider uppercase text-[#E05A33] font-mono">
                    Verified Credential
                  </div>
                  <div className="text-xl font-bold font-display">{result.fullName}</div>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="p-2 bg-white dark:bg-[#1C1C1A] hover:bg-[#F5F3EF] dark:hover:bg-[#2D2D2A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg text-xs flex items-center gap-1.5 transition-colors print:hidden cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#8C8C87]" />
                <span className="font-semibold">Print</span>
              </button>
            </div>

            {/* Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-[#8C8C87] uppercase tracking-wide font-mono">
                    Credential ID
                  </div>
                  <div className="mt-1 font-mono font-bold text-base text-[#1A1A19] dark:text-[#F5F3EF]">
                    {result.employeeId}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#8C8C87] uppercase tracking-wide font-mono">
                    Status
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        result.status === 'ACTIVE'
                          ? 'bg-[#E7F5ED] text-[#2D7A4F] border border-[#C2E8D2]'
                          : 'bg-[#F5F3EF] dark:bg-[#2D2D2A] text-[#8C8C87]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {result.status}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#8C8C87] uppercase tracking-wide flex items-center gap-1 font-mono">
                    <Briefcase className="w-3 h-3 text-[#E05A33]" />
                    <span>Role</span>
                  </div>
                  <div className="mt-1 font-semibold text-sm text-[#1A1A19] dark:text-[#F5F3EF]">{result.role}</div>
                  <div className="text-xs text-[#8C8C87]">{result.department}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#8C8C87] uppercase tracking-wide flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-[#E05A33]" />
                    <span>Tenure</span>
                  </div>
                  <div className="mt-1 font-semibold text-sm text-[#1A1A19] dark:text-[#F5F3EF]">{result.tenure}</div>
                  <div className="text-xs text-[#8C8C87]">
                    Issued: {new Date(result.issueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between text-xs text-[#8C8C87]">
                <div>Signed by platform authority</div>
                <div className="font-mono text-[10px]">ID: {result.employeeId}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
