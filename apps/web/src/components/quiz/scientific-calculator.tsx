/**
 * @file apps/web/src/components/quiz/scientific-calculator.tsx
 * @description Built-in floating on-screen scientific calculator for examination environments.
 *
 * Features:
 * - Floating, collapsible dialog with minimized mode for unobtrusive exam taking.
 * - Comprehensive scientific function suite:
 *   - Trigonometry: sin, cos, tan, asin, acos, atan (Deg/Rad toggle)
 *   - Logarithms: log10, ln (natural log)
 *   - Powers & Roots: sqrt, x^2, x^y, 1/x
 *   - Constants: Pi (π), Euler's number (e)
 *   - Combinatorics: factorial (n!)
 * - Defensive calculation error handling (division by zero, domain errors).
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Minus, RotateCcw, HelpCircle } from 'lucide-react';

interface ScientificCalculatorProps {
  /** Optional initial open state */
  initialOpen?: boolean;
  /** Callback fired when user closes the calculator */
  onClose?: () => void;
}

export function ScientificCalculator({ initialOpen = false, onClose }: ScientificCalculatorProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isRadMode, setIsRadMode] = useState(false);
  const [isWaitingForOperand, setIsWaitingForOperand] = useState(false);
  const [storedMemory, setStoredMemory] = useState<number | null>(null);

  /** Calculate factorials safely */
  const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  /** Input a single digit or decimal */
  const handleDigit = (digit: string) => {
    if (isWaitingForOperand) {
      setDisplay(digit === '.' ? '0.' : digit);
      setIsWaitingForOperand(false);
    } else {
      if (digit === '.' && display.includes('.')) return;
      setDisplay(display === '0' && digit !== '.' ? digit : display + digit);
    }
  };

  /** Clear all display state */
  const handleClearAll = () => {
    setDisplay('0');
    setEquation('');
    setIsWaitingForOperand(false);
  };

  /** Backspace last entered character */
  const handleBackspace = () => {
    if (isWaitingForOperand) return;
    if (display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  /** Basic arithmetic operator selection (+, -, *, /, ^) */
  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setIsWaitingForOperand(true);
  };

  /** Scientific unary operations */
  const handleScientificUnary = (fnName: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res = 0;
    try {
      switch (fnName) {
        case 'sin':
          res = Math.sin(isRadMode ? val : (val * Math.PI) / 180);
          break;
        case 'cos':
          res = Math.cos(isRadMode ? val : (val * Math.PI) / 180);
          break;
        case 'tan':
          res = Math.tan(isRadMode ? val : (val * Math.PI) / 180);
          break;
        case 'asin':
          res = isRadMode ? Math.asin(val) : (Math.asin(val) * 180) / Math.PI;
          break;
        case 'acos':
          res = isRadMode ? Math.acos(val) : (Math.acos(val) * 180) / Math.PI;
          break;
        case 'atan':
          res = isRadMode ? Math.atan(val) : (Math.atan(val) * 180) / Math.PI;
          break;
        case 'ln':
          res = Math.log(val);
          break;
        case 'log10':
          res = Math.log10(val);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'sqr':
          res = Math.pow(val, 2);
          break;
        case 'inv':
          res = 1 / val;
          break;
        case 'fact':
          res = factorial(val);
          break;
        case 'exp':
          res = Math.exp(val);
          break;
        case 'neg':
          res = -val;
          break;
        default:
          return;
      }

      if (isNaN(res) || !isFinite(res)) {
        setDisplay('Error');
      } else {
        // Round cleanly to 10 decimal digits to eliminate floating point artifacts
        const formatted = String(parseFloat(res.toFixed(10)));
        setDisplay(formatted);
      }
      setIsWaitingForOperand(true);
    } catch {
      setDisplay('Error');
      setIsWaitingForOperand(true);
    }
  };

  /** Mathematical constant inputs */
  const handleConstant = (constant: 'pi' | 'e') => {
    const val = constant === 'pi' ? Math.PI : Math.E;
    setDisplay(String(parseFloat(val.toFixed(10))));
    setIsWaitingForOperand(true);
  };

  /** Calculate current equation */
  const handleEquals = () => {
    if (!equation) return;

    const parts = equation.trim().split(' ');
    if (parts.length < 2) return;

    const prev = parseFloat(parts[0]);
    const op = parts[1];
    const current = parseFloat(display);

    if (isNaN(prev) || isNaN(current)) return;

    let res = 0;
    switch (op) {
      case '+':
        res = prev + current;
        break;
      case '-':
        res = prev - current;
        break;
      case '×':
      case '*':
        res = prev * current;
        break;
      case '÷':
      case '/':
        res = current === 0 ? NaN : prev / current;
        break;
      case '^':
        res = Math.pow(prev, current);
        break;
      default:
        return;
    }

    if (isNaN(res) || !isFinite(res)) {
      setDisplay('Error');
    } else {
      setDisplay(String(parseFloat(res.toFixed(10))));
    }
    setEquation('');
    setIsWaitingForOperand(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-900"
        title="Open Scientific Calculator"
      >
        <Calculator className="h-4 w-4 text-emerald-300" />
        <span>Scientific Calc</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-stone-300 bg-white shadow-2xl transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100 px-3 py-2 rounded-t-xl select-none">
        <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs">
          <Calculator className="h-4 w-4 text-emerald-700" />
          <span>Scientific Calculator</span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {isRadMode ? 'RAD' : 'DEG'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-stone-500 hover:bg-stone-200"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="rounded p-1 text-stone-500 hover:bg-red-100 hover:text-red-600"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3">
          {/* LCD Screen Display */}
          <div className="mb-2 rounded-lg bg-stone-900 p-2.5 text-right font-mono text-white">
            <div className="min-h-[16px] text-[10px] text-stone-400 overflow-hidden text-ellipsis whitespace-nowrap">
              {equation || '\u00A0'}
            </div>
            <div className="text-xl font-bold tracking-wider overflow-x-auto whitespace-nowrap">
              {display}
            </div>
          </div>

          {/* Mode switch */}
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setIsRadMode(!isRadMode)}
              className="rounded border border-stone-300 bg-stone-100 px-2 py-0.5 font-medium text-stone-700 hover:bg-stone-200"
            >
              Mode: <span className="font-bold">{isRadMode ? 'Radians' : 'Degrees'}</span>
            </button>
            <span className="text-[10px] text-stone-500">Auto-precision 10-dec</span>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-5 gap-1 text-xs">
            {/* Row 1: Trig & Clear */}
            <button
              onClick={() => handleScientificUnary('sin')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              sin
            </button>
            <button
              onClick={() => handleScientificUnary('cos')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              cos
            </button>
            <button
              onClick={() => handleScientificUnary('tan')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              tan
            </button>
            <button
              onClick={handleBackspace}
              className="rounded bg-amber-50 py-1.5 font-mono font-semibold text-amber-800 hover:bg-amber-100"
            >
              DEL
            </button>
            <button
              onClick={handleClearAll}
              className="rounded bg-red-100 py-1.5 font-mono font-bold text-red-700 hover:bg-red-200"
            >
              AC
            </button>

            {/* Row 2: Inverse Trig & Powers */}
            <button
              onClick={() => handleScientificUnary('asin')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              sin⁻¹
            </button>
            <button
              onClick={() => handleScientificUnary('acos')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              cos⁻¹
            </button>
            <button
              onClick={() => handleScientificUnary('atan')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              tan⁻¹
            </button>
            <button
              onClick={() => handleScientificUnary('sqrt')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              √x
            </button>
            <button
              onClick={() => handleOperator('^')}
              className="rounded bg-stone-200 py-1.5 font-mono text-stone-800 hover:bg-stone-300"
            >
              x^y
            </button>

            {/* Row 3: Logarithms & Basic Operands */}
            <button
              onClick={() => handleScientificUnary('ln')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              ln
            </button>
            <button
              onClick={() => handleScientificUnary('log10')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              log
            </button>
            <button
              onClick={() => handleDigit('7')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              7
            </button>
            <button
              onClick={() => handleDigit('8')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              8
            </button>
            <button
              onClick={() => handleDigit('9')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              9
            </button>

            {/* Row 4: Exp, Constants, 4-5-6 */}
            <button
              onClick={() => handleScientificUnary('exp')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              eˣ
            </button>
            <button
              onClick={() => handleOperator('÷')}
              className="rounded bg-stone-200 py-1.5 font-mono font-semibold text-stone-800 hover:bg-stone-300"
            >
              ÷
            </button>
            <button
              onClick={() => handleDigit('4')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              4
            </button>
            <button
              onClick={() => handleDigit('5')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              5
            </button>
            <button
              onClick={() => handleDigit('6')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              6
            </button>

            {/* Row 5: Powers, 1-2-3, Multiply */}
            <button
              onClick={() => handleScientificUnary('sqr')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              x²
            </button>
            <button
              onClick={() => handleOperator('×')}
              className="rounded bg-stone-200 py-1.5 font-mono font-semibold text-stone-800 hover:bg-stone-300"
            >
              ×
            </button>
            <button
              onClick={() => handleDigit('1')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              1
            </button>
            <button
              onClick={() => handleDigit('2')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              2
            </button>
            <button
              onClick={() => handleDigit('3')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              3
            </button>

            {/* Row 6: Inversion, Factorial, 0, Dot, Minus */}
            <button
              onClick={() => handleScientificUnary('inv')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              1/x
            </button>
            <button
              onClick={() => handleOperator('-')}
              className="rounded bg-stone-200 py-1.5 font-mono font-semibold text-stone-800 hover:bg-stone-300"
            >
              -
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              0
            </button>
            <button
              onClick={() => handleDigit('.')}
              className="rounded bg-white py-1.5 font-mono font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50"
            >
              .
            </button>
            <button
              onClick={() => handleOperator('+')}
              className="rounded bg-stone-200 py-1.5 font-mono font-semibold text-stone-800 hover:bg-stone-300"
            >
              +
            </button>

            {/* Row 7: Constants & Equals */}
            <button
              onClick={() => handleConstant('pi')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              π
            </button>
            <button
              onClick={() => handleConstant('e')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              e
            </button>
            <button
              onClick={() => handleScientificUnary('fact')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              n!
            </button>
            <button
              onClick={() => handleScientificUnary('neg')}
              className="rounded bg-stone-100 py-1.5 font-mono text-stone-700 hover:bg-stone-200"
            >
              ±
            </button>
            <button
              onClick={handleEquals}
              className="rounded bg-emerald-700 py-1.5 font-mono font-bold text-white hover:bg-emerald-800 shadow"
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
