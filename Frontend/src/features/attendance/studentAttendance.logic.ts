// Quy tắc nghiệp vụ của bảng điểm danh học sinh: làm giàu bản ghi, tính thống kê, lọc/sắp xếp.
//
// Tách khỏi useStudentAttendance vì đây là phần DUY NHẤT có quy tắc cần bảo vệ — nhất là công
// thức tính tỉ lệ chuyên cần, thứ quyết định học sinh có bị cảnh báo hay không. Nằm trong
// hook thì muốn kiểm phải dựng React và mock mạng, nên trước Wave 5 nó chưa có test nào.
import type { IAttendanceItem } from "../../interface/attendanceInterface";
import type {
  IExtendedAttendanceRecord,
  StudentAttendanceFilterOptions,
  StudentAttendanceStats,
} from "../../types/studentAttendance";

export const DEFAULT_ATTENDANCE_FILTERS: StudentAttendanceFilterOptions = {
  searchQuery: "",
  monthFilter: "all",
  statusFilter: "all",
  viewMode: "table",
  sortBy: "newest",
};

/**
 * Trọng số khi quy đổi ra tỉ lệ chuyên cần.
 *
 * Đi muộn tính 0,7 buổi và có phép tính 0,9 buổi — tức là VẮNG CÓ PHÉP VẪN BỊ TRỪ. Đây là quy
 * tắc nghiệp vụ có thật chứ không phải nhầm lẫn, nên đặt tên hằng số rõ ràng thay vì để số
 * trần trong công thức.
 */
const WEIGHT = { Present: 1, Late: 0.7, Excused: 0.9, Absent: 0 } as const;

/** Dưới các mốc này thì học sinh bị cảnh báo chuyên cần. */
const WARNING_THRESHOLD = { critical: 50, low: 80 } as const;

/** Bổ sung các trường chỉ dùng để hiển thị. Không đụng tới bản ghi gốc. */
export const extendRecords = (records: IAttendanceItem[]): IExtendedAttendanceRecord[] =>
  records.map((rec) => {
    const dateObj = rec.date ? new Date(rec.date) : new Date();
    const dateStr = dateObj.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const teacher = rec.teacherId as { fullName?: string } | string | undefined;

    return {
      ...rec,
      sessionTitle: `Buổi học ngày ${dateStr}`,
      // TODO: giờ học đang bị đặt cứng. Backend chưa trả giờ buổi học trong bản ghi điểm danh.
      sessionTime: "08:00 - 10:30",
      teacherName:
        typeof teacher === "object" && teacher?.fullName ? teacher.fullName : "Giảng viên",
      monthKey: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`,
    };
  });

export const computeAttendanceStats = (
  records: IExtendedAttendanceRecord[]
): StudentAttendanceStats => {
  const count = { Present: 0, Late: 0, Absent: 0, Excused: 0 };
  for (const item of records) {
    if (item.status in count) count[item.status as keyof typeof count] += 1;
  }

  const total = records.length;
  const weighted =
    count.Present * WEIGHT.Present + count.Late * WEIGHT.Late + count.Excused * WEIGHT.Excused;

  // Chưa có buổi nào thì coi như 100%: học sinh mới vào lớp không đáng bị cảnh báo.
  const presentRate = total > 0 ? Math.round((weighted / total) * 100) : 100;

  let warningLevel: StudentAttendanceStats["warningLevel"] = "none";
  if (presentRate < WARNING_THRESHOLD.critical) warningLevel = "critical";
  else if (presentRate < WARNING_THRESHOLD.low) warningLevel = "low";

  return {
    total,
    present: count.Present,
    late: count.Late,
    absent: count.Absent,
    excused: count.Excused,
    presentRate,
    warningLevel,
  };
};

/** Các tháng có dữ liệu, mới nhất trước — để đổ vào ô chọn lọc theo tháng. */
export const collectMonthOptions = (records: IExtendedAttendanceRecord[]): string[] =>
  Array.from(
    // `.filter(Boolean)` KHÔNG thu hẹp kiểu trong TypeScript — kết quả vẫn là
    // (string | undefined)[]. Phải dùng type predicate thì trình biên dịch mới biết.
    new Set(records.map((r) => r.monthKey).filter((key): key is string => Boolean(key)))
  )
    .sort()
    .reverse();

/** Trả về mảng MỚI. Dữ liệu gốc nằm trong cache React Query, không được sắp xếp tại chỗ. */
export const filterAndSortAttendance = (
  records: IExtendedAttendanceRecord[],
  filters: StudentAttendanceFilterOptions
): IExtendedAttendanceRecord[] => {
  const q = filters.searchQuery.toLowerCase().trim();

  return records
    .filter((rec) => {
      const matchesSearch =
        !q ||
        (rec.sessionTitle || "").toLowerCase().includes(q) ||
        (rec.note || "").toLowerCase().includes(q) ||
        (rec.date || "").includes(q);

      return (
        matchesSearch &&
        (filters.monthFilter === "all" || rec.monthKey === filters.monthFilter) &&
        (filters.statusFilter === "all" || rec.status === filters.statusFilter)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (filters.sortBy === "newest") return timeB - timeA;
      if (filters.sortBy === "oldest") return timeA - timeB;
      return 0;
    });
};
