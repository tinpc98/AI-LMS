import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import teacherAttendanceService from "#modules/teacherAttendance/teacherAttendance.service.js";
import TeacherAttendance from "#modules/teacherAttendance/teacherAttendance.model.js";

vi.mock("#modules/teacherAttendance/teacherAttendance.model.js", () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
}));

// Ghi checkedInAt/checkedOutAt là thay đổi mới (trước đây 2 field này tồn tại trong schema
// nhưng không service nào từng gán giá trị — xem gap analysis EduSpace, mục R08). Test này
// khoá lại hành vi để không ai vô tình xoá logic ghi giờ dạy trong lần sửa sau.
describe("teacherAttendance.service — ghi giờ dạy thực tế", () => {
  const TEACHER_ID = new mongoose.Types.ObjectId().toString();
  const ADMIN_ID = new mongoose.Types.ObjectId().toString();
  const ATTENDANCE_ID = new mongoose.Types.ObjectId().toString();

  // confirmAttendance() khoá xác nhận nếu quá 24h kể từ khi buổi học kết thúc — dùng mốc
  // tương đối so với "bây giờ" thay vì ngày cố định để test không phụ thuộc thời điểm chạy.
  const now = Date.now();
  const scheduledStartAt = new Date(now - 2 * 60 * 60 * 1000);
  const scheduledEndAt = new Date(now - 30 * 60 * 1000);
  const actualStartAt = new Date(now - 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
  const actualEndAt = new Date(now - 25 * 60 * 1000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("confirmAttendance", () => {
    const buildAttendance = ({ session, save }) => ({
      _id: ATTENDANCE_ID,
      teacherId: { toString: () => TEACHER_ID },
      status: "PENDING",
      lockedAt: null,
      sessionId: session,
      save,
    });

    it("ưu tiên actualStartAt/actualEndAt khi buổi học có ghi nhận thời gian thực tế", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const attendance = buildAttendance({
        session: {
          status: "COMPLETED",
          scheduledStartAt,
          scheduledEndAt,
          actualStartAt,
          actualEndAt,
        },
        save,
      });
      TeacherAttendance.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(attendance),
      });

      await teacherAttendanceService.confirmAttendance(ATTENDANCE_ID, TEACHER_ID);

      expect(attendance.checkedInAt).toBe(actualStartAt);
      expect(attendance.checkedOutAt).toBe(actualEndAt);
      expect(attendance.status).toBe("CONFIRMED");
      expect(save).toHaveBeenCalledTimes(1);
    });

    it("dùng scheduledStartAt/scheduledEndAt khi buổi học không có actualStartAt/actualEndAt", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const attendance = buildAttendance({
        session: {
          status: "COMPLETED",
          scheduledStartAt,
          scheduledEndAt,
          actualStartAt: null,
          actualEndAt: null,
        },
        save,
      });
      TeacherAttendance.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(attendance),
      });

      await teacherAttendanceService.confirmAttendance(ATTENDANCE_ID, TEACHER_ID);

      expect(attendance.checkedInAt).toBe(scheduledStartAt);
      expect(attendance.checkedOutAt).toBe(scheduledEndAt);
    });
  });

  describe("overrideAttendance", () => {
    const buildAttendance = ({ status = "PENDING", session, save }) => ({
      _id: ATTENDANCE_ID,
      isDeleted: false,
      status,
      sessionId: session,
      lockedAt: null,
      save,
    });

    it("ghi checkedInAt/checkedOutAt khi admin override thành CONFIRMED", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const attendance = buildAttendance({
        session: { scheduledStartAt, scheduledEndAt, actualStartAt: null, actualEndAt: null },
        save,
      });
      TeacherAttendance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(attendance),
      });

      await teacherAttendanceService.overrideAttendance(ATTENDANCE_ID, ADMIN_ID, {
        status: "CONFIRMED",
        note: "Giáo viên quên xác nhận, admin xác nhận thay",
      });

      expect(attendance.checkedInAt).toBe(scheduledStartAt);
      expect(attendance.checkedOutAt).toBe(scheduledEndAt);
    });

    it("xoá checkedInAt/checkedOutAt khi admin override thành ABSENT", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const attendance = buildAttendance({
        status: "CONFIRMED",
        session: { scheduledStartAt, scheduledEndAt },
        save,
      });
      attendance.checkedInAt = scheduledStartAt;
      attendance.checkedOutAt = scheduledEndAt;
      TeacherAttendance.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(attendance),
      });

      await teacherAttendanceService.overrideAttendance(ATTENDANCE_ID, ADMIN_ID, {
        status: "ABSENT",
        note: "Giáo viên nghỉ đột xuất, không dạy buổi này",
      });

      expect(attendance.checkedInAt).toBeNull();
      expect(attendance.checkedOutAt).toBeNull();
    });
  });
});
