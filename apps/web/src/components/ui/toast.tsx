'use client';

/**
 * Toast Notification System
 * Module: UI Primitives (src/components/ui/toast.tsx)
 *
 * Provides a context provider and `useToast` hook for dispatching accessible,
 * auto-dismissing toast notifications across the application (success, error, info, warning).
 */

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  /** Unique identifier for the toast */
  id: string;
  /** Primary headline message */
  title: string;
  /** Optional secondary details or description */
  description?: string;
  /** Visual type and tone of notification */
  variant?: ToastVariant;
  /** Auto-dismiss duration in milliseconds (defaults to 4000ms) */
  duration?: number;
}

export type ToastInput = Omit<ToastItem, 'id'> & { id?: string };

interface ToastContextValue {
  /** Enqueue a custom toast */
  showToast: (toast: ToastInput) => string;
  /** Quick helper for success notifications */
  success: (title: string, description?: string) => string;
  /** Quick helper for error alerts */
  error: (title: string, description?: string) => string;
  /** Quick helper for informational messages */
  info: (title: string, description?: string) => string;
  /** Quick helper for warning notices */
  warning: (title: string, description?: string) => string;
  /** Dismiss a specific toast by its ID */
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<
  ToastVariant,
  { icon: React.ComponentType<{ className?: string }>; border: string; bg: string; text: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    border: 'border-success-200',
    bg: 'bg-white',
    text: 'text-neutral-900',
    iconColor: 'text-success-600',
  },
  error: {
    icon: AlertCircle,
    border: 'border-error-200',
    bg: 'bg-white',
    text: 'text-neutral-900',
    iconColor: 'text-error-600',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-warning-200',
    bg: 'bg-white',
    text: 'text-neutral-900',
    iconColor: 'text-warning-600',
  },
  info: {
    icon: Info,
    border: 'border-info-200',
    bg: 'bg-white',
    text: 'text-neutral-900',
    iconColor: 'text-info-600',
  },
};

/**
 * Toast Provider wrapping the application or subtree to enable `useToast()` hook calls.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ id, title, description, variant = 'info', duration = 4500 }: ToastInput) => {
      const toastId = id || Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id: toastId, title, description, variant, duration };

      setToasts((prev) => [...prev.filter((t) => t.id !== toastId), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(toastId);
        }, duration);
      }

      return toastId;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: 'success' }),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: 'error' }),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: 'info' }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => showToast({ title, description, variant: 'warning' }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      {/* Toast viewport container */}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant || 'info'];
          const IconComponent = config.icon;

          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : 'status'}
              className={[
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-xs',
                'animate-in fade-in slide-in-from-bottom-2 duration-200 transition-all',
                config.bg,
                config.border,
              ].join(' ')}
            >
              <IconComponent className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
              <div className="flex-1 space-y-1">
                <p className={`text-sm font-semibold font-display ${config.text}`}>
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-xs text-neutral-600 font-body leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 -mr-1 -mt-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

/**
 * Access the application toast notification dispatcher.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
