import type { IExam, IExamAttempt } from "../api/examApi";

export type StudentExamStatus = "Upcoming" | "Available" | "In Progress" | "Completed" | "Expired";

export interface IExtendedExam extends IExam {
  attempt?: IExamAttempt | null;
  /**
   * Trạng thái SUY RA để hiển thị cho học sinh — KHÔNG phải trạng thái máy chủ.
   *
   * Trước đây trường này tên là `status` và GHI ĐÈ status của IExam, nên cùng một tên mang
   * hai bộ giá trị hoàn toàn khác nhau ("Upcoming" vs "PUBLISHED") tuỳ người đọc đang cầm
   * kiểu nào. Khi IExam còn khai báo `status: ... | string` thì TypeScript im lặng cho qua;
   * siết kiểu lại là mâu thuẫn lộ ra ngay.
   *
   * Nay hai thứ tách bạch: `status` giữ nguyên giá trị máy chủ, `displayStatus` là kết quả
   * suy từ status + thời gian + lượt thi của chính học sinh đó.
   */
  displayStatus: StudentExamStatus;
  isAvailableNow?: boolean;
  minutesRemaining?: number;
  description?: string;
  totalQuestions?: number;
}

export interface StudentExamFilterOptions {
  searchQuery: string;
  statusFilter: "all" | "upcoming" | "available" | "in_progress" | "completed" | "expired";
  sortBy: "start_asc" | "start_desc" | "newest" | "name_asc";
}

export interface StudentExamStats {
  total: number;
  available: number;
  inProgress: number;
  completed: number;
  averageScore: number | null;
}
