// Kiểu dữ liệu miền thi cử — viết theo ĐÚNG phản hồi thật của backend.
//
// SOURCE OF TRUTH: Backend exam.model.js, examAttempt.model.js, examAttempt.controller.js
//
// ExamStatus: chỉ DRAFT | PUBLISHED | ARCHIVED (enum trong model).
//   COMPLETED / AVAILABLE / EXPIRED là trạng thái HIỂN THỊ (ExamDisplayStatus), không ghi DB.

/** Người dùng ở dạng đã populate. Backend trả ObjectId khi chưa populate, object khi đã. */
export interface UserSummary {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  studentCode?: string;
  avatar?: string;
}

/**
 * Tham chiếu tới một document: hoặc là id dạng chuỗi, hoặc object đã populate.
 */
export type Ref<T> = string | T;

export type QuestionType = "MCQ" | "ESSAY" | "SHORT_ANSWER" | "MULTIPLE_CHOICE";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface IQuestion {
  _id: string;
  content: string;
  type: QuestionType;
  options?: Array<{ id: string; content: any; order: number; isCorrect?: boolean }>;
  correctAnswer?: string;
  difficulty?: QuestionDifficulty;
  topicId?: string;
  topic?: string;
  tags?: string[];
  createdBy?: Ref<UserSummary>;
  createdAt?: string;
}

/** Một câu hỏi trong đề, kèm điểm được phân bổ. */
export interface IExamQuestionConfig {
  questionId: string;
  order?: number;
  points: number;
}

/**
 * Enum trạng thái Exam (Source of Truth = Backend enum DRAFT|PUBLISHED|ARCHIVED).
 */
export type ExamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Trạng thái hiển thị UI (derive từ status + startAt + endAt + thời gian hiện tại).
 * KHÔNG persist xuống DB.
 */
export type ExamDisplayStatus = ExamStatus | "COMPLETED" | "UPCOMING" | "ONGOING" | "EXPIRED";

/** Hàm derive display status từ exam data — thuần FE, không persist */
export const resolveExamDisplayStatus = (
  status: ExamStatus,
  startAt?: string | null,
  endAt?: string | null,
  now = Date.now()
): ExamDisplayStatus => {
  if (status !== "PUBLISHED") return status;
  if (startAt && now < new Date(startAt).getTime()) return "UPCOMING";
  if (endAt && now > new Date(endAt).getTime()) return "COMPLETED";
  return "ONGOING";
};

export interface IExam {
  _id: string;
  title: string;
  description?: string;
  /** Phút. */
  duration: number;
  classId: Ref<{ _id: string; className?: string }>;
  topicId?: Ref<{ _id: string; name?: string }> | null;
  createdBy?: Ref<UserSummary> | null;
  status: ExamStatus;
  questions?: IExamQuestionConfig[];
  startAt?: string | null;
  endAt?: string | null;
  attemptsAllowed?: number;
  scorePolicy?: "HIGHEST" | "LATEST";
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Backward compat aliases (không có trong model, chỉ dùng để tránh TS lỗi)
  /** @alias startAt — backward compat */
  startTime?: string | null;
  /** Không có trong schema, UI-only */
  maxScore?: number;
  /** Không có trong schema */
  isAIGenerated?: boolean;
  /** Không có trong schema */
  aiPromptUsed?: string | null;
}

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "PARTIALLY_GRADED" | "GRADED";

/** Câu trả lời trong attempt (questions[].answer trong model). */
export interface IAttemptQuestionAnswer {
  selectedOptionIds?: string[];
  content?: Array<{ type: string; text?: string }>;
}

/** Snapshot câu hỏi tại lúc bắt đầu thi. */
export interface IQuestionSnapshot {
  type: QuestionType;
  content: any;
  options?: Array<{ id: string; content: any; order: number }>;
}

/** Một câu trong ExamAttempt.questions[]. */
export interface IAttemptQuestion {
  questionId: string;
  questionSnapshot: IQuestionSnapshot;
  order: number;
  points: number;
  answer?: IAttemptQuestionAnswer;
  isCorrect?: boolean | null;
  score?: number;
}

export interface IExamAttempt {
  _id: string;
  examId: Ref<IExam>;
  studentId: Ref<UserSummary>;
  attemptNumber?: number;
  status: AttemptStatus;
  questions?: IAttemptQuestion[];
  score?: number | null;
  /** @alias score — backward compat */
  totalScore?: number | null;
  startedAt?: string;
  /** @alias startedAt — backward compat */
  startTime?: string;
  expiresAt?: string;
  /** @alias expiresAt — backward compat */
  endTime?: string;
  submittedAt?: string | null;
  performanceProcessedAt?: string | null;
  cheatWarnings?: number;
  cheatLogs?: Array<{ cheatType: string; timestamp: string }>;
  sessionToken?: string;
  activeTabId?: string;
  isLate?: boolean;
  lateBySeconds?: number;
  answersVersion?: number;
  createdAt?: string;
  // examInfo wrapper từ getAttempt response
  examInfo?: {
    title?: string;
    duration?: number;
    classId?: string;
    topicId?: string;
  } | null;
  serverTime?: string;
}

/** Thống kê tình trạng bài thi của một kỳ — khớp buildAttemptStats ở backend. */
export interface IAttemptStats {
  total: number;
  graded: number;
  pending: number;
  late: number;
  abandoned: number;
}

/** Một câu trong màn hình chấm bài của giáo viên. */
export interface IAttemptAnswerDetail {
  questionId: string;
  type?: QuestionType;
  questionContent?: any;
  options?: any[];
  studentAnswer: string;
  correctAnswer?: string;
  isCorrect?: boolean | null;
  pointsEarned?: number;
  maxPoints: number;
}

/** Payload của GET /api/exam-attempts/:id/review */
export interface IAttemptReview {
  attemptId: string;
  student: UserSummary;
  examInfo: { title: string; topicId?: string; duration: number };
  status: AttemptStatus;
  totalScore?: number;
  submittedAt?: string;
  cheatWarnings: number;
  cheatLogs?: Array<{ cheatType: string; timestamp: string }>;
  isLate: boolean;
  lateBySeconds: number;
  answersDetail: IAttemptAnswerDetail[];
}

/** Tham số lọc của GET /api/questions. */
export interface QuestionQueryParams {
  topic?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  search?: string;
}
