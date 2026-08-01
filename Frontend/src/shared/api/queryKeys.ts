// Toàn bộ query key của ứng dụng, gom một chỗ (§5.4 của plan tái cấu trúc).
//
// VÌ SAO PHẢI GOM
//
// Trước đây key nằm rải rác: ba file *.queryKeys.ts theo feature, cộng tám mảng viết thẳng
// tại chỗ dùng (["notifications"], ["lesson-summary", id], ["attendance-by-class", id, date]...).
// Rải rác thì có hai rủi ro cụ thể, không phải chuyện thẩm mỹ:
//
//   1. Gõ nhầm một ký tự trong invalidateQueries thì không có gì báo lỗi — nó chỉ lặng lẽ
//      không làm mới gì cả, và bug hiện ra dưới dạng "dữ liệu cũ" ở một màn hình khác.
//   2. Hai chỗ vô tình dùng chung một chuỗi thì cache lẫn vào nhau.
//
// QUY TẮC CẤU TRÚC: MỌI KEY ĐỀU BẮT ĐẦU BẰNG GỐC CỦA NHÓM MÌNH
//
// React Query so khớp key theo TIỀN TỐ. `invalidateQueries({ queryKey: queryKeys.class.all })`
// chỉ làm mới được toàn bộ nhánh lớp học nếu mọi key trong nhóm đó đều bắt đầu bằng "class".
// Bản cũ không giữ tính chất này — ví dụ danh sách lớp của học sinh là ["student-classes",
// "mine"] còn chi tiết lớp là ["class-detail", id]: hai nhánh rời nhau, không có cách nào
// làm mới cả cụm bằng một lời gọi.
//
// tests/queryKeys.test.ts duyệt toàn bộ object này và chốt tính chất đó bằng máy, nên thêm
// key mới sai quy ước sẽ đỏ ngay chứ không phải chờ ai đó soi ra.

/** Gốc của mỗi nhóm. Tách hằng số để test đối chiếu được, và để không gõ lại chuỗi. */
export const QUERY_ROOTS = {
  dashboard: "dashboard",
  class: "class",
  assignment: "assignment",
  lesson: "lesson",
  notification: "notification",
  teacherAssignment: "teacher-assignment",
  adminList: "admin-list",
} as const;

const {
  dashboard,
  class: cls,
  assignment,
  lesson,
  notification,
  teacherAssignment,
  adminList,
} = QUERY_ROOTS;

export const queryKeys = {
  dashboard: {
    all: [dashboard] as const,
    admin: [dashboard, "admin"] as const,
    teacher: [dashboard, "teacher"] as const,
  },

  class: {
    all: [cls] as const,
    /** Danh sách lớp của học sinh đang đăng nhập. */
    myClasses: [cls, "mine"] as const,
    /** Danh sách lớp giáo viên phụ trách. */
    myTeachingClasses: [cls, "teaching"] as const,
    /** Chi tiết một lớp: thông tin + bài giảng + bài tập + trạng thái đã nộp. */
    detail: (classId?: string) => [cls, "detail", classId] as const,
    /** Điểm danh của học sinh đang đăng nhập trong một lớp. */
    attendance: (classId?: string) => [cls, "attendance", classId] as const,
    /** Điểm danh của CẢ LỚP trong một buổi — dữ liệu giáo viên chấm. */
    attendanceByDate: (classId?: string, date?: string) =>
      [cls, "attendance-by-date", classId, date] as const,
    /** Bảng điểm của học sinh đang đăng nhập trong một lớp. */
    grades: (classId?: string) => [cls, "grades", classId] as const,
    /** Dữ liệu tham chiếu cho ô chọn — không phụ thuộc bộ lọc nên tải một lần. */
    courseOptions: [cls, "course-options"] as const,
    teacherOptions: [cls, "teacher-options"] as const,
  },

  assignment: {
    all: [assignment] as const,
    detail: (assignmentId?: string) => [assignment, "detail", assignmentId] as const,
  },

  lesson: {
    all: [lesson] as const,
    summary: (lessonId?: string) => [lesson, "summary", lessonId] as const,
  },

  notification: {
    all: [notification] as const,
    list: [notification, "list"] as const,
  },

  teacherAssignment: {
    all: [teacherAssignment] as const,
    classes: (filters: unknown) => [teacherAssignment, "classes", filters] as const,
    allClasses: [teacherAssignment, "all-classes"] as const,
    teachers: [teacherAssignment, "teachers"] as const,
    courses: [teacherAssignment, "courses"] as const,
  },

  /**
   * Danh sách quản trị có phân trang + thùng rác (useAdminListQuery).
   *
   * `resource` là tên tài nguyên do nơi gọi truyền vào ("accounts" | "courses" | "classes"),
   * nên nhóm này là hàm chứ không phải object tĩnh như các nhóm khác.
   */
  adminList: {
    all: [adminList] as const,
    byResource: (resource: string) => [adminList, resource] as const,
    list: (resource: string, isTrash: boolean, filters: unknown) =>
      [adminList, resource, isTrash ? "trash" : "active", filters] as const,
  },
} as const;
