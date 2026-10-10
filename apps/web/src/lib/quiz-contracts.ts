import { z } from 'zod';

export const questionInputSchema = z.object({
  prompt: z.string().trim().min(1).max(20_000),
  explanation: z.string().trim().max(20_000).nullable().optional(),
  type: z.enum(['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTI', 'TRUE_FALSE']).default('MULTIPLE_CHOICE_SINGLE'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  choices: z.array(z.object({
    text: z.string().trim().min(1).max(5_000),
    isCorrect: z.boolean(),
  })).min(2).max(10),
}).superRefine((question, context) => {
  const correctCount = question.choices.filter((choice) => choice.isCorrect).length;
  if (question.type === 'MULTIPLE_CHOICE_SINGLE' && correctCount !== 1) {
    context.addIssue({ code: 'custom', path: ['choices'], message: 'Single-choice questions require exactly one correct choice.' });
  }
  if (question.type === 'MULTIPLE_CHOICE_MULTI' && (correctCount < 1 || correctCount === question.choices.length)) {
    context.addIssue({ code: 'custom', path: ['choices'], message: 'Multi-select questions require at least one correct and one incorrect choice.' });
  }
  if (question.type === 'TRUE_FALSE' && (question.choices.length !== 2 || correctCount !== 1)) {
    context.addIssue({ code: 'custom', path: ['choices'], message: 'True/false questions require two choices with one correct answer.' });
  }
});

export const quizInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).nullable().optional(),
  timeLimitSeconds: z.number().int().min(30).max(86_400).nullable().optional(),
  maxAttempts: z.number().int().min(1).max(100).nullable().optional(),
  passMarkPercent: z.number().int().min(0).max(100).nullable().optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleChoices: z.boolean().default(false),
});

export const quizItemInputSchema = z.object({
  questionId: z.string().min(1),
  order: z.number().int().min(0).max(10_000),
  points: z.number().int().min(1).max(1_000).default(1),
});

export const submitAttemptSchema = z.object({
  answers: z.array(z.object({
    quizItemId: z.string().min(1),
    selectedChoiceIds: z.array(z.string().min(1)).max(10),
  })).max(500),
});

export type QuestionSnapshot = {
  type: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'TRUE_FALSE';
  prompt: string;
  explanation: string | null;
  choices: Array<{ id: string; text: string; isCorrect: boolean }>;
};

/** Remove answer keys before a quiz question crosses the learner API boundary. */
export function learnerQuestion(snapshot: QuestionSnapshot, order: number, points: number) {
  return {
    order,
    points,
    type: snapshot.type,
    prompt: snapshot.prompt,
    choices: snapshot.choices.map(({ id, text }) => ({ id, text })),
  };
}
