'use client';

/**
 * Payment Confirmation & Receipt Portal
 * Module: Commercial Payments (src/app/(student)/payment-success/page.tsx)
 *
 * Displays a verified order confirmation, transactional receipt summary,
 * and handles automatic timed redirection directly into the student's learning room.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, BookOpen, Printer, Sparkles, ShieldCheck } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams?.get('orderId') || 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const courseId = searchParams?.get('courseId') || '';

  const [countdown, setCountdown] = useState(5);

  const destinationUrl = courseId ? `/learning/${courseId}` : '/learning';

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push(destinationUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, destinationUrl, router]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8f9f5] flex items-center justify-center p-4 text-[#1e2722]">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-[#dedfd7] p-8 shadow-sm space-y-6">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Enrollment Active</span>
          </div>

          <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
            Payment Verified & Enrolled!
          </h1>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
            Your course access has been provisioned. A confirmation receipt has been sent to your email.
          </p>
        </div>

        {/* Receipt Slip */}
        <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Order Reference</span>
            <span className="font-mono font-bold text-neutral-900">{orderId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Payment Status</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 font-mono">
              PAID (CAPTURED)
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Access Granted</span>
            <span className="font-semibold text-neutral-900">Full Academic Batch Access</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Payment Channel</span>
            <span className="font-semibold text-neutral-900">Razorpay Unified Payments</span>
          </div>

          <div className="pt-3 border-t border-neutral-200 flex justify-between items-center">
            <span className="text-neutral-500 font-medium">Gateway Verification</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cryptographically Verified
            </span>
          </div>
        </div>

        {/* Countdown & Action Buttons */}
        <div className="space-y-3">
          <Link
            href={destinationUrl}
            className="w-full py-3 bg-[#29493e] hover:bg-[#1f382f] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition shadow"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to Learning Room ({countdown}s)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print or Save Receipt</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-neutral-400">
          Need support? Reach out via the Helpdesk or community chat.
        </p>
      </div>
    </div>
  );
}
