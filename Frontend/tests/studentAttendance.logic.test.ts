// Chốt công thức tính chuyên cần — con số quyết định học sinh có bị cảnh báo hay không.
//
// Trước Wave 5 công thức này nằm trong useStudentAttendance nên không kiểm được nếu không
// dựng React, và chưa từng có test nào. Trọng số 0,7 / 0,9 nhìn như số ma; test này ghim
// chúng lại để không ai "làm tròn cho gọn" mà vô tình đổi kết quả học tập của học sinh.
import { describe, it, expect } from "vitest";
import {
  DEFAULT_ATTENDANCE_FILTERS,
  collectMonthOptions,
  computeAttendanceStats,
  extendRecords,
  filterAndSortAttendance,
} from "../src/features/attendance/studentAttendance.logic";
import type { IAttendanceItem } from "../src/interface/attendanceInterface";

const buoi = (over: Partial<IAttendanceItem>): IAttendanceItem =>
  ({ _id: "a", date: "2026-03-10", status: "Present", ...over }) as IAttendanceItem;

const ext = (items: Partial<IAttendanceItem>[]) => extendRecords(items.map(buoi));

describe("extendRecords", () => {
  it("dựng tiêu đề buổi học theo ngày, định dạng Việt Nam", () => {
    const [r] = ext([{ date: "2026-03-10" }]);
    expect(r.sessionTitle).toBe("Buổi học ngày 10/03/2026");
  });

  it("lấy tên giảng viên khi teacherId đã được populate", () => {
    const [co, khong] = ext([
      { teacherId: { fullName: "Cô Lan" } as never },
      { teacherId: "id-tho" as never },
    ]);
    expect(co.teacherName).toBe("Cô Lan");
    expect(khong.teacherName).toBe("Giảng viên");
  });

  it("monthKey dùng để nhóm theo tháng, có đệm số 0", () => {
    const [r] = ext([{ date: "2026-03-10" }]);
    expect(r.monthKey).toBe("2026-03");
  });
});

describe("computeAttendanceStats — tỉ lệ chuyên cần", () => {
  it("có mặt đủ thì 100%", () => {
    const s = computeAttendanceStats(ext([{ status: "Present" }, { status: "Present" }]));
    expect(s.presentRate).toBe(100);
    expect(s.warningLevel).toBe("none");
  });

  it("đi muộn tính 0,7 buổi", () => {
    // 1 có mặt + 1 muộn = 1,7 / 2 buổi = 85%
    const s = computeAttendanceStats(ext([{ status: "Present" }, { status: "Late" }]));
    expect(s.presentRate).toBe(85);
  });

  it("VẮNG CÓ PHÉP VẪN BỊ TRỪ — tính 0,9 buổi", () => {
    // Đây là quy tắc nghiệp vụ dễ gây tranh cãi nhất, nên chốt tường minh.
    const s = computeAttendanceStats(ext([{ status: "Excused" }]));
    expect(s.presentRate).toBe(90);
  });

  it("vắng không phép không được tính gì", () => {
    const s = computeAttendanceStats(ext([{ status: "Present" }, { status: "Absent" }]));
    expect(s.presentRate).toBe(50);
  });

  it("đếm đúng từng loại", () => {
    const s = computeAttendanceStats(
      ext([
        { status: "Present" },
        { status: "Present" },
        { status: "Late" },
        { status: "Absent" },
        { status: "Excused" },
      ])
    );
    expect(s).toMatchObject({ total: 5, present: 2, late: 1, absent: 1, excused: 1 });
  });

  it("chưa có buổi nào thì 100% — học sinh mới vào lớp không bị cảnh báo", () => {
    const s = computeAttendanceStats([]);
    expect(s.presentRate).toBe(100);
    expect(s.warningLevel).toBe("none");
    expect(s.total).toBe(0);
  });

  it.each([
    [["Absent", "Absent", "Present"], "critical"], // 33%
    [["Absent", "Present", "Present"], "low"], // 67%
    [["Present", "Present", "Present"], "none"], // 100%
  ])("mức cảnh báo cho %j là %s", (statuses, expected) => {
    const s = computeAttendanceStats(ext((statuses as string[]).map((status) => ({ status }))));
    expect(s.warningLevel).toBe(expected);
  });

  it("mốc 80% là ranh giới: đúng 80 thì CHƯA cảnh báo", () => {
    // 4 có mặt + 1 vắng = 80%
    const s = computeAttendanceStats(
      ext([
        { status: "Present" },
        { status: "Present" },
        { status: "Present" },
        { status: "Present" },
        { status: "Absent" },
      ])
    );
    expect(s.presentRate).toBe(80);
    expect(s.warningLevel).toBe("none");
  });
});

describe("collectMonthOptions", () => {
  it("gom các tháng có dữ liệu, mới nhất trước", () => {
    const r = ext([{ date: "2026-01-05" }, { date: "2026-03-10" }, { date: "2026-01-20" }]);
    expect(collectMonthOptions(r)).toEqual(["2026-03", "2026-01"]);
  });
});

describe("filterAndSortAttendance", () => {
  const duLieu = ext([
    { _id: "1", date: "2026-01-05", status: "Present", note: "đúng giờ" },
    { _id: "2", date: "2026-03-10", status: "Absent", note: "ốm" },
    { _id: "3", date: "2026-03-20", status: "Late" },
  ]);

  it("mặc định xếp mới nhất trước", () => {
    const kq = filterAndSortAttendance(duLieu, DEFAULT_ATTENDANCE_FILTERS);
    expect(kq.map((r) => r._id)).toEqual(["3", "2", "1"]);
  });

  it("xếp cũ nhất trước khi chọn oldest", () => {
    const kq = filterAndSortAttendance(duLieu, {
      ...DEFAULT_ATTENDANCE_FILTERS,
      sortBy: "oldest",
    });
    expect(kq.map((r) => r._id)).toEqual(["1", "2", "3"]);
  });

  it("lọc theo tháng và theo trạng thái", () => {
    expect(
      filterAndSortAttendance(duLieu, { ...DEFAULT_ATTENDANCE_FILTERS, monthFilter: "2026-03" })
    ).toHaveLength(2);
    expect(
      filterAndSortAttendance(duLieu, { ...DEFAULT_ATTENDANCE_FILTERS, statusFilter: "Absent" })
    ).toHaveLength(1);
  });

  it("tìm kiếm khớp cả ghi chú lẫn ngày", () => {
    expect(
      filterAndSortAttendance(duLieu, { ...DEFAULT_ATTENDANCE_FILTERS, searchQuery: "ốm" })
    ).toHaveLength(1);
    expect(
      filterAndSortAttendance(duLieu, { ...DEFAULT_ATTENDANCE_FILTERS, searchQuery: "2026-01" })
    ).toHaveLength(1);
  });

  it("không đụng vào mảng đầu vào — nó là dữ liệu trong cache dùng chung", () => {
    const truoc = duLieu.map((r) => r._id);
    filterAndSortAttendance(duLieu, { ...DEFAULT_ATTENDANCE_FILTERS, sortBy: "oldest" });
    expect(duLieu.map((r) => r._id)).toEqual(truoc);
  });
});
