// Ghép danh sách học sinh của lớp với các bản ghi điểm danh đã có của một buổi.
//
// Tách khỏi AttendancePopup vì đoạn này toàn quy tắc chuẩn hoá id, và nó quyết định giáo viên
// có nhìn thấy đúng trạng thái đã lưu hay không. Sai một bước so khớp là cả bảng hiện
// "Present" mặc định, giáo viên bấm Lưu và ghi đè sạch dữ liệu cũ mà không hay biết.
import type {
  AttendanceStatus,
  IStudentAttendanceRecord,
} from "../../interface/attendanceInterface";

/**
 * Rút id học sinh ra khỏi một giá trị có thể đã populate thành object, hoặc còn là chuỗi.
 * Cùng một API trả về cả hai dạng tuỳ đường đi, nên phải chịu được cả hai.
 */
const extractId = (value: unknown): string => {
  if (value && typeof value === "object") {
    const obj = value as { _id?: string };
    return String(obj._id ?? "");
  }
  return String(value ?? "");
};

/** Trạng thái mặc định cho học sinh chưa có bản ghi nào trong buổi này. */
export const DEFAULT_STATUS: AttendanceStatus = "Present";

export const buildAttendanceRoster = (
  students: unknown[],
  existingRecords: unknown[]
): IStudentAttendanceRecord[] =>
  students.map((raw) => {
    const st = raw as Record<string, unknown>;
    const studentObj =
      st.studentId && typeof st.studentId === "object"
        ? (st.studentId as Record<string, unknown>)
        : null;

    // Ba nơi có thể chứa id, theo thứ tự ưu tiên: object đã populate, _id của chính phần tử,
    // rồi mới tới studentId dạng chuỗi.
    const sId = String(studentObj?._id ?? st._id ?? st.studentId ?? "");

    const found = existingRecords.find(
      (rec) => extractId((rec as Record<string, unknown>).studentId) === sId
    ) as Record<string, unknown> | undefined;

    return {
      studentId: sId,
      fullName: String(studentObj?.fullName ?? st.fullName ?? "Học sinh"),
      email: String(studentObj?.email ?? st.email ?? ""),
      avatar: (studentObj?.avatar ?? st.avatar) as string | undefined,
      status: (found?.status as AttendanceStatus) || DEFAULT_STATUS,
      note: String(found?.note ?? ""),
    };
  });
