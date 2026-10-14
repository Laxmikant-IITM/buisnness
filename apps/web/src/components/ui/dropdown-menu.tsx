'use client';

/**
 * Dropdown Menu Component
 * Module: UI Primitives (src/components/ui/dropdown-menu.tsx)
 *
 * Floating contextual menu with support for custom triggers, action items,
 * group labels, separators, keyboard dismissal (Escape/Click-outside), and alignment.
 */

import React, { createContext, useContext, useState, useRef, useEffect, useId } from 'react';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeMenu: () => void;
  menuId: string;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a DropdownMenu');
  }
  return context;
}

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Root container managing dropdown state and outside click detection.
 */
export function DropdownMenu({ children, className = '' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, closeMenu, menuId }}>
      <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

/**
 * Trigger button opening the contextual dropdown menu.
 */
export function DropdownMenuTrigger({ children, className = '' }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen, menuId } = useDropdown();

  return (
    <button
      type="button"
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-controls={menuId}
      onClick={() => setIsOpen((prev) => !prev)}
      className={[
        'inline-flex items-center justify-center cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Floating panel displaying dropdown menu items.
 */
export function DropdownMenuContent({
  children,
  align = 'right',
  className = '',
}: DropdownMenuContentProps) {
  const { isOpen, menuId } = useDropdown();

  if (!isOpen) return null;

  return (
    <div
      id={menuId}
      role="menu"
      tabIndex={-1}
      className={[
        'absolute z-50 mt-1.5 w-56 rounded-xl bg-white p-1.5 shadow-lg border border-neutral-200/90 focus:outline-none',
        'animate-in fade-in-0 zoom-in-95 duration-100',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  danger?: boolean;
}

/**
 * Clickable action item inside the DropdownMenuContent.
 */
export function DropdownMenuItem({
  children,
  icon,
  danger = false,
  onClick,
  disabled,
  className = '',
  ...rest
}: DropdownMenuItemProps) {
  const { closeMenu } = useDropdown();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
    closeMenu();
  };

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium font-body rounded-lg text-left transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:bg-neutral-100',
        danger
          ? 'text-error-600 hover:bg-error-50 hover:text-error-700'
          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon && <span className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-neutral-600">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

/**
 * Visual separator line between menu groupings.
 */
export function DropdownMenuSeparator({ className = '' }: { className?: string }) {
  return <div role="separator" className={`my-1 h-px bg-neutral-100 ${className}`} />;
}

/**
 * Non-clickable header/label text for group categorization.
 */
export function DropdownMenuLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-display ${className}`}
    >
      {children}
    </div>
  );
}
