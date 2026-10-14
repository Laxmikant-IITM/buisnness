/**
 * Card Component
 * Module: UI Primitives (src/components/ui/card.tsx)
 *
 * Container component for organizing content into structured, clean panels.
 * Provides composable subcomponents (CardHeader, CardTitle, CardContent, CardFooter)
 * and configurable padding variants.
 */

import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Internal padding scale */
  padding?: CardPadding;
  /** Optional hover elevation effect */
  hoverable?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Main Card surface container.
 */
export function Card({
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-neutral-200/80 shadow-xs transition-all duration-200',
        hoverable ? 'hover:shadow-md hover:border-neutral-300' : '',
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional action or badge displayed on header right */
  action?: React.ReactNode;
}

/**
 * Header section of a card, aligning titles and contextual actions.
 */
export function CardHeader({ action, className = '', children, ...rest }: CardHeaderProps) {
  return (
    <div
      className={['flex items-start justify-between gap-4 pb-4 border-b border-neutral-100', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="space-y-1 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Primary title heading for CardHeader.
 */
export function CardTitle({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={['text-base font-bold text-neutral-900 font-display tracking-tight', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </h3>
  );
}

/**
 * Subtle descriptive text accompanying CardTitle.
 */
export function CardDescription({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={['text-xs text-neutral-500 font-body', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </p>
  );
}

/**
 * Main scrollable or structured content container within a Card.
 */
export function CardContent({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['py-2 font-body text-sm text-neutral-700', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

/**
 * Bottom action area or metadata footer within a Card.
 */
export function CardFooter({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['flex items-center justify-between gap-3 pt-4 border-t border-neutral-100', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
