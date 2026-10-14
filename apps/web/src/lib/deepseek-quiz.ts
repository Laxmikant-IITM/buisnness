/**
 * @file apps/web/src/lib/deepseek-quiz.ts
 * @description AI Question extraction service using the DeepSeek API.
 * Converts unstructured exam text or PDF extractions into defensively validated
 * Question and Choice JSON structures with LaTeX math preservation.
 */

import { z } from 'zod';

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

/** Choice schema for extracted question options */
export const extractedChoiceSchema = z.object({
  text: z.string().trim().min(1, 'Choice text cannot be empty'),
  isCorrect: z.boolean(),
});

/** Validated schema for a single extracted question */
export const extractedQuestionSchema = z.object({
  prompt: z.string().trim().min(5, 'Question prompt is too short'),
  type: z
    .enum(['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTI', 'TRUE_FALSE', 'NUMERICAL'])
    .default('MULTIPLE_CHOICE_SINGLE'),
  explanation: z.string().trim().nullable().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
  tags: z.array(z.string().trim().min(1)).default([]),
  choices: z.array(extractedChoiceSchema).default([]),
  numericalAnswer: z.number().nullable().optional(),
  numericalTolerance: z.number().nullable().optional(),
});

export type ExtractedQuestion = z.infer<typeof extractedQuestionSchema>;

/** Extraction envelope schema */
export const extractionResultSchema = z.object({
  examTitle: z.string().optional(),
  subject: z.string().optional(),
  questions: z.array(extractedQuestionSchema).min(1, 'At least one question must be extracted'),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export interface DeepSeekExtractOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  subjectHint?: string;
}

/**
 * System prompt instructing DeepSeek to act as an expert edtech assessment engineer.
 * Enforces pure JSON output and preserves LaTeX syntax ($...$, $$...$$, \ce{...}).
 */
const SYSTEM_PROMPT = `
You are an expert EdTech assessment engineer and exam extraction specialist.
Your mission: Given raw text extracted from an exam paper or syllabus PDF, accurately convert each question into a high-fidelity JSON object.

Strict Rules:
1. Preserve all mathematical and chemical equations in standard KaTeX LaTeX:
   - Use $...$ for inline math (e.g. $E = mc^2$, $x \\in \\mathbb{R}$).
   - Use $$...$$ for display math.
   - For chemical formulas, use standard formulas or \\ce{...} (e.g. $H_2O$, $\\ce{CaCO3}$).
2. Accurately identify question types:
   - MULTIPLE_CHOICE_SINGLE: exactly one correct answer.
   - MULTIPLE_CHOICE_MULTI: one or more correct answers.
   - TRUE_FALSE: two choices ("True" and "False"), exactly one correct.
   - NUMERICAL: question expecting a numerical value (provide numericalAnswer and numericalTolerance).
3. Always supply a thorough, step-by-step 'explanation' for why the correct answer is correct.
4. If the raw text does not clearly indicate which answer key is correct, use your academic knowledge to identify the correct answer, and mark isCorrect: true on that choice.
5. Return ONLY a single raw JSON object matching the requested schema. Do NOT enclose your output in markdown code blocks, and do NOT add explanatory text outside the JSON.
`;

/**
 * Cleans potential markdown fencing around LLM JSON outputs.
 */
function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Sends exam paper text to DeepSeek and validates the returned structured questions.
 *
 * @param rawText - Extracted text from PDF or past exam paper
 * @param options - API options including key, model, and subject hint
 * @returns Parsed and validated questions
 */
export async function extractQuestionsFromText(
  rawText: string,
  options: DeepSeekExtractOptions = {},
): Promise<ExtractionResult> {
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is missing.');
  }

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.1;

  const userPrompt = `
Extract all questions from the following exam text. Return a JSON object with keys:
- "examTitle": string (optional title of the paper)
- "subject": string (optional subject)
- "questions": array of objects:
  {
    "prompt": string,
    "type": "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTI" | "TRUE_FALSE" | "NUMERICAL",
    "explanation": string,
    "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    "tags": string[],
    "choices": [ { "text": string, "isCorrect": boolean } ],
    "numericalAnswer": number or null,
    "numericalTolerance": number or null
  }

Exam Content:
${rawText.slice(0, 45_000)}
`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error HTTP ${response.status}: ${errorBody}`);
  }

  const completion = await response.json();
  const rawMessage = completion?.choices?.[0]?.message?.content;
  if (!rawMessage || typeof rawMessage !== 'string') {
    throw new Error('Empty response received from DeepSeek API.');
  }

  const cleanedJsonStr = stripMarkdownFences(rawMessage);
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(cleanedJsonStr);
  } catch (err) {
    throw new Error(`Failed to parse DeepSeek JSON response: ${(err as Error).message}\nRaw: ${cleanedJsonStr.slice(0, 200)}`);
  }

  // Validate with Zod
  const validated = extractionResultSchema.safeParse(parsedJson);
  if (!validated.success) {
    // If wrapped differently, try parsing questions array directly
    if (Array.isArray(parsedJson)) {
      const arrayVal = z.array(extractedQuestionSchema).safeParse(parsedJson);
      if (arrayVal.success) {
        return { questions: arrayVal.data };
      }
    }
    throw new Error(`DeepSeek output failed schema validation: ${validated.error.message}`);
  }

  return validated.data;
}
