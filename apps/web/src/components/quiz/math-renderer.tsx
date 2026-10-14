/**
 * @file apps/web/src/components/quiz/math-renderer.tsx
 * @description React KaTeX math typesetting component.
 *
 * Renders mixed text containing inline ($...$, \(...\)) and display ($$...$$, \[...\])
 * LaTeX formulas as well as chemical reactions safely in both SSR and client contexts.
 */

'use client';

import React, { useMemo } from 'react';
import { renderMathInText, renderLatexToHtml } from '@/lib/katex';

export interface MathRendererProps {
  /** The text content containing LaTeX equations or raw LaTeX string */
  content?: string;
  /** Alternate prop for text content */
  children?: React.ReactNode;
  /** If true, treats the entire content as a single display math equation */
  block?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Wrapper element type: 'div' or 'span' (default: 'div') */
  as?: 'div' | 'span';
}

/**
 * MathRenderer component safely converts LaTeX markers into rendered KaTeX nodes.
 */
export function MathRenderer({
  content,
  children,
  block = false,
  className = '',
  as = 'div',
}: MathRendererProps) {
  const rawText = content || (typeof children === 'string' ? children : '') || '';

  const html = useMemo(() => {
    if (!rawText) return '';
    if (block) {
      return renderLatexToHtml(rawText, true);
    }
    return renderMathInText(rawText);
  }, [rawText, block]);

  const Component = as;

  return (
    <Component
      className={`katex-rendered leading-relaxed text-stone-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
