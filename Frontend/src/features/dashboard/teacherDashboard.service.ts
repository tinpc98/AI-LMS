// File: src/features/dashboard/teacherDashboard.service.ts
// Tầng lấy dữ liệu cho Dashboard giáo viên — tách khỏi HomePageTeacher.tsx (Wave 1.2).
// Component không được chứa logic gọi API/ghép dữ liệu.
import { classApi } from "../../api/classApi";
import axiosClient from "../../api/axiosClient";

// Giới hạn số lớp được truy vấn bài tập / phiên live, giữ nguyên hành vi bản cũ.
const MAX_CLASSES_TO_EXPAND = 5;

export interface TeacherDashboardData {
  classes: any[];
  announcements: any[];
  assignments: any[];
  activeLiveSessions: any[];
}

const unwrapList = (payload: any, ...keys: string[]): any[] => {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return Array.isArray(payload) ? payload : [];
};

/**
 * Lấy toàn bộ dữ liệu Dashboard giáo viên trong MỘT lần gọi.
 *
 * Khác biệt so với bản cũ (fetchDashboardData trong component):
 * - Lớp học và thông báo vốn độc lập nhau nên nay chạy song song thay vì nối đuôi.
 *   Bản cũ chờ xong lớp mới gọi thông báo dù không hề cần dữ liệu lớp.
 * - Trả về một object duy nhất; React Query cập nhật state một lần thay vì 4 lần
 *   setState rải rác qua nhiều tick (nguyên nhân cascading render — BC13 #2).
 *
 * Giữ nguyên quy ước xử lý lỗi của bản cũ: lỗi khi lấy danh sách lớp là lỗi nghiêm trọng
 * (ném ra để hiện Alert), còn thông báo/bài tập/phiên live lỗi thì bỏ qua âm thầm.
 */
export const fetchTeacherDashboard = async (): Promise<TeacherDashboardData> => {
  const [classRes, annRes] = await Promise.all([
    classApi.getMyClasses(),
    axiosClient.get("/api/announcements").catch((e) => {
      console.warn("[Teacher Dashboard] Announcements fetch warning:", e);
      return null;
    }),
  ]);

  const classes = unwrapList(classRes.data, "data", "classList");
  const announcements = annRes ? unwrapList(annRes.data, "data", "items") : [];

  if (classes.length === 0) {
    return { classes, announcements, assignments: [], activeLiveSessions: [] };
  }

  const targetClasses = classes.slice(0, MAX_CLASSES_TO_EXPAND);

  // Hai nhóm request này cũng độc lập nhau -> chạy song song thay vì tuần tự như bản cũ.
  const [assignmentResults, liveResults] = await Promise.all([
    Promise.all(
      targetClasses.map((cls: any) =>
        axiosClient.get(`/api/assignments/class/${cls._id}`).catch(() => null)
      )
    ),
    Promise.all(
      targetClasses.map((cls: any) =>
        axiosClient.get(`/api/live/classes/${cls._id}/active`).catch(() => null)
      )
    ),
  ]);

  const assignments = assignmentResults.flatMap((res) =>
    Array.isArray(res?.data?.assignments) ? res.data.assignments : []
  );

  const activeLiveSessions = liveResults
    .filter((res) => res?.data?.data && res.data.data.status === "Live")
    .map((res) => res?.data?.data);

  return { classes, announcements, assignments, activeLiveSessions };
};

export default { fetchTeacherDashboard };
