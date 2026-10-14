'use client';

/**
 * Payment Failure & Recovery Portal
 * Module: Commercial Payments (src/app/(student)/payment-failed/page.tsx)
 *
 * Informs learners when a transaction is declined or cancelled,
 * explaining the exact failure diagnostic and offering a frictionless path to retry checkout.
 */

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, LifeBuoy, ArrowLeft } from 'lucide-react';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  const errorMessage =
    searchParams?.get('error') ||
    'The payment was declined by your bank or the transaction was cancelled before completion.';

  return (
    <div className="min-h-screen bg-[#f8f9f5] flex items-center justify-center p-4 text-[#1e2722]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm space-y-6">
        {/* Error Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
            Payment Not Completed
          </h1>

          <p className="text-xs text-neutral-600 leading-relaxed">
            We could not complete your course transaction. No funds were captured from your account.
          </p>
        </div>

        {/* Diagnostic Card */}
        <div className="bg-red-50/60 rounded-xl border border-red-200 p-4 space-y-2 text-xs">
          <div className="font-semibold text-red-900">Failure Reason:</div>
          <p className="text-red-700 leading-relaxed font-mono text-[11px] break-words">
            {errorMessage}
          </p>
          {orderId && (
            <div className="pt-2 border-t border-red-100 text-[10px] text-red-600 font-mono">
              Ref: {orderId}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 bg-[#202824] hover:bg-[#29493e] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Payment</span>
          </button>

          <Link
            href="/courses"
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Course Catalog</span>
          </Link>
        </div>

        {/* Help Link */}
        <div className="text-center pt-2">
          <a
            href="mailto:support@alphaiitian.com"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Contact Payment Support Desk</span>
          </a>
        </div>
      </div>
    </div>
  );
}
