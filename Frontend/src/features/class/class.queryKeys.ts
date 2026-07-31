// Query key factory cho feature lớp học — cùng quy ước với dashboard.queryKeys.
// Gom một chỗ để không gõ nhầm key lúc invalidateQueries.
export const classQueryKeys = {
  /** Danh sách lớp của học sinh đang đăng nhập. */
  myClasses: ["student-classes", "mine"] as const,

  /** Chi tiết một lớp: thông tin lớp + bài giảng + bài tập + trạng thái đã nộp. */
  detail: (classId?: string) => ["class-detail", classId] as const,

  /** Điểm danh của học sinh trong một lớp. */
  attendance: (classId?: string) => ["class-attendance", classId] as const,

  /** Bảng điểm của học sinh trong một lớp. */
  grades: (classId?: string) => ["class-grades", classId] as const,
};
