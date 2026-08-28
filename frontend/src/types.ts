export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "rating";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
}

export interface Survey {
  id: number;
  title: string;
  description: string | null;
  questions: Question[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  response_count?: number;
}

export type AnswerValue = string | string[] | number;
export type AnswerMap = Record<string, AnswerValue>;

export interface QuestionInsight {
  questionId: string;
  label: string;
  type: QuestionType;
  answered: number;
  counts?: Record<string, number>;
  average?: number;
  distribution?: Record<number, number>;
  responses?: string[];
}

export interface Analytics {
  survey: { id: number; title: string };
  total: number;
  insights: QuestionInsight[];
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Paragraph",
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  rating: "Rating",
};
