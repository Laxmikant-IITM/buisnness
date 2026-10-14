/**
 * Input Component
 * Module: UI Primitives (src/components/ui/input.tsx)
 *
 * Form input component providing integrated label, error messaging, helper text,
 * and support for various input types (text, email, password, number, search, etc.).
 */

import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text rendered above input */
  label?: string;
  /** Informational helper text rendered beneath input */
  helperText?: string;
  /** Error message string triggering invalid state */
  error?: string;
  /** Optional icon or decorative node placed at input start */
  leftNode?: React.ReactNode;
  /** Optional icon or decorative node placed at input end */
  rightNode?: React.ReactNode;
  /** Optional container className */
  wrapperClassName?: string;
}

/**
 * Accessible, styled Input primitive for text fields and form entries.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftNode,
      rightNode,
      id: customId,
      required,
      disabled,
      className = '',
      wrapperClassName = '',
      type = 'text',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    const hasError = Boolean(error);
    const describedBy = hasError ? errorId : helperText ? helperId : undefined;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-neutral-800 font-display flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-error-600 font-bold" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftNode && (
            <div className="absolute left-3 flex items-center pointer-events-none text-neutral-500">
              {leftNode}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={[
              'w-full h-10 rounded-lg border bg-white px-3 text-sm font-body text-neutral-900 placeholder:text-neutral-400',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              leftNode ? 'pl-9' : '',
              rightNode ? 'pr-9' : '',
              hasError
                ? 'border-error-500 focus-visible:border-error-600 focus-visible:ring-error-400/30'
                : 'border-neutral-300 hover:border-neutral-400 focus-visible:border-brand-600 focus-visible:ring-brand-500/20',
              disabled ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          />

          {rightNode && (
            <div className="absolute right-3 flex items-center text-neutral-500">
              {rightNode}
            </div>
          )}
        </div>

        {hasError && (
          <p id={errorId} className="text-xs text-error-600 font-medium font-body flex items-center gap-1">
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-neutral-500 font-body">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
