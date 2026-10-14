/**
 * Table Component
 * Module: UI Primitives (src/components/ui/table.tsx)
 *
 * Semantic, accessible data table component with structured composables
 * (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
 * and responsive pagination controls.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Outer container wrapper className */
  wrapperClassName?: string;
}

/**
 * Root table element with horizontal overflow scroll container.
 */
export function Table({ className = '', wrapperClassName = '', children, ...rest }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto border border-neutral-200/80 rounded-xl bg-white shadow-2xs ${wrapperClassName}`}>
      <table className={`w-full text-left text-sm font-body border-collapse ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

/**
 * Table Header container (thead).
 */
export function TableHeader({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-display text-xs uppercase tracking-wider font-semibold ${className}`}
      {...rest}
    >
      {children}
    </thead>
  );
}

/**
 * Table Body container (tbody).
 */
export function TableBody({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-neutral-100 text-neutral-800 ${className}`} {...rest}>
      {children}
    </tbody>
  );
}

/**
 * Table Footer container (tfoot).
 */
export function TableFooter({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot className={`bg-neutral-50 border-t border-neutral-200 font-medium ${className}`} {...rest}>
      {children}
    </tfoot>
  );
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** When true, row highlights on hover */
  hoverable?: boolean;
}

/**
 * Table Row (tr).
 */
export function TableRow({ hoverable = true, className = '', children, ...rest }: TableRowProps) {
  return (
    <tr
      className={[
        'transition-colors duration-100',
        hoverable ? 'hover:bg-neutral-50/70' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </tr>
  );
}

/**
 * Table Header Cell (th).
 */
export function TableHead({
  className = '',
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3.5 font-semibold text-xs text-neutral-600 ${className}`} {...rest}>
      {children}
    </th>
  );
}

/**
 * Table Data Cell (td).
 */
export function TableCell({
  className = '',
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3.5 text-sm align-middle ${className}`} {...rest}>
      {children}
    </td>
  );
}

export interface TablePaginationProps {
  /** Current 1-based page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total count of records */
  totalItems?: number;
  /** Page size count */
  pageSize?: number;
  /** Callback fired on page switch */
  onPageChange: (page: number) => void;
  /** Optional container className */
  className?: string;
}

/**
 * Accessible pagination footer for data tables.
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: TablePaginationProps) {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-neutral-200 text-xs text-neutral-600 font-body ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {totalItems !== undefined && (
          <span>
            Showing{' '}
            <strong className="text-neutral-900 font-semibold">
              {Math.min((currentPage - 1) * (pageSize || 10) + 1, totalItems)}
            </strong>{' '}
            to{' '}
            <strong className="text-neutral-900 font-semibold">
              {Math.min(currentPage * (pageSize || 10), totalItems)}
            </strong>{' '}
            of <strong className="text-neutral-900 font-semibold">{totalItems}</strong> results
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-neutral-500 mr-2">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="p-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="p-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
