import { classApi } from "./classApi";
import type { IStudentClass, StudentClassStatus } from "../types/studentClass";

/**
 * Lớp học ở dạng THÔ từ máy chủ, trước khi chuẩn hoá.
 *
 * Khác với IStudentClass ở chỗ `status` là chuỗi tự do của backend ("active"/"completed"/
 * "closed"/"Ready"/"draft"...), còn IStudentClass dùng bộ giá trị đã chuẩn hoá cho giao diện.
 * Chính sự khác biệt đó là lý do hàm map này tồn tại.
 */
interface RawUserRef {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface RawClassFromApi {
  // Mỗi cặp dưới đây là MỘT trường với hai tên khác nhau, do nhiều đợt phát triển chồng lên
  // nhau ở backend. Mapper phải nhận cả hai — khai báo đủ để thấy rõ mức độ trùng lặp thật
  // sự, thay vì `any` che đi.
  _id?: string;
  id?: string;
  className?: string;
  name?: string;
  classCode?: string;
  code?: string;

  joinCode?: string;
  subject?: string;
  subjectId?: { name?: string };
  courseId?: { subject?: string; courseName?: string };
  courseName?: string;
  semester?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  createdAt?: string;
  maxStudents?: number;
  currentStudents?: number;
  progress?: number | null;
  learningMode?: string;
  teacherId?: RawUserRef | null;
  students?: unknown[];

  isLiveSessionActive?: boolean;
  liveRoomId?: string;
}

export const studentClassApi = {
  // Lấy danh sách lớp do học sinh tham gia từ API thật Backend
  fetchMyClasses: async (): Promise<IStudentClass[]> => {
    const response = await classApi.getMyClasses();
    const rawData = response.data?.data || response.data?.classList || response.data || [];
    const classList = Array.isArray(rawData) ? rawData : [];

    return classList.map((item: RawClassFromApi) => {
      // Map status from backend (active/completed/closed) to student class status
      let mappedStatus: StudentClassStatus = "Active";
      if (item.status === "completed") {
        mappedStatus = "Completed";
      } else if (item.status === "closed") {
        mappedStatus = "Paused";
      } else if (item.status === "Ready" || item.status === "draft") {
        mappedStatus = "Ready";
      } else {
        mappedStatus = "Active";
      }

      const totalStud = item.students ? item.students.length : item.currentStudents || 0;

      return {
        _id: item._id || item.id || "",
        className: item.className || item.name || "Lớp học",
        classCode: item.classCode || item.code || `LMS-${(item._id || "").slice(-4).toUpperCase()}`,
        joinCode: item.joinCode,
        subject: item.subject || item.subjectId?.name || item.courseId?.subject || item.courseId?.courseName || "",
        courseName: item.courseId?.courseName || item.courseName || "",
        semester: item.semester || "",
        teacher: item.teacherId
          ? {
              _id: item.teacherId._id || item.teacherId.id || "",
              fullName: item.teacherId.fullName || item.teacherId.name || "Giảng viên",
              email: item.teacherId.email,
              avatar: item.teacherId.avatar,
            }
          : null,
        totalStudents: totalStud,
        maxStudents: item.maxStudents || 40,
        // Backend (GET /api/classes) nay đã trả tiến độ thật cho học sinh. Khi lớp chưa có
        // bài giảng/bài tập nào, Backend trả null — giữ nguyên null để UI hiển thị "—",
        // TUYỆT ĐỐI không sinh số ngẫu nhiên thay thế như bản cũ.
        progress: typeof item.progress === "number" ? item.progress : null,
        status: mappedStatus,
        startDate: item.startDate || item.createdAt || new Date().toISOString(),
        endDate: item.endDate,
        isLiveActive: Boolean(item.isLiveSessionActive || item.liveRoomId),
        learningMode: (item.learningMode || "Online") as IStudentClass["learningMode"],
        description: item.description,
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });
  },
};

export default studentClassApi;
