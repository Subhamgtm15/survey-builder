import { randomUUID } from "node:crypto";
import type { Question, QuestionType, AnswerMap } from "../types/survey.js";

const VALID_TYPES: QuestionType[] = [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "rating",
];

const CHOICE_TYPES: QuestionType[] = ["single_choice", "multiple_choice"];

export function sanitizeQuestions(input: unknown): Question[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("A survey must have at least one question.");
  }

  return input.map((raw, index) => {
    const q = raw as Partial<Question>;

    if (!q.type || !VALID_TYPES.includes(q.type)) {
      throw new Error(`Question ${index + 1} has an invalid type.`);
    }
    if (!q.label || typeof q.label !== "string" || !q.label.trim()) {
      throw new Error(`Question ${index + 1} is missing a label.`);
    }

    const question: Question = {
      id: q.id && typeof q.id === "string" ? q.id : randomUUID(),
      type: q.type,
      label: q.label.trim(),
      required: Boolean(q.required),
    };

    if (CHOICE_TYPES.includes(q.type)) {
      const options = (q.options ?? [])
        .filter((o): o is string => typeof o === "string" && o.trim().length > 0)
        .map((o) => o.trim());
      if (options.length < 2) {
        throw new Error(`Question ${index + 1} needs at least two options.`);
      }
      question.options = options;
    }

    if (q.type === "rating") {
      const max = Number(q.maxRating);
      question.maxRating = Number.isFinite(max) && max >= 2 && max <= 10 ? Math.floor(max) : 5;
    }

    return question;
  });
}

export function validateAnswers(questions: Question[], answers: AnswerMap): string[] {
  const errors: string[] = [];

  for (const q of questions) {
    const value = answers[q.id];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);

    if (q.required && isEmpty) {
      errors.push(`"${q.label}" is required.`);
      continue;
    }
    if (isEmpty) continue;

    switch (q.type) {
      case "short_text":
      case "long_text":
        if (typeof value !== "string") errors.push(`"${q.label}" must be text.`);
        break;
      case "single_choice":
        if (typeof value !== "string" || !q.options?.includes(value)) {
          errors.push(`"${q.label}" has an invalid selection.`);
        }
        break;
      case "multiple_choice":
        if (!Array.isArray(value) || value.some((v) => !q.options?.includes(v))) {
          errors.push(`"${q.label}" has an invalid selection.`);
        }
        break;
      case "rating": {
        const max = q.maxRating ?? 5;
        if (typeof value !== "number" || value < 1 || value > max) {
          errors.push(`"${q.label}" must be a rating between 1 and ${max}.`);
        }
        break;
      }
    }
  }

  return errors;
}
