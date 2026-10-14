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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-xs font-semibold rounded-full border border-[#F5B8A3] dark:border-[#7D2F1A] mb-2 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Grade Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A19] dark:text-[#F5F3EF] font-display">
          Academic Calculators & Target Predictor
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C8C87]">
          Calculate End-Term target marks for S/A grade cutoffs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E6E1] dark:border-[#2D2D2A] gap-6 text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('predictor')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'predictor'
              ? 'border-[#E05A33] text-[#E05A33] font-bold'
              : 'border-transparent text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-[#F5F3EF]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Final Grade Predictor</span>
        </button>

        <button
          onClick={() => setActiveTab('cgpa')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'cgpa'
              ? 'border-[#E05A33] text-[#E05A33] font-bold'
              : 'border-transparent text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-[#F5F3EF]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>CGPA Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('scale')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'scale'
              ? 'border-[#E05A33] text-[#E05A33] font-bold'
              : 'border-transparent text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-[#F5F3EF]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Grading Cutoffs</span>
        </button>
      </div>

      {/* Tab 1: Final Grade Predictor */}
      {activeTab === 'predictor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1C1C1A] p-6 rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs space-y-6">
            <h2 className="text-base font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#E05A33]" />
              <span>Input Continuous Scores</span>
            </h2>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1.5 font-mono">
                <span>Quiz 1 (out of 100)</span>
                <span className="font-bold text-[#E05A33]">{q1}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={q1}
                onChange={(e) => setQ1(Number(e.target.value))}
                className="w-full accent-[#E05A33]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1.5 font-mono">
                <span>Quiz 2 (out of 100)</span>
                <span className="font-bold text-[#E05A33]">{q2}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={q2}
                onChange={(e) => setQ2(Number(e.target.value))}
                className="w-full accent-[#E05A33]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1.5 font-mono">
                <span>Assignment Bonus (0-5)</span>
                <span className="font-bold text-[#E05A33]">{bonus}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value))}
                className="w-full accent-[#E05A33]"
              />
            </div>

            <div className="pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
              <label className="block text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-2 font-mono">
                Simulate Final Exam Mark:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simFinal}
                  onChange={(e) => setSimFinal(Number(e.target.value))}
                  className="flex-1 accent-[#E05A33]"
                />
                <span className="font-mono font-bold text-sm text-[#1A1A19] dark:text-[#F5F3EF] bg-[#F5F3EF] dark:bg-[#242422] px-3 py-1 rounded-lg border border-[#E8E6E1] dark:border-[#2D2D2A]">
                  {simFinal}
                </span>
              </div>

              {/* Simulation Result Stamp */}
              <div className="mt-4 p-4 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/50 border border-[#F5B8A3] dark:border-[#7D2F1A]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#E05A33] font-medium font-mono">Estimated Total Score</div>
                    <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-mono">
                      {simulation.totalScore} / 100
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#E05A33] font-medium font-mono">Predicted Grade</div>
                    <div className="text-3xl font-extrabold text-[#E05A33] font-display">
                      {simulation.grade}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-[#8C8C87] font-mono">
                  Formula: {simulation.usedFormula}
                </div>
              </div>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1A] p-6 rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
            <h2 className="text-base font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display mb-1">
              Final Exam Target Checklist
            </h2>
            <p className="text-xs text-[#8C8C87] mb-4">
              Minimum mark needed in End-Term for each letter grade:
            </p>

            <div className="overflow-hidden border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F5F3EF] dark:bg-[#242422] text-[#8C8C87] text-xs uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Min Total</th>
                    <th className="py-3 px-4">Grade Points</th>
                    <th className="py-3 px-4">Required Final Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2D2D2A]">
                  {predictions
                    .filter((p) => p.grade !== 'U')
                    .map((item) => {
                      const reachable = item.requiredFinal !== null;
                      const isEasy = reachable && item.requiredFinal! <= 40;
                      const isModerate = reachable && item.requiredFinal! > 40 && item.requiredFinal! <= 75;

                      return (
                        <tr key={item.grade} className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50">
                          <td className="py-3.5 px-4 font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-base font-display">
                            {item.grade}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#6B6B66] dark:text-[#B5B3AD]">{item.targetScore}</td>
                          <td className="py-3.5 px-4 font-mono text-[#6B6B66] dark:text-[#B5B3AD]">
                            {IITM_GRADE_CUTOFFS.find((c) => c.grade === item.grade)?.gradePoints}
                          </td>
                          <td className="py-3.5 px-4">
                            {!reachable ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Unreachable (&gt; 100)
                              </span>
                            ) : item.requiredFinal === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#E7F5ED] text-[#2D7A4F] border border-[#C2E8D2]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Secured (0 needed)
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                                  isEasy
                                    ? 'bg-[#E7F5ED] text-[#2D7A4F] border border-[#C2E8D2]'
                                    : isModerate
                                    ? 'bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3]'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
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

            <div className="mt-4 p-3 bg-[#FAFAF7] dark:bg-[#242422] rounded-xl text-xs text-[#8C8C87] border border-[#E8E6E1] dark:border-[#2D2D2A] font-mono">
              <strong>Formula:</strong>{' '}
              <span>T = max(0.6*F + 0.3*max(Q1, Q2), 0.45*F + 0.25*Q1 + 0.3*Q2) + Bonus</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CGPA & SGPA Ledger */}
      {activeTab === 'cgpa' && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#FDF0EB] dark:bg-[#3A150C]/60 border border-[#F5B8A3] dark:border-[#7D2F1A] rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-[#E05A33] uppercase tracking-wide font-mono">
                Cumulative CGPA
              </div>
              <div className="mt-1 text-3xl font-extrabold text-[#E05A33] font-display">
                {gpaResult.gpa.toFixed(2)}
              </div>
              <div className="text-xs text-[#8C8C87] mt-1 font-mono">Scale of 10.00</div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-[#8C8C87] uppercase tracking-wide font-mono">
                Total Registered Credits
              </div>
              <div className="mt-1 text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                {gpaResult.totalCredits}
              </div>
              <div className="text-xs text-[#8C8C87] mt-1 font-mono">Across {courses.length} courses</div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-[#8C8C87] uppercase tracking-wide font-mono">
                Earned Credits
              </div>
              <div className="mt-1 text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                {gpaResult.earnedCredits}
              </div>
              <div className="text-xs text-[#8C8C87] mt-1 font-mono">Passing grades (Grade ≠ U)</div>
            </div>
          </div>

          {/* Add Course Form */}
          <div className="bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display mb-4">Add Course</h3>
            <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1 font-mono">Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS1002"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg text-xs bg-[#FAFAF7] dark:bg-[#242422] text-[#1A1A19] dark:text-[#F5F3EF] focus:ring-1 focus:ring-[#E05A33] outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1 font-mono">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Programming in Python"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg text-xs bg-[#FAFAF7] dark:bg-[#242422] text-[#1A1A19] dark:text-[#F5F3EF] focus:ring-1 focus:ring-[#E05A33] outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1 font-mono">Credits</label>
                <select
                  value={newCredits}
                  onChange={(e) => setNewCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg text-xs bg-[#FAFAF7] dark:bg-[#242422] text-[#1A1A19] dark:text-[#F5F3EF] focus:ring-1 focus:ring-[#E05A33] outline-none"
                >
                  <option value={1}>1 Credit</option>
                  <option value={2}>2 Credits</option>
                  <option value={3}>3 Credits</option>
                  <option value={4}>4 Credits</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF] mb-1 font-mono">Grade</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value as LetterGrade)}
                  className="w-full px-3 py-2 border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg text-xs bg-[#FAFAF7] dark:bg-[#242422] text-[#1A1A19] dark:text-[#F5F3EF] focus:ring-1 focus:ring-[#E05A33] outline-none"
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
                  className="w-full py-2 bg-[#E05A33] hover:bg-[#C94A26] text-white font-semibold rounded-lg text-xs flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Courses Table */}
          <div className="bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F5F3EF] dark:bg-[#242422] text-[#8C8C87] text-xs uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Name</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2D2D2A]">
                {courses.map((c, index) => {
                  const pts = IITM_GRADE_CUTOFFS.find((co) => co.grade === c.grade)?.gradePoints ?? 0;
                  return (
                    <tr key={index} className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50">
                      <td className="py-3 px-4 font-mono text-[#8C8C87]">{c.courseCode}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">{c.courseTitle}</td>
                      <td className="py-3 px-4 font-mono text-[#6B6B66] dark:text-[#B5B3AD]">{c.credits}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] border border-[#F5B8A3] dark:border-[#7D2F1A]">
                          {c.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#E05A33]">{c.credits * pts}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveCourse(index)}
                          className="text-[#8C8C87] hover:text-[#C94B3E] transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-2xl p-6 shadow-xs max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display mb-1">
            Absolute Grading Criteria
          </h2>
          <p className="text-xs text-[#8C8C87] mb-6">
            IIT Madras BS Degree official grading bands.
          </p>

          <div className="overflow-hidden border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F5F3EF] dark:bg-[#242422] text-[#8C8C87] text-xs uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Score Band</th>
                  <th className="py-3 px-4">Grade Points</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2D2D2A]">
                {IITM_GRADE_CUTOFFS.map((c) => (
                  <tr key={c.grade} className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50">
                    <td className="py-3 px-4 font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] text-base font-display">
                      {c.grade}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6B6B66] dark:text-[#B5B3AD]">
                      {c.grade === 'S'
                        ? '≥ 90'
                        : c.grade === 'U'
                        ? '< 40'
                        : `≥ ${c.minScore} and < ${c.minScore + 10}`}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E05A33]">{c.gradePoints}</td>
                    <td className="py-3 px-4">
                      {c.grade === 'U' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                          Repeat
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#E7F5ED] text-[#2D7A4F] border border-[#C2E8D2]">
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
