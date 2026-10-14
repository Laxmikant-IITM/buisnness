/**
 * Skeleton Component
 * Module: UI Primitives (src/components/ui/skeleton.tsx)
 *
 * Loading placeholder with subtle pulsing animation to reduce perceived wait times
 * while asynchronous data and images load.
 */

import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rounded';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual silhouette style */
  variant?: SkeletonVariant;
  /** Custom width style (e.g. '100%', '200px') */
  width?: string | number;
  /** Custom height style (e.g. '20px', '4rem') */
  height?: string | number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  rounded: 'rounded-xl',
  circular: 'rounded-full',
};

/**
 * Animated skeleton placeholder for loading screens and async cards.
 */
export function Skeleton({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-hidden="true"
      style={{
        width,
        height,
        ...style,
      }}
      className={[
        'animate-pulse bg-neutral-200/80 shrink-0',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
