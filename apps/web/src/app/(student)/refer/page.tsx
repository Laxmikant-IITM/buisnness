'use client';

/**
 * Student Referral & Loyalty Rewards Hub
 * Module: Commercial Referrals (src/app/(student)/refer/page.tsx)
 *
 * Provides students with their unique referral link, wallet balance ledger,
 * social sharing integrations, and visual tiered milestone progression.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  Copy,
  Check,
  Coins,
  Users,
  Trophy,
  Share2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface MilestoneItem {
  referralsRequired: number;
  bonusCoins: number;
  description: string;
  isCompleted: boolean;
}

interface ReferralHistoryItem {
  id: string;
  buyerMaskedEmail: string;
  orderAmountPaise: number;
  referrerRewardCoins: number;
  createdAt: string;
}

export default function ReferralHubPage() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('ALPHA');
  const [shareableUrl, setShareableUrl] = useState('');
  const [walletBalanceCoins, setWalletBalanceCoins] = useState(0);
  const [walletBalanceRupees, setWalletBalanceRupees] = useState(0);
  const [lifetimeReferrals, setLifetimeReferrals] = useState(0);
  const [quarterlyReferrals, setQuarterlyReferrals] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReferralData() {
      try {
        const res = await fetch('/api/referral');
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referralCode || 'ALPHA');
          setShareableUrl(data.shareableUrl || window.location.origin + '/courses?ref=' + data.referralCode);
          setWalletBalanceCoins(data.walletBalanceCoins || 0);
          setWalletBalanceRupees(data.walletBalanceRupees || 0);
          setLifetimeReferrals(data.lifetimeReferrals || 0);
          setQuarterlyReferrals(data.quarterlyReferrals || 0);
          setMilestones(data.milestoneRoadmap || []);
          setHistory(data.history || []);
        } else {
          // Fallback initial demonstration state
          setShareableUrl(window.location.origin + '/courses?ref=' + referralCode);
          setMilestones([
            { referralsRequired: 5, bonusCoins: 50, description: 'Starter Advocate: 5 Referrals', isCompleted: false },
            { referralsRequired: 10, bonusCoins: 110, description: 'Campus Ambassador: 10 Referrals', isCompleted: false },
            { referralsRequired: 20, bonusCoins: 250, description: 'Legendary Mentor: 20 Referrals', isCompleted: false },
          ]);
        }
      } catch (err) {
        console.warn('Could not load referral data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReferralData();
  }, [referralCode]);

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Use my referral code ${referralCode} to get 5% OFF any IIT Madras BS Degree course on Northstar LMS: ${shareableUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Studying for IIT Madras BS Degree? Get 5% OFF academic batches with my code ${referralCode} on @AlphaIITian: ${shareableUrl}`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#7D2F1A] rounded-full text-xs font-bold font-mono">
          <Gift className="w-3.5 h-3.5" />
          <span>Referral & Loyalty Program</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
          Share the Knowledge, Earn Coins
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B66] dark:text-[#9E9D97] leading-relaxed">
          Give your peers an instant <strong>5% discount</strong> on any course. You earn <strong>5% in loyalty coins</strong> on every completed enrollment, plus unlockable milestone bonuses.
        </p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Balance Card */}
        <div className="bg-[#E05A33] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-rose-100 font-semibold uppercase tracking-wider font-mono">
              <span>Wallet Balance</span>
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-white pt-2">
              {walletBalanceCoins.toLocaleString('en-IN')} <span className="text-sm text-rose-100 font-sans font-medium">Coins</span>
            </div>
          </div>
          <div className="pt-4 border-t border-[#C94A26] text-xs text-rose-100 flex justify-between">
            <span>Equivalent Value:</span>
            <span className="font-bold font-mono text-white">₹{walletBalanceRupees.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Quarterly Referrals */}
        <div className="bg-white dark:bg-[#1C1C1A] rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8C8C87] font-semibold uppercase tracking-wider font-mono">
              <span>Quarterly Referrals</span>
              <Calendar className="w-4 h-4 text-[#8C8C87]" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-[#1A1A19] dark:text-[#F5F3EF] pt-2">
              {quarterlyReferrals} <span className="text-sm text-[#8C8C87] font-sans font-medium">Students</span>
            </div>
          </div>
          <div className="pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A] text-xs text-[#8C8C87] flex justify-between">
            <span>Window:</span>
            <span className="font-medium text-[#1A1A19] dark:text-[#F5F3EF]">Current 90-Day Cycle</span>
          </div>
        </div>

        {/* Lifetime Referrals */}
        <div className="bg-white dark:bg-[#1C1C1A] rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8C8C87] font-semibold uppercase tracking-wider font-mono">
              <span>Lifetime Referrals</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-[#1A1A19] dark:text-[#F5F3EF] pt-2">
              {lifetimeReferrals} <span className="text-sm text-[#8C8C87] font-sans font-medium">Total</span>
            </div>
          </div>
          <div className="pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A] text-xs text-[#8C8C87] flex justify-between">
            <span>Program Tier:</span>
            <span className="font-bold text-[#E05A33]">
              {lifetimeReferrals >= 20 ? 'Legendary' : lifetimeReferrals >= 10 ? 'Ambassador' : 'Advocate'}
            </span>
          </div>
        </div>
      </div>

      {/* Shareable Code & Link Box */}
      <div className="bg-white dark:bg-[#1C1C1A] rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
              Your Unique Referral Code
            </h2>
            <p className="text-xs text-[#8C8C87] mt-0.5">
              Friends enter this code at checkout for 5% off, or use your direct link.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              className="px-4 py-2 bg-[#1A1A19] hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Share on X</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Code Box */}
          <div className="md:col-span-4 p-4 rounded-xl bg-[#FAFAF7] dark:bg-[#161615] border border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#8C8C87] uppercase font-semibold font-mono">Your Referral Code</div>
              <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-mono tracking-wider">
                {referralCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 rounded-lg hover:bg-[#E8E6E1] dark:hover:bg-[#252522] transition-colors text-[#1A1A19] dark:text-[#F5F3EF] cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-5 h-5 text-[#E05A33]" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          {/* Link Box */}
          <div className="md:col-span-8 p-4 rounded-xl bg-[#FAFAF7] dark:bg-[#161615] border border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between gap-3">
            <div className="truncate">
              <div className="text-[10px] text-[#8C8C87] uppercase font-semibold font-mono">Direct Shareable Link</div>
              <div className="text-xs font-mono text-[#1A1A19] dark:text-[#F5F3EF] truncate">
                {shareableUrl || 'https://lms.alphaiitian.com/courses?ref=' + referralCode}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Milestone Roadmap */}
      <div className="bg-white dark:bg-[#1C1C1A] rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-[#E05A33] uppercase tracking-wider font-mono">
            Achievement Progression
          </span>
          <h2 className="text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
            Referral Milestone Rewards
          </h2>
          <p className="text-xs text-[#8C8C87] mt-0.5">
            Unlock extra bonus coin payouts as you refer more students across your academic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {milestones.map((m) => {
            const progressPct = Math.min(100, Math.round((lifetimeReferrals / m.referralsRequired) * 100));
            return (
              <div
                key={m.referralsRequired}
                className={`p-5 rounded-xl border transition-all ${
                  m.isCompleted
                    ? 'bg-[#FDF0EB] border-[#F5B8A3] dark:bg-[#3A150C] dark:border-[#7D2F1A]'
                    : 'bg-[#FAFAF7] dark:bg-[#161615] border-[#E8E6E1] dark:border-[#2D2D2A]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                    {m.referralsRequired} Referrals
                  </span>
                  {m.isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E05A33] bg-white dark:bg-[#1C1C1A] px-2 py-0.5 rounded border border-[#F5B8A3] dark:border-[#7D2F1A]">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#8C8C87] font-mono">
                      {lifetimeReferrals} / {m.referralsRequired}
                    </span>
                  )}
                </div>

                <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-mono mb-1">
                  +{m.bonusCoins} <span className="text-xs font-sans text-[#8C8C87]">Bonus Coins</span>
                </div>

                <p className="text-xs text-[#6B6B66] dark:text-[#9E9D97] mb-4">{m.description}</p>

                {/* Progress Bar */}
                <div className="w-full bg-[#E8E6E1] dark:bg-[#2D2D2A] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-[#E05A33]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-[#1C1C1A] rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
          <h3 className="text-base font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
            Referral Transaction Ledger
          </h3>
          <p className="text-xs text-[#8C8C87] mt-0.5">
            Live ledger of coin rewards credited when peers complete course purchases.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#8C8C87]">
            No referral transactions logged yet. Share your code to get started!
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF7] dark:bg-[#161615] text-[#8C8C87] uppercase font-semibold text-[10px] font-mono border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Referee</th>
                <th className="py-3 px-6">Course Order</th>
                <th className="py-3 px-6 text-right">Coin Reward Credited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2D2D2A]">
              {history.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FAFAF7] dark:hover:bg-[#161615] transition-colors">
                  <td className="py-3 px-6 font-mono text-[#8C8C87]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 font-medium text-[#1A1A19] dark:text-[#F5F3EF]">
                    {tx.buyerMaskedEmail}
                  </td>
                  <td className="py-3 px-6 font-mono text-[#6B6B66] dark:text-[#9E9D97]">
                    ₹{Math.floor(tx.orderAmountPaise / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-6 text-right font-mono font-bold text-[#E05A33]">
                    +{tx.referrerRewardCoins} Coins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
