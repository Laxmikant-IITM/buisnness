'use client';

/**
 * Academic Tools Portal
 * Module: Student Academic Tools
 * 
 * Interactive calculation and planning tools for students:
 * 1. Non-OPPE Grade Predictor: computes exact End Term marks needed for grades S, A, B, C, D, E.
 * 2. CGPA & SGPA Semester Ledger: allows students to record terms, subjects, credits, and grades.
 * 3. Cutoff reference table.
 */

import React, { useState } from 'react';
import {
  predictRequiredFinalScore,
  calculateNonOppeScore,
  calculateGpa,
  IITM_GRADE_CUTOFFS,
  type LetterGrade,
  type CourseGradeEntry,
} from '@/lib/academic-grading';
import { Calculator, Award, BookOpen, Sparkles, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AcademicToolsPage() {
  const [activeTab, setActiveTab] = useState<'predictor' | 'cgpa' | 'scale'>('predictor');

  // Predictor state
  const [q1, setQ1] = useState<number>(75);
  const [q2, setQ2] = useState<number>(80);
  const [bonus, setBonus] = useState<number>(3);
  const [simFinal, setSimFinal] = useState<number>(85);

  const predictions = predictRequiredFinalScore(q1, q2, bonus);
  const simulation = calculateNonOppeScore({ quiz1: q1, quiz2: q2, finalExam: simFinal, bonus });

  // CGPA Ledger state
  const [courses, setCourses] = useState<CourseGradeEntry[]>([
    { courseCode: 'MA1001', courseTitle: 'Mathematics for Data Science 1', credits: 4, grade: 'S' },
    { courseCode: 'CS1001', courseTitle: 'Computational Thinking', credits: 4, grade: 'A' },
    { courseCode: 'EN1001', courseTitle: 'English 1', credits: 4, grade: 'B' },
    { courseCode: 'ST1001', courseTitle: 'Statistics for Data Science 1', credits: 4, grade: 'A' },
  ]);

  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCredits, setNewCredits] = useState(4);
  const [newGrade, setNewGrade] = useState<LetterGrade>('A');

  const gpaResult = calculateGpa(courses);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCourses((prev) => [
      ...prev,
      {
        courseCode: newCode.trim() || `CRS${prev.length + 1}`,
        courseTitle: newTitle.trim(),
        credits: Number(newCredits) || 4,
        grade: newGrade,
      },
    ]);
    setNewCode('');
    setNewTitle('');
  };

  const handleRemoveCourse = (index: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>IITM BS Degree Academic Suite</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 font-display">
          Academic Calculators & Predictors
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-2xl leading-relaxed">
          Reverse-engineer your final exam targets using official IIT Madras absolute grading formulas,
          or compute your cumulative CGPA and semester SGPA with credit weighting.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-8 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('predictor')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'predictor'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Final Grade Predictor</span>
        </button>

        <button
          onClick={() => setActiveTab('cgpa')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'cgpa'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>CGPA & SGPA Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('scale')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'scale'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Grading Scale & Cutoffs</span>
        </button>
      </div>

      {/* Tab 1: Final Grade Predictor */}
      {activeTab === 'predictor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 font-display flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <span>Input Your Continuous Scores</span>
            </h2>

            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span>Quiz 1 Score (out of 100)</span>
                <span className="font-mono text-emerald-800">{q1}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={q1}
                onChange={(e) => setQ1(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span>Quiz 2 Score (out of 100)</span>
                <span className="font-mono text-emerald-800">{q2}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={q2}
                onChange={(e) => setQ2(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span>Assignment / Activity Bonus (0-5)</span>
                <span className="font-mono text-emerald-800">{bonus}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <label className="block text-xs font-semibold text-neutral-700 mb-2">
                Simulate Final Exam Score (out of 100):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simFinal}
                  onChange={(e) => setSimFinal(Number(e.target.value))}
                  className="flex-1 accent-emerald-700"
                />
                <span className="font-mono font-bold text-sm text-neutral-900 bg-neutral-100 px-3 py-1 rounded">
                  {simFinal}
                </span>
              </div>

              {/* Simulation Result Stamp */}
              <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-700 font-medium">Estimated Final Score</div>
                    <div className="text-2xl font-extrabold text-emerald-950 font-mono">
                      {simulation.totalScore} / 100
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-700 font-medium">Predicted Grade</div>
                    <div className="text-3xl font-extrabold text-emerald-900 font-display">
                      {simulation.grade}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-emerald-800">
                  Calculated using <strong>{simulation.usedFormula}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 font-display mb-2">
              End Term Target Checklist
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              Minimum mark you must score in the Final Exam to unlock each letter grade:
            </p>

            <div className="overflow-hidden border border-neutral-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Min Total</th>
                    <th className="py-3 px-4">Grade Points</th>
                    <th className="py-3 px-4">Required Final Exam Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {predictions
                    .filter((p) => p.grade !== 'U')
                    .map((item) => {
                      const reachable = item.requiredFinal !== null;
                      const isEasy = reachable && item.requiredFinal! <= 40;
                      const isModerate = reachable && item.requiredFinal! > 40 && item.requiredFinal! <= 75;

                      return (
                        <tr key={item.grade} className="hover:bg-neutral-50">
                          <td className="py-3.5 px-4 font-bold text-neutral-900 text-base font-display">
                            {item.grade}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-600">{item.targetScore}</td>
                          <td className="py-3.5 px-4 font-mono text-neutral-600">
                            {IITM_GRADE_CUTOFFS.find((c) => c.grade === item.grade)?.gradePoints}
                          </td>
                          <td className="py-3.5 px-4">
                            {!reachable ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Unreachable (&gt; 100)
                              </span>
                            ) : item.requiredFinal === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Already Secured (0 needed)
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold ${
                                  isEasy
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : isModerate
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-purple-50 text-purple-800 border border-purple-200'
                                }`}
                              >
                                {item.requiredFinal} / 100
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 leading-relaxed">
              <strong>Official IITM Formula:</strong>{' '}
              <code className="text-emerald-800 font-mono">
                T = max(0.6*F + 0.3*max(Q1, Q2), 0.45*F + 0.25*Q1 + 0.3*Q2) + Bonus
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CGPA & SGPA Ledger */}
      {activeTab === 'cgpa' && (
        <div className="space-y-8">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Cumulative GPA (CGPA)
              </div>
              <div className="mt-1 text-4xl font-extrabold text-emerald-950 font-mono">
                {gpaResult.gpa.toFixed(2)}
              </div>
              <div className="text-xs text-emerald-700 mt-1">Scale of 10.00</div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Total Registered Credits
              </div>
              <div className="mt-1 text-4xl font-extrabold text-neutral-900 font-mono">
                {gpaResult.totalCredits}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Across {courses.length} courses</div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Earned Credits
              </div>
              <div className="mt-1 text-4xl font-extrabold text-neutral-900 font-mono">
                {gpaResult.earnedCredits}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Passing grades (Grade &ne; U)</div>
            </div>
          </div>

          {/* Add Course Form */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-neutral-900 font-display mb-4">Add Course to Ledger</h3>
            <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS1002"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Course Name</label>
                <input
                  type="text"
                  placeholder="e.g. Programming in Python"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Credits</label>
                <select
                  value={newCredits}
                  onChange={(e) => setNewCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                >
                  <option value={1}>1 Credit</option>
                  <option value={2}>2 Credits</option>
                  <option value={3}>3 Credits</option>
                  <option value={4}>4 Credits</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Grade</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value as LetterGrade)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                >
                  {IITM_GRADE_CUTOFFS.map((c) => (
                    <option key={c.grade} value={c.grade}>
                      {c.grade} ({c.gradePoints} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-sm flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Courses Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Name</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {courses.map((c, index) => {
                  const pts = IITM_GRADE_CUTOFFS.find((co) => co.grade === c.grade)?.gradePoints ?? 0;
                  return (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-mono text-neutral-600">{c.courseCode}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">{c.courseTitle}</td>
                      <td className="py-3 px-4 font-mono">{c.credits}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono bg-neutral-100 text-neutral-800">
                          {c.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{c.credits * pts}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveCourse(index)}
                          className="text-neutral-400 hover:text-red-600 transition-colors"
                          aria-label="Remove course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Grading Scale & Reference */}
      {activeTab === 'scale' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-neutral-900 font-display mb-2">
            IIT Madras Absolute Grading Criteria
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Official absolute grading bands applicable to students in the BS Degree in Data Science & Applications.
          </p>

          <div className="overflow-hidden border border-neutral-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Letter Grade</th>
                  <th className="py-3 px-4">Score Band</th>
                  <th className="py-3 px-4">Grade Points</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {IITM_GRADE_CUTOFFS.map((c) => (
                  <tr key={c.grade} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-extrabold text-neutral-900 text-base font-display">
                      {c.grade}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-700">
                      {c.grade === 'S'
                        ? '≥ 90'
                        : c.grade === 'U'
                        ? '< 40'
                        : `≥ ${c.minScore} and < ${c.minScore + 10}`}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{c.gradePoints}</td>
                    <td className="py-3 px-4">
                      {c.grade === 'U' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                          Fail (Repeat)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Pass
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
