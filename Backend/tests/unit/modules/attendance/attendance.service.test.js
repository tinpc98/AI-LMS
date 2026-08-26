// Test cho attendance.service.js#getAttendanceStats — chốt lỗi thật đã tìm và sửa trong đợt
// review toàn dự án: khi sinh lịch buổi học, hệ thống tạo sẵn bản ghi Attendance status="DRAFT"
// cho MỌI buổi TƯƠNG LAI của mọi học sinh — trước đây không lọc DRAFT ra khỏi mẫu số, khiến lớp
// mới học vài buổi trong tổng số buổi cả kỳ bị tính tỉ lệ chuyên cần rất thấp một cách sai lệch.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const attendanceFind = vi.fn();
const attendanceFindById = vi.fn();
const classSessionFindById = vi.fn();

vi.mock("#modules/attendance/attendance.model.js", () => ({
  default: { find: (...a) => attendanceFind(...a), findById: (...a) => attendanceFindById(...a) },
}));
vi.mock("#modules/class/index.js", () => ({ Class: {} }));
vi.mock("#modules/classEnrollment/index.js", () => ({ ClassEnrollment: {} }));
vi.mock("#modules/classSession/classSession.model.js", () => ({
  default: { findById: (...a) => classSessionFindById(...a) },
}));

const { default: attendanceService } = await import("#modules/attendance/attendance.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAttendanceStats — BUG ĐÃ SỬA: loại DRAFT khỏi mẫu số", () => {
  it("Query gửi xuống Mongo PHẢI loại trừ status=DRAFT ngay trong filter (không lọc sau ở tầng JS)", async () => {
    attendanceFind.mockReturnValue(mongooseLean([]));

    await attendanceService.getAttendanceStats(CLASS_ID);

    expect(attendanceFind).toHaveBeenCalledWith({ classId: CLASS_ID, status: { $ne: "DRAFT" } });
  });

  it("5 buổi PRESENT đã diễn ra + 35 buổi DRAFT tương lai → total=5 (không phải 40), presentRate=100%", async () => {
    // Mock đúng hành vi Mongo thật: filter {status:{$ne:"DRAFT"}} sẽ KHÔNG trả về bản ghi DRAFT.
    const daHoc = Array.from({ length: 5 }, () => ({ status: "PRESENT" }));
    attendanceFind.mockReturnValue(mongooseLean(daHoc));

    const stats = await attendanceService.getAttendanceStats(CLASS_ID);

    expect(stats.total).toBe(5);
    expect(stats.presentRate).toBe("100.0");
  });

  it("ID lớp không hợp lệ → trả thống kê rỗng, không gọi DB", async () => {
    const stats = await attendanceService.getAttendanceStats("khong-hop-le");
    expect(stats).toEqual({ total: 0, present: 0, absent: 0, late: 0, excused: 0, presentRate: 0 });
    expect(attendanceFind).not.toHaveBeenCalled();
  });
});

describe("updateAttendance — BUG ĐÃ SỬA: áp time-lock 24h giống markAttendance/confirmAttendance", () => {
  const ATTENDANCE_ID = new mongoose.Types.ObjectId().toString();
  const SESSION_ID = new mongoose.Types.ObjectId().toString();

  const fakeAttendanceDoc = (overrides = {}) => ({
    sessionId: SESSION_ID,
    status: "PRESENT",
    note: "",
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  it("Buổi học đã kết thúc quá 24h → chặn sửa, ném lỗi 403", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);
    classSessionFindById.mockReturnValue(
      mongooseLean({ scheduledEndAt: new Date(Date.now() - 30 * 60 * 60 * 1000) })
    );

    await expect(
      attendanceService.updateAttendance(ATTENDANCE_ID, { status: "ABSENT" })
    ).rejects.toMatchObject({ status: 403 });
    expect(doc.save).not.toHaveBeenCalled();
  });

  it("Buổi học vừa kết thúc trong vòng 24h → cho phép sửa bình thường", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);
    classSessionFindById.mockReturnValue(
      mongooseLean({ scheduledEndAt: new Date(Date.now() - 2 * 60 * 60 * 1000) })
    );

    const result = await attendanceService.updateAttendance(ATTENDANCE_ID, { status: "ABSENT" });
    expect(result.status).toBe("ABSENT");
    expect(doc.save).toHaveBeenCalled();
  });
});
