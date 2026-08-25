export type ContentBlockType = "TEXT" | "FORMULA" | "IMAGE";

export type FormulaDisplayMode = "INLINE" | "BLOCK";

export interface TextBlock {
  id: string;
  type: "TEXT";
  order: number;
  text: string;
}

export interface FormulaBlock {
  id: string;
  type: "FORMULA";
  order: number;
  latex: string;
  displayMode: FormulaDisplayMode;
}

export interface ImageBlock {
  id: string;
  type: "IMAGE";
  order: number;
  image: {
    url: string;
    alt?: string;
    caption?: string;
  };
}

export type ContentBlock = TextBlock | FormulaBlock | ImageBlock;

export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
export type SelectionMode = "SINGLE" | "MULTIPLE";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface QuestionOption {
  id: string;
  content: ContentBlock[];
  isCorrect: boolean;
  order: number;
}

export interface Question {
  _id: string;
  topicId: string;
  type: QuestionType;
  selectionMode?: SelectionMode;
  content: ContentBlock[];
  options?: QuestionOption[];
  difficulty: Difficulty;
  points: number;
  explanation?: ContentBlock[];
  tags?: string[];
  createdBy: string;
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}
