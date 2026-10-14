/**
 * @file apps/web/src/app/(student)/ide/[problemId]/page.tsx
 * @description Interactive coding playground challenge runner.
 *
 * Features:
 * - Left Pane: Problem description, mathematical constraints, and sample cases with KaTeX math rendering.
 * - Right Pane (Top): Multi-language code editor (Python, Java, C++) with indentation and line numbering.
 * - Right Pane (Bottom): Interactive terminal console for stdout, stderr, and execution diagnostics.
 * - Public test case evaluator and full challenge submission against hidden test suites.
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  ArrowLeft,
  Copy,
  ChevronDown,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { MathRenderer } from '@/components/quiz/math-renderer';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  position: number;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  constraints: string | null;
  inputFormat: string | null;
  outputFormat: string | null;
  sampleInput: string | null;
  sampleOutput: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  weekNumber: number | null;
  defaultLanguage: string;
  timeLimitSeconds: number;
  publicTestCases: TestCase[];
}

interface SingleRunResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  status: 'SUCCESS' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  durationMs: number;
}

interface SubmissionResult {
  overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR';
  totalCases: number;
  passedCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  results: Array<{
    testCaseId?: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
    stderr?: string;
    status: string;
    executionTimeMs: number;
    isHidden: boolean;
  }>;
}

const BOILERPLATES: Record<string, string> = {
  python: `import sys

def solve():
    # Read standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Write your solution logic here
    print("Hello, World!")

if __name__ == '__main__':
    solve()
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
        System.out.println("Hello, World!");
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    cout << "Hello, World!" << endl;
    
    return 0;
}
`,
};

export default function IdePlaygroundPage() {
  const params = useParams();
  const problemId = params?.problemId as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editor State
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(BOILERPLATES['python']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Console State
  const [activeTab, setActiveTab] = useState<'tests' | 'terminal'>('tests');
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<SingleRunResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  /** Fetch Problem Details */
  useEffect(() => {
    async function loadProblem() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/ide/${problemId}`);
        if (res.ok) {
          const data = await res.json();
          setProblem(data.problem);
          const defaultLang = data.problem.defaultLanguage?.toLowerCase() || 'python';
          setLanguage(defaultLang);
          setCode(BOILERPLATES[defaultLang] || BOILERPLATES['python']);

          if (data.problem.publicTestCases?.length > 0) {
            setCustomInput(data.problem.publicTestCases[0].input);
          }
        } else {
          setErrorMsg('Could not find coding problem challenge.');
        }
      } catch {
        setErrorMsg('Network error loading IDE problem.');
      } finally {
        setLoading(false);
      }
    }

    if (problemId) {
      loadProblem();
    }
  }, [problemId]);

  /** Change Language */
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(BOILERPLATES[newLang] || '');
  };

  /** Reset code to boilerplate */
  const handleResetCode = () => {
    if (confirm('Reset code to template? Current edits will be lost.')) {
      setCode(BOILERPLATES[language] || '');
    }
  };

  /** Handle Tab Key in textarea for 4-space indentation */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  /** Run Code against public test case or custom stdin */
  const handleRunPublic = async () => {
    if (!problem || isRunning) return;

    setIsRunning(true);
    setActiveTab('terminal');

    const stdinToUse = isCustomInput
      ? customInput
      : problem.publicTestCases[selectedTestCaseIdx]?.input || '';

    try {
      const res = await fetch('/api/ide/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stdin: stdinToUse,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRunResult(data.result);
      } else {
        const err = await res.json().catch(() => ({}));
        setRunResult({
          stdout: '',
          stderr: err.error || 'Execution request failed',
          output: '',
          exitCode: -1,
          status: 'RUNTIME_ERROR',
          durationMs: 0,
        });
      }
    } catch {
      setRunResult({
        stdout: '',
        stderr: 'Network failure during execution',
        output: '',
        exitCode: -1,
        status: 'RUNTIME_ERROR',
        durationMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  /** Submit solution against full automated test suite */
  const handleSubmitSolution = async () => {
    if (!problem || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await fetch('/api/ide/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          language,
          code,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissionResult(data);
        setIsSubmitModalOpen(true);
      } else {
        alert(data.error || 'Submission error');
      }
    } catch {
      alert('Network failure submitting solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lineCount = useMemo(() => {
    return code.split('\n').length;
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-stone-400 text-xs">
        Loading coding environment...
      </div>
    );
  }

  if (errorMsg || !problem) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-900 p-6 text-center text-white">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h2 className="text-xl font-bold">{errorMsg || 'Problem not found'}</h2>
        <Link
          href="/papers"
          className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const diffColor =
    problem.difficulty === 'EASY'
      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
      : problem.difficulty === 'MEDIUM'
      ? 'bg-amber-950 text-amber-400 border-amber-800'
      : 'bg-rose-950 text-rose-400 border-rose-800';

  return (
    <div className="flex h-screen flex-col bg-stone-950 text-stone-200 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-stone-800 bg-stone-900 px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/papers"
            className="flex items-center gap-1.5 rounded p-1 text-xs text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-stone-800" />
          <h1 className="text-xs font-bold text-white flex items-center gap-2">
            <span>{problem.title}</span>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${diffColor}`}>
              {problem.difficulty}
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-stone-800 bg-stone-950 px-2 py-1 text-xs">
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-xs text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="python" className="bg-stone-900">Python 3.10</option>
              <option value="java" className="bg-stone-900">Java 15</option>
              <option value="cpp" className="bg-stone-900">C++ (GCC 10)</option>
            </select>
          </div>

          <button
            onClick={handleResetCode}
            className="rounded p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white"
            title="Reset code template"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleRunPublic}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3.5 py-1.5 text-xs font-semibold text-stone-200 hover:bg-stone-700 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 shadow"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : 'Submit Solution'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Pane: Problem Description */}
        <div className="h-full overflow-y-auto border-r border-stone-800 p-6 space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Problem Description
            </span>
            <div className="mt-2 text-sm leading-relaxed text-stone-300">
              <MathRenderer content={problem.description} />
            </div>
          </div>

          {problem.constraints && (
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Constraints
              </span>
              <div className="rounded-lg bg-stone-900/60 p-3 text-xs font-mono text-stone-300 border border-stone-800">
                <MathRenderer content={problem.constraints} />
              </div>
            </div>
          )}

          {problem.inputFormat && (
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Input Format
              </span>
              <div className="text-xs text-stone-300 leading-relaxed">
                <MathRenderer content={problem.inputFormat} />
              </div>
            </div>
          )}

          {problem.outputFormat && (
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Output Format
              </span>
              <div className="text-xs text-stone-300 leading-relaxed">
                <MathRenderer content={problem.outputFormat} />
              </div>
            </div>
          )}

          {/* Sample Cases */}
          {problem.publicTestCases.map((tc, idx) => (
            <div key={tc.id} className="rounded-xl border border-stone-800 bg-stone-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400">Sample Case {idx + 1}</span>
                <button
                  onClick={() => {
                    setSelectedTestCaseIdx(idx);
                    setIsCustomInput(false);
                    setCustomInput(tc.input);
                  }}
                  className="text-[11px] font-semibold text-emerald-400 hover:underline"
                >
                  Load into Console
                </button>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 font-mono uppercase block">Input</span>
                <pre className="mt-1 rounded bg-stone-950 p-2 font-mono text-xs text-stone-200 overflow-x-auto border border-stone-800/80">
                  {tc.input}
                </pre>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 font-mono uppercase block">Expected Output</span>
                <pre className="mt-1 rounded bg-stone-950 p-2 font-mono text-xs text-emerald-400 overflow-x-auto border border-stone-800/80">
                  {tc.expectedOutput}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Right Pane: Code Editor (Top) & Interactive Console (Bottom) */}
        <div className="h-full flex flex-col overflow-hidden">
          {/* Top Half: Code Editor */}
          <div className="flex-1 flex overflow-hidden border-b border-stone-800 bg-stone-950">
            {/* Line Numbers Gutter */}
            <div className="select-none py-3 px-3 text-right font-mono text-xs text-stone-600 bg-stone-900/30 border-r border-stone-900 shrink-0">
              {Array.from({ length: Math.max(lineCount, 25) }, (_, i) => (
                <div key={i + 1} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-6 text-stone-100 focus:outline-none"
            />
          </div>

          {/* Bottom Half: Console & Execution Diagnostics */}
          <div className="h-64 flex flex-col bg-stone-900 shrink-0">
            {/* Console Tab Headers */}
            <div className="flex items-center justify-between border-b border-stone-800 px-3 py-1.5 bg-stone-950 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`rounded px-2.5 py-1 font-semibold transition ${
                    activeTab === 'tests'
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`rounded px-2.5 py-1 font-semibold transition ${
                    activeTab === 'terminal'
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Output Console
                </button>
              </div>

              {/* Execution telemetry summary */}
              {runResult && (
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-stone-400">
                    <Clock className="h-3 w-3" /> {runResult.durationMs}ms
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-bold ${
                      runResult.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-red-950 text-red-400'
                    }`}
                  >
                    {runResult.status}
                  </span>
                </div>
              )}
            </div>

            {/* Console Body */}
            <div className="flex-1 p-3 overflow-y-auto">
              {activeTab === 'tests' ? (
                <div className="space-y-3">
                  {/* Selector for test case pills */}
                  <div className="flex items-center gap-2">
                    {problem.publicTestCases.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedTestCaseIdx(idx);
                          setIsCustomInput(false);
                        }}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          !isCustomInput && selectedTestCaseIdx === idx
                            ? 'bg-emerald-800 text-white'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsCustomInput(true)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        isCustomInput
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      Custom Stdin
                    </button>
                  </div>

                  {isCustomInput ? (
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                        Standard Input (stdin)
                      </span>
                      <textarea
                        rows={3}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter custom input values..."
                        className="w-full rounded bg-stone-950 p-2 font-mono text-xs text-stone-200 border border-stone-800 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                        Input
                      </span>
                      <pre className="rounded bg-stone-950 p-2 font-mono text-xs text-stone-200 border border-stone-800">
                        {problem.publicTestCases[selectedTestCaseIdx]?.input || ''}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* Output Terminal Tab */
                <div className="font-mono text-xs space-y-2">
                  {runResult ? (
                    <>
                      {runResult.stdout && (
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase block">Stdout</span>
                          <pre className="mt-1 rounded bg-stone-950 p-2.5 text-stone-200 overflow-x-auto border border-stone-800">
                            {runResult.stdout}
                          </pre>
                        </div>
                      )}
                      {runResult.stderr && (
                        <div>
                          <span className="text-[10px] text-red-400 uppercase block">Stderr / Errors</span>
                          <pre className="mt-1 rounded bg-red-950/20 border border-red-900/50 p-2.5 text-red-300 overflow-x-auto">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                      {!runResult.stdout && !runResult.stderr && (
                        <div className="text-stone-500 italic">No output produced.</div>
                      )}
                    </>
                  ) : (
                    <div className="text-stone-500 py-6 text-center italic">
                      Click &quot;Run Code&quot; to test your solution.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Result Modal */}
      {isSubmitModalOpen && submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                {submissionResult.overallStatus === 'ACCEPTED' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      submissionResult.overallStatus === 'ACCEPTED'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {submissionResult.overallStatus.replace(/_/g, ' ')}
                  </h3>
                  <span className="text-xs text-stone-400">
                    Passed {submissionResult.passedCases} of {submissionResult.totalCases} test cases
                  </span>
                </div>
              </div>

              <div className="text-right text-xs text-stone-400 font-mono">
                <div>{submissionResult.executionTimeMs}ms</div>
              </div>
            </div>

            {/* Test Case Breakdown */}
            <div className="my-4 max-h-60 space-y-2 overflow-y-auto">
              {submissionResult.results.map((res, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-mono ${
                    res.passed
                      ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300'
                      : 'border-red-900/50 bg-red-950/20 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span>
                      Test Case {i + 1} {res.isHidden ? '(Hidden Suite)' : ''}
                    </span>
                  </div>
                  <span>{res.status}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-bold text-white hover:bg-stone-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
