/**
 * Button Component
 * Module: UI Primitives (src/components/ui/button.tsx)
 *
 * A versatile, accessible button supporting multiple variants, sizes,
 * loading states, and leading/trailing icon decorations.
 */

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The visual hierarchy and styling variant */
  variant?: ButtonVariant;
  /** Size variant controlling padding, typography, and icon size */
  size?: ButtonSize;
  /** When true, renders a spinner and disables interactive pointer events */
  isLoading?: boolean;
  /** Optional element/icon rendered before button text */
  leftIcon?: React.ReactNode;
  /** Optional element/icon rendered after button text */
  rightIcon?: React.ReactNode;
  /** If true, stretches the button across its container width */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-xs focus-visible:ring-brand-600',
  secondary:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-300 focus-visible:ring-neutral-400',
  outline:
    'bg-transparent text-neutral-800 border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-400',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 focus-visible:ring-neutral-400',
  danger:
    'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-xs focus-visible:ring-error-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md font-medium',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg font-medium',
  lg: 'h-12 px-5 text-base gap-2.5 rounded-lg font-semibold',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Reusable Button component providing consistent action affordances across the LMS application.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={[
          'inline-flex items-center justify-center font-body transition-colors duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {isLoading && (
          <Loader2
            className={`animate-spin ${iconSizes[size]}`}
            aria-hidden="true"
          />
        )}
        {!isLoading && leftIcon && (
          <span className={`inline-flex shrink-0 ${iconSizes[size]}`} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className={`inline-flex shrink-0 ${iconSizes[size]}`} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
