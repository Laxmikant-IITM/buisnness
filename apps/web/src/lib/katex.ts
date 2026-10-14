/**
 * @file apps/web/src/lib/katex.ts
 * @description KaTeX math typesetting helper library (SSR & Client safe).
 *
 * Provides utilities to parse and render LaTeX expressions and chemical formulas
 * embedded inside strings (question stems, options, and explanations).
 *
 * Defenses:
 * - Plain text is escaped to protect against XSS injection before injecting rendered KaTeX HTML.
 * - KaTeX render errors are caught gracefully with `throwOnError: false` to prevent page crashes.
 * - Supports inline math ($...$ or \(...\)), display math ($$...$$ or \[...\]), and chemical formulas (\ce{...}).
 */

import katex from 'katex';

export interface KatexRenderOptions {
  /** When true, renders math in display mode (centered, block-level) */
  displayMode?: boolean;
  /** Whether to emit KaTeX warnings to the console (default: false) */
  strict?: boolean;
}

/**
 * HTML-escapes raw text to prevent cross-site scripting (XSS) attacks.
 * Used for parts of the text outside of mathematical tokens.
 *
 * @param str - The raw user-supplied string to escape
 * @returns Sanitized string safe for HTML interpolation
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Pre-processes LaTeX text to normalize common chemistry and shorthand conventions.
 * For example, converts basic \ce{H2O} or \ce{CaCO3} expressions to subscripted equivalents
 * if the full mhchem extension is not bundled in the client environment.
 *
 * @param formula - Raw LaTeX or chemical formula string
 * @returns Cleaned LaTeX string compatible with KaTeX core
 */
function preprocessChemicalFormulas(formula: string): string {
  // Translate simple \ce{X} patterns into standard LaTeX if mhchem is not active
  return formula.replace(/\\ce\{([^{}]+)\}/g, (_match, inner: string) => {
    // Replace numbers following uppercase/lowercase letters with subscripts: e.g. H2O -> \text{H}_{2}\text{O}
    const converted = inner
      .replace(/([A-Z][a-z]?)([0-9]+)/g, '$1_{$2}')
      .replace(/->/g, '\\rightarrow ')
      .replace(/<-/g, '\\leftarrow ');
    return `\\mathrm{${converted}}`;
  });
}

/**
 * Renders a single LaTeX formula to an HTML string safely.
 *
 * @param latex - Pure LaTeX string without delimiters (e.g. "E = mc^2")
 * @param displayMode - If true, renders block display math; otherwise inline math
 * @returns Rendered HTML span string or fallback safe HTML if parsing fails
 */
export function renderLatexToHtml(latex: string, displayMode: boolean = false): string {
  if (!latex || typeof latex !== 'string') {
    return '';
  }

  const normalized = preprocessChemicalFormulas(latex.trim());

  try {
    return katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (err) {
    // KaTeX failed despite throwOnError: fallback to escaped raw latex wrapped in an error badge
    console.warn('KaTeX rendering error:', err);
    return `<span class="katex-error text-red-500 font-mono text-xs" title="KaTeX Error">${escapeHtml(latex)}</span>`;
  }
}

/**
 * Scans a mixed content string containing inline and display math delimiters,
 * parses all LaTeX math segments, sanitizes raw text, and returns safe HTML.
 *
 * Recognized delimiters:
 * - Display Math: `$$...$$` or `\[...\]`
 * - Inline Math: `$...$` or `\(...\)`
 *
 * @example
 * renderMathInText("Solve for $x$: $$x^2 + 5x + 6 = 0$$")
 *
 * @param text - Input string containing natural language and LaTeX delimiters
 * @returns Fully formatted HTML string safe for dangerouslySetInnerHTML
 */
export function renderMathInText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Regex pattern matching:
  // Group 1 & 2: $$...$$ (display)
  // Group 3 & 4: \[...\] (display)
  // Group 5 & 6: $...$ (inline, ensuring no double dollar and not empty)
  // Group 7 & 8: \(...\) (inline)
  const mathRegex = /(\$\$([\s\S]*?)\$\$)|(\\\[([\s\S]*?)\\\])|(\$([^\$\n]+?)\$)|(\\\(([\s\S]*?)\\\))/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    // 1. Append sanitized text preceding this math token
    const nonMathSegment = text.slice(lastIndex, match.index);
    if (nonMathSegment) {
      result += escapeHtml(nonMathSegment);
    }

    // 2. Determine delimiter type and extract the LaTeX payload
    if (match[1] !== undefined) {
      // $$...$$ display math
      const latex = match[2];
      result += `<div class="my-2 overflow-x-auto text-center">${renderLatexToHtml(latex, true)}</div>`;
    } else if (match[3] !== undefined) {
      // \[...\] display math
      const latex = match[4];
      result += `<div class="my-2 overflow-x-auto text-center">${renderLatexToHtml(latex, true)}</div>`;
    } else if (match[5] !== undefined) {
      // $...$ inline math
      const latex = match[6];
      result += renderLatexToHtml(latex, false);
    } else if (match[7] !== undefined) {
      // \(...\) inline math
      const latex = match[8];
      result += renderLatexToHtml(latex, false);
    }

    lastIndex = mathRegex.lastIndex;
  }

  // 3. Append remaining trailing non-math text
  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }

  return result;
}
