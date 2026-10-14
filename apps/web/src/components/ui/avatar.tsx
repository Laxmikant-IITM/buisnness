'use client';

/**
 * Avatar Component
 * Module: UI Primitives (src/components/ui/avatar.tsx)
 *
 * Visual user representation displaying a profile image, with graceful fallback
 * to calculated initials and optional active presence/status badge.
 */

import React, { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image URL for user picture */
  src?: string | null;
  /** Accessible alt text */
  alt?: string;
  /** Full name used to generate fallback initials */
  name?: string;
  /** Size dimension presets */
  size?: AvatarSize;
  /** Optional user presence status indicator */
  status?: AvatarStatus;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; statusDot: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]', statusDot: 'h-1.5 w-1.5 ring-1' },
  sm: { container: 'h-8 w-8', text: 'text-xs', statusDot: 'h-2 w-2 ring-1.5' },
  md: { container: 'h-10 w-10', text: 'text-sm', statusDot: 'h-2.5 w-2.5 ring-2' },
  lg: { container: 'h-12 w-12', text: 'text-base', statusDot: 'h-3 w-3 ring-2' },
  xl: { container: 'h-16 w-16', text: 'text-lg', statusDot: 'h-3.5 w-3.5 ring-2' },
};

const statusClasses: Record<AvatarStatus, string> = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-error-500',
};

/**
 * Computes up to 2 uppercase initials from a user's name.
 */
function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar primitive displaying picture or fallback initials with optional presence dot.
 */
export function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  status,
  className = '',
  ...rest
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = sizeClasses[size];
  const initials = getInitials(name);
  const showFallback = !src || imgError;

  return (
    <div
      className={[
        'relative inline-flex items-center justify-center shrink-0 rounded-full font-display font-semibold select-none',
        sizeConfig.container,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {showFallback ? (
        <span
          className={[
            'h-full w-full rounded-full flex items-center justify-center bg-brand-100 text-brand-800 border border-brand-200/60',
            sizeConfig.text,
          ].join(' ')}
          aria-label={alt || name || 'User avatar'}
        >
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt={alt || name || 'User avatar'}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover border border-neutral-200"
        />
      )}

      {status && (
        <span
          className={[
            'absolute bottom-0 right-0 rounded-full ring-white',
            sizeConfig.statusDot,
            statusClasses[status],
          ].join(' ')}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export function AvatarImage({ src, alt = 'Avatar', className = '' }: { src?: string | null; alt?: string; className?: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className={`h-full w-full object-cover rounded-full ${className}`} />;
}

export function AvatarFallback({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`h-full w-full rounded-full flex items-center justify-center bg-brand-100 text-brand-800 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
