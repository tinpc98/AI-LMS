// Kiểu dữ liệu miền thi cử — viết theo ĐÚNG phản hồi thật của backend.
//
// CÁCH LÀM: đọc model và controller ở Backend rồi mới viết, không suy từ tên biến. Kiểu bịa ra
// còn tệ hơn `any`: `any` nói thật rằng "không ai biết", còn một kiểu sai trông như đã được
// kiểm chứng và khiến người đọc tin nhầm.
//
// Nguồn đối chiếu:
//   Backend/src/modules/exam/exam.model.js
//   Backend/src/modules/question/question.model.js
//   Backend/src/modules/exam-attempt/examAttempt.model.js
//   Backend/src/modules/exam-attempt/examAttempt.controller.js  (hình dạng reviewData)

/** Người dùng ở dạng đã populate. Backend trả ObjectId khi chưa populate, object khi đã. */
export interface UserSummary {
  _id: string;
  fullName?: string;
  email?: string;
  studentCode?: string;
  avatar?: string;
}

/**
 * Tham chiếu tới một document: hoặc là id dạng chuỗi, hoặc object đã populate.
 *
 * Đây KHÔNG phải sự mơ hồ do lười — cùng một endpoint trả về hai dạng tuỳ có populate hay
 * không, và nơi gọi buộc phải xử lý cả hai. Kiểu này ép người viết nhớ điều đó.
 */
export type Ref<T> = string | T;

export type QuestionType = "MCQ" | "ESSAY";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface IQuestion {
  _id: string;
  content: string;
  type: QuestionType;
  options?: string[];
  /** Chỉ có ở phía giáo viên. Backend XOÁ trường này khi trả cho học sinh đang làm bài. */
  correctAnswer?: string;
  difficulty?: QuestionDifficulty;
  topic: string;
  tags?: string[];
  createdBy?: Ref<UserSummary>;
  createdAt?: string;
}

/** Một câu hỏi trong đề, kèm điểm được phân bổ. */
export interface IExamQuestionConfig {
  questionId: string;
  points: number;
  /** Đề sinh từ ExamSet lưu bản sao nội dung câu hỏi ngay trong document Exam. */
  isSnapshot?: boolean;
  snapshotData?: IQuestion | null;
}

export type ExamStatus = "DRAFT" | "PUBLISHED" | "COMPLETED";

export interface IExam {
  _id: string;
  title: string;
  /** Phút. */
  duration: number;
  startTime: string;
  classId: Ref<{ _id: string; className?: string }>;
  createdBy?: Ref<UserSummary> | null;
  isAIGenerated?: boolean;
  aiPromptUsed?: string | null;
  maxScore?: number;
  status: ExamStatus;
  questions?: IExamQuestionConfig[];
  topic?: string;
  createdAt?: string;
}

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "PARTIALLY_GRADED" | "GRADED";

export interface IAttemptAnswer {
  questionId: string;
  selectedOption?: string;
  essayText?: string;
  pointsEarned?: number;
}

export interface IExamAttempt {
  _id: string;
  examId: Ref<IExam>;
  studentId: Ref<UserSummary>;
  status: AttemptStatus;
  answers?: IAttemptAnswer[];
  totalScore?: number;
  startTime?: string;
  endTime?: string;
  cheatCount?: number;
  cheatWarnings?: number;
  /** Nộp quá hạn (Wave 7+). Hệ thống vẫn nhận bài, nhưng ghi lại để giáo viên thấy. */
  isLate?: boolean;
  /** Số giây vượt hạn, ĐÃ trừ ân hạn 2 phút. */
  lateBySeconds?: number;
  createdAt?: string;
}

/** Thống kê tình trạng bài thi của một kỳ — khớp buildAttemptStats ở backend. */
export interface IAttemptStats {
  total: number;
  graded: number;
  /** Chỉ đếm SUBMITTED — bài đang làm dở nằm ở `abandoned`. */
  pending: number;
  late: number;
  /** Bài kẹt IN_PROGRESS: học sinh vào thi nhưng không có kết quả. */
  abandoned: number;
}

/** Một câu trong màn hình chấm bài của giáo viên. */
export interface IAttemptAnswerDetail {
  questionId: string;
  type?: QuestionType;
  questionContent?: string;
  options?: string[];
  /** Backend đã gộp essayText / selectedOption về một trường, rỗng nếu bỏ trống. */
  studentAnswer: string;
  correctAnswer?: string;
  pointsEarned?: number;
  maxPoints: number;
}

/** Payload của GET /api/exam-attempts/:id/review — KHÔNG phải một IExamAttempt. */
export interface IAttemptReview {
  attemptId: string;
  student: UserSummary;
  examInfo: { title: string; topic?: string; duration: number };
  status: AttemptStatus;
  totalScore?: number;
  submittedAt?: string;
  cheatWarnings: number;
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
