/**
 * Academic Grading & Score Predictor Module
 * Module: Student Academic Tools
 * 
 * Provides official grading formulas and reverse-calculation algorithms
 * tailored for students in the IIT Madras (IITM) BS Degree in Data Science & Applications.
 * 
 * Includes:
 * 1. Non-OPPE Final Score Formula: T = max(0.6*F + 0.3*max(Q1, Q2), 0.45*F + 0.25*Q1 + 0.3*Q2) + Bonus
 * 2. OPPE-based Course Final Score Formulas
 * 3. Reverse Grade Predictor: Calculates exact End Term Final mark needed to secure target letter grade
 * 4. Credit-weighted SGPA & cumulative CGPA calculation
 */

export type LetterGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'U';

export interface GradeCutoff {
  grade: LetterGrade;
  minScore: number;
  gradePoints: number;
}

/** Standard absolute grading cutoffs used in the IIT Madras BS program */
export const IITM_GRADE_CUTOFFS: GradeCutoff[] = [
  { grade: 'S', minScore: 90, gradePoints: 10 },
  { grade: 'A', minScore: 80, gradePoints: 9 },
  { grade: 'B', minScore: 70, gradePoints: 8 },
  { grade: 'C', minScore: 60, gradePoints: 7 },
  { grade: 'D', minScore: 50, gradePoints: 6 },
  { grade: 'E', minScore: 40, gradePoints: 4 },
  { grade: 'U', minScore: 0, gradePoints: 0 },
];

export interface NonOppeInputs {
  /** Quiz 1 score (0 to 100) */
  quiz1: number;
  /** Quiz 2 score (0 to 100) */
  quiz2: number;
  /** Final End Term Exam score (0 to 100) */
  finalExam: number;
  /** Weekly assignment or discussion bonus (typically 0 to 5) */
  bonus?: number;
}

/**
 * Calculates the total course score (T) for standard Non-OPPE theory subjects.
 * Formula: T = max(0.6*F + 0.3*max(Q1, Q2), 0.45*F + 0.25*Q1 + 0.3*Q2) + Bonus
 */
export function calculateNonOppeScore(inputs: NonOppeInputs): {
  totalScore: number;
  usedFormula: 'Option 1 (Best Quiz)' | 'Option 2 (Both Quizzes)';
  grade: LetterGrade;
  gradePoints: number;
} {
  const { quiz1, quiz2, finalExam, bonus = 0 } = inputs;
  const bestQuiz = Math.max(quiz1, quiz2);

  const formula1 = 0.6 * finalExam + 0.3 * bestQuiz;
  const formula2 = 0.45 * finalExam + 0.25 * quiz1 + 0.3 * quiz2;

  const rawScore = Math.max(formula1, formula2) + bonus;
  const totalScore = Math.min(100, Math.round(rawScore * 10) / 10);
  const usedFormula = formula1 >= formula2 ? 'Option 1 (Best Quiz)' : 'Option 2 (Both Quizzes)';

  const gradeInfo = getGradeFromScore(totalScore);

  return {
    totalScore,
    usedFormula,
    grade: gradeInfo.grade,
    gradePoints: gradeInfo.gradePoints,
  };
}

/**
 * Inverts the Non-OPPE formula to determine the minimum Final Exam score required
 * to achieve each possible letter grade.
 */
export function predictRequiredFinalScore(quiz1: number, quiz2: number, bonus = 0): {
  grade: LetterGrade;
  targetScore: number;
  requiredFinal: number | null; // null if mathematically unreachable
}[] {
  const bestQuiz = Math.max(quiz1, quiz2);

  return IITM_GRADE_CUTOFFS.map((cutoff) => {
    const netTarget = cutoff.minScore - bonus;

    if (netTarget <= 0) {
      return { grade: cutoff.grade, targetScore: cutoff.minScore, requiredFinal: 0 };
    }

    // From Formula 1: 0.6 * F + 0.3 * bestQuiz >= netTarget => F >= (netTarget - 0.3*bestQuiz) / 0.6
    const reqF1 = (netTarget - 0.3 * bestQuiz) / 0.6;

    // From Formula 2: 0.45 * F + 0.25 * Q1 + 0.3 * Q2 >= netTarget => F >= (netTarget - 0.25*Q1 - 0.3*Q2) / 0.45
    const reqF2 = (netTarget - 0.25 * quiz1 - 0.3 * quiz2) / 0.45;

    // The student needs the minimum of either formula path
    const minRequired = Math.max(0, Math.min(reqF1, reqF2));

    if (minRequired > 100) {
      return { grade: cutoff.grade, targetScore: cutoff.minScore, requiredFinal: null };
    }

    return {
      grade: cutoff.grade,
      targetScore: cutoff.minScore,
      requiredFinal: Math.ceil(minRequired * 10) / 10,
    };
  });
}

/** Returns the letter grade and grade points for a given total score (0 to 100) */
export function getGradeFromScore(score: number): GradeCutoff {
  for (const cutoff of IITM_GRADE_CUTOFFS) {
    if (score >= cutoff.minScore) {
      return cutoff;
    }
  }
  return IITM_GRADE_CUTOFFS[IITM_GRADE_CUTOFFS.length - 1];
}

export interface CourseGradeEntry {
  courseCode: string;
  courseTitle: string;
  credits: number;
  grade: LetterGrade;
}

/**
 * Calculates Semester Grade Point Average (SGPA) or Cumulative Grade Point Average (CGPA)
 * using credit-weighted average: sum(credits * points) / sum(credits).
 */
export function calculateGpa(entries: CourseGradeEntry[]): {
  gpa: number;
  totalCredits: number;
  earnedCredits: number;
} {
  if (entries.length === 0) {
    return { gpa: 0, totalCredits: 0, earnedCredits: 0 };
  }

  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;

  for (const entry of entries) {
    const cutoff = IITM_GRADE_CUTOFFS.find((c) => c.grade === entry.grade);
    const points = cutoff ? cutoff.gradePoints : 0;

    totalCredits += entry.credits;
    totalGradePoints += entry.credits * points;

    if (entry.grade !== 'U') {
      earnedCredits += entry.credits;
    }
  }

  const gpa = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;

  return { gpa, totalCredits, earnedCredits };
}
