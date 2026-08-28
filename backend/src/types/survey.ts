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
  options?: string[]; // single_choice / multiple_choice
  maxRating?: number; // rating (defaults to 5)
}

// Map of questionId -> answer value.
export type AnswerMap = Record<string, string | string[] | number>;
