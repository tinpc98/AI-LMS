import type { TeacherAssignmentFilters } from "./teacherAssignment.types";

// Query key factory cho Teacher Assignment — tập trung cấu trúc key một chỗ thay vì
// rải rác string array thủ công, giảm rủi ro gõ nhầm khi invalidateQueries.
// "all" là root key dùng để invalidate toàn bộ nhánh sau khi assign/remove teacher.
export const teacherAssignmentQueryKeys = {
  all: ["teacher-assignments"] as const,
  classes: (filters: TeacherAssignmentFilters) =>
    ["teacher-assignments", "classes", filters] as const,
  allClasses: ["teacher-assignments", "allClasses"] as const,
  teachers: ["teacher-assignments", "teachers"] as const,
  courses: ["teacher-assignments", "courses"] as const,
};
