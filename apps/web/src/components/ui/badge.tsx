/**
 * Badge Component
 * Module: UI Primitives (src/components/ui/badge.tsx)
 *
 * Status indicator and tag element highlighting state, categories, or metrics.
 * Supports brand, success, warning, error, and neutral color styles with optional indicator dot.
 */

import React from 'react';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'error' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual color theme indicating status */
  variant?: BadgeVariant;
  /** Size scale for typography and padding */
  size?: BadgeSize;
  /** When true, renders a small colored status dot before the label */
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  brand: {
    container: 'bg-brand-50 text-brand-800 border-brand-200/80',
    dot: 'bg-brand-600',
  },
  success: {
    container: 'bg-success-50 text-success-800 border-success-200/80',
    dot: 'bg-success-600',
  },
  warning: {
    container: 'bg-warning-50 text-warning-800 border-warning-200/80',
    dot: 'bg-warning-600',
  },
  error: {
    container: 'bg-error-50 text-error-800 border-error-200/80',
    dot: 'bg-error-600',
  },
  neutral: {
    container: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    dot: 'bg-neutral-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] leading-4 px-2 py-0.5 gap-1.5 rounded-md font-medium',
  md: 'text-xs leading-5 px-2.5 py-0.5 gap-1.5 rounded-md font-semibold',
};

/**
 * Compact status badge for tagging items, entities, and states.
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={[
        'inline-flex items-center justify-center font-display border select-none transition-colors',
        styles.container,
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
