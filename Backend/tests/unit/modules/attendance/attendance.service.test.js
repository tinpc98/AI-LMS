// Test cho attendance.service.js#getAttendanceStats — chốt lỗi thật đã tìm và sửa trong đợt
// review toàn dự án: khi sinh lịch buổi học, hệ thống tạo sẵn bản ghi Attendance status="DRAFT"
// cho MỌI buổi TƯƠNG LAI của mọi học sinh — trước đây không lọc DRAFT ra khỏi mẫu số, khiến lớp
// mới học vài buổi trong tổng số buổi cả kỳ bị tính tỉ lệ chuyên cần rất thấp một cách sai lệch.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const attendanceFind = vi.fn();
const attendanceFindById = vi.fn();
const classSessionFindById = vi.fn();
const classSessionUpdateOne = vi.fn();

vi.mock("#modules/attendance/attendance.model.js", () => ({
  default: { find: (...a) => attendanceFind(...a), findById: (...a) => attendanceFindById(...a) },
}));
vi.mock("#modules/class/index.js", () => ({ Class: {} }));
vi.mock("#modules/classEnrollment/index.js", () => ({ ClassEnrollment: {} }));
vi.mock("#modules/classSession/classSession.model.js", () => ({
  default: {
    findById: (...a) => classSessionFindById(...a),
    updateOne: (...a) => classSessionUpdateOne(...a),
  },
}));

const { default: attendanceService } = await import("#modules/attendance/attendance.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });
// "thenable-with-lean": finalizeSessionAttendance gọi Attendance.find(...) KHÔNG kèm .lean()
// (cần document Mongoose thật để .save()), trong khi getAttendanceStats gọi KÈM .lean() —
// cùng 1 mock phải phục vụ được cả 2 cách gọi.
const thenableWithLean = (result) => ({
  lean: () => Promise.resolve(result),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

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

// TÍNH NĂNG MỚI (mục 7, BR-7.6): thay time-lock 24h cũ bằng cửa sổ 7 ngày cho giáo viên,
// không giới hạn cho Admin; bắt buộc nhập lý do khi đổi status; ghi log (editLog); KHÔNG đụng
// autoStatus khi sửa tay.
describe("updateAttendance — BR-7.6: cửa sổ 7 ngày (giáo viên) / không giới hạn (Admin), bắt buộc lý do, ghi log", () => {
  const ATTENDANCE_ID = new mongoose.Types.ObjectId().toString();
  const SESSION_ID = new mongoose.Types.ObjectId().toString();
  const EDITOR_ID = new mongoose.Types.ObjectId().toString();

  const fakeAttendanceDoc = (overrides = {}) => ({
    sessionId: SESSION_ID,
    status: "PRESENT",
    autoStatus: "PRESENT",
    note: "",
    editLog: [],
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  it("Giáo viên sửa quá 7 ngày kể từ buổi học → chặn, ném lỗi 403", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);
    classSessionFindById.mockReturnValue(
      mongooseLean({ actualStartAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) })
    );

    await expect(
      attendanceService.updateAttendance(
        ATTENDANCE_ID,
        { status: "ABSENT", reason: "Xem lại camera" },
        EDITOR_ID,
        "teacher"
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(doc.save).not.toHaveBeenCalled();
  });

  it("Giáo viên sửa trong vòng 7 ngày, có lý do → cho phép, ghi vào editLog", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);
    classSessionFindById.mockReturnValue(
      mongooseLean({ actualStartAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) })
    );

    const result = await attendanceService.updateAttendance(
      ATTENDANCE_ID,
      { status: "ABSENT", reason: "Học sinh báo nghỉ sau buổi học" },
      EDITOR_ID,
      "teacher"
    );

    expect(result.status).toBe("ABSENT");
    expect(result.editLog).toHaveLength(1);
    expect(result.editLog[0]).toMatchObject({
      editedBy: EDITOR_ID,
      reason: "Học sinh báo nghỉ sau buổi học",
      fromStatus: "PRESENT",
      toStatus: "ABSENT",
    });
    // BR-7.5: sửa tay KHÔNG đụng autoStatus — vẫn giữ nguyên giá trị máy tính gốc.
    expect(result.autoStatus).toBe("PRESENT");
  });

  it("Đổi status mà KHÔNG kèm lý do → chặn, 400", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);
    classSessionFindById.mockReturnValue(mongooseLean({ actualStartAt: new Date() }));

    await expect(
      attendanceService.updateAttendance(ATTENDANCE_ID, { status: "ABSENT" }, EDITOR_ID, "teacher")
    ).rejects.toMatchObject({ status: 400 });
    expect(doc.save).not.toHaveBeenCalled();
  });

  it("Admin sửa sau 7 ngày vẫn được phép (không giới hạn thời gian)", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);

    const result = await attendanceService.updateAttendance(
      ATTENDANCE_ID,
      { status: "EXCUSED", reason: "Admin duyệt nghỉ phép muộn" },
      "admin-id",
      "admin"
    );

    expect(result.status).toBe("EXCUSED");
    expect(classSessionFindById).not.toHaveBeenCalled(); // Admin không cần kiểm cửa sổ thời gian.
  });

  it("Chỉ đổi note, KHÔNG đổi status → không cần lý do, không ghi log", async () => {
    const doc = fakeAttendanceDoc();
    attendanceFindById.mockResolvedValue(doc);
    classSessionFindById.mockReturnValue(mongooseLean({ actualStartAt: new Date() }));

    const result = await attendanceService.updateAttendance(
      ATTENDANCE_ID,
      { note: "Ghi chú thêm" },
      EDITOR_ID,
      "teacher"
    );

    expect(result.note).toBe("Ghi chú thêm");
    expect(result.editLog).toHaveLength(0);
  });
});

describe("finalizeSessionAttendance — TÍNH NĂNG MỚI (mục 7): chốt sổ điểm danh tự động", () => {
  const SESSION_ID = new mongoose.Types.ObjectId().toString();

  const fakeRecord = (evidence, overrides = {}) => ({
    evidence,
    status: "DRAFT",
    autoStatus: null,
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  beforeEach(() => {
    classSessionUpdateOne.mockResolvedValue({});
  });

  it("Buổi chưa có actualStartAt/actualEndAt (chưa thực sự diễn ra) → không tính gì, updated=0", async () => {
    classSessionFindById.mockReturnValue(mongooseLean({ _id: SESSION_ID, actualStartAt: null }));

    const result = await attendanceService.finalizeSessionAttendance(SESSION_ID);
    expect(result.updated).toBe(0);
    expect(attendanceFind).not.toHaveBeenCalled();
  });

  it("Tính đúng status cho từng bản ghi DRAFT, ghi finalizedAt, và đánh dấu session đã chốt sổ", async () => {
    const start = new Date("2026-01-01T08:00:00Z");
    const end = new Date("2026-01-01T09:30:00Z");
    classSessionFindById.mockReturnValue(
      mongooseLean({ _id: SESSION_ID, actualStartAt: start, actualEndAt: end })
    );

    const presentRecord = fakeRecord({
      sessions: [{ joinAt: new Date("2026-01-01T08:01:00Z"), leaveAt: end }],
    });
    const absentRecord = fakeRecord({ sessions: [] });
    attendanceFind.mockReturnValue(thenableWithLean([presentRecord, absentRecord]));

    const result = await attendanceService.finalizeSessionAttendance(SESSION_ID);

    expect(attendanceFind).toHaveBeenCalledWith({ sessionId: SESSION_ID, status: "DRAFT" });
    expect(result.updated).toBe(2);

    expect(presentRecord.status).toBe("PRESENT");
    expect(presentRecord.autoStatus).toBe("PRESENT");
    expect(presentRecord.finalizedAt).toBeInstanceOf(Date);
    expect(presentRecord.save).toHaveBeenCalled();

    expect(absentRecord.status).toBe("ABSENT");
    expect(absentRecord.autoStatus).toBe("ABSENT");

    expect(classSessionUpdateOne).toHaveBeenCalledWith(
      { _id: SESSION_ID },
      expect.objectContaining({ attendanceFinalizedAt: expect.any(Date) })
    );
  });

  it("Không có bản ghi DRAFT nào (đã chốt hoặc giáo viên đã sửa tay hết) → updated=0, không đụng gì", async () => {
    classSessionFindById.mockReturnValue(
      mongooseLean({ _id: SESSION_ID, actualStartAt: new Date(), actualEndAt: new Date() })
    );
    attendanceFind.mockReturnValue(thenableWithLean([]));

    const result = await attendanceService.finalizeSessionAttendance(SESSION_ID);
    expect(result.updated).toBe(0);
  });
});
