// Query key factory cho feature lớp học — cùng quy ước với dashboard.queryKeys.
// Gom một chỗ để không gõ nhầm key lúc invalidateQueries.
export const classQueryKeys = {
  /** Danh sách lớp của học sinh đang đăng nhập. */
  myClasses: ["student-classes", "mine"] as const,
};
