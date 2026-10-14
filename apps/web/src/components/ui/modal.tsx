'use client';

/**
 * Modal Component
 * Module: UI Primitives (src/components/ui/modal.tsx)
 *
 * Controlled dialog component featuring backdrop overlay, keyboard escape listener,
 * body scroll locking, accessible ARIA attributes, and smooth entry transitions.
 */

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired when user requests close via backdrop, escape key, or close button */
  onClose: () => void;
  /** Modal header title */
  title?: React.ReactNode;
  /** Optional secondary subtitle or description */
  description?: string;
  /** Dialog body content */
  children: React.ReactNode;
  /** Optional actions or buttons rendered at the bottom */
  footer?: React.ReactNode;
  /** Max-width size preset for dialog card */
  size?: ModalSize;
  /** If true, clicking the outside overlay dismisses the modal */
  closeOnBackdropClick?: boolean;
  /** Whether to render the header close 'X' icon */
  showCloseButton?: boolean;
  /** Optional custom CSS classes for dialog content card */
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
};

/**
 * Accessible Modal dialog for confirmations, complex forms, and detail views.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descId = `${dialogId}-desc`;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity duration-200"
        aria-hidden="true"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        className={[
          'relative w-full z-10 flex flex-col bg-white rounded-xl shadow-2xl border border-neutral-200',
          'overflow-hidden transform transition-all duration-200',
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-neutral-200">
            <div className="space-y-1">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-bold text-neutral-900 font-display tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-xs text-neutral-500 font-body">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 -mr-1.5 -mt-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 font-body text-sm text-neutral-700">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
