import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { getTeacherContributionSummary } from "../../../src/reporting/contribution.service.js";
import { TeacherAttendance } from "#modules/teacherAttendance";
import { ClassEnrollment } from "#modules/classEnrollment";

vi.mock("#modules/teacherAttendance", () => ({
  TeacherAttendance: { find: vi.fn() },
}));
vi.mock("#modules/classEnrollment", () => ({
  ClassEnrollment: { distinct: vi.fn() },
}));

describe("contribution.service — getTeacherContributionSummary", () => {
  const TEACHER_ID = new mongoose.Types.ObjectId().toString();
  const CLASS_A = new mongoose.Types.ObjectId().toString();
  const CLASS_B = new mongoose.Types.ObjectId().toString();

  const mockFind = (records) => {
    TeacherAttendance.find.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(records) }),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cộng đúng tổng giờ từ chênh lệch checkedOutAt - checkedInAt trên nhiều buổi", async () => {
    mockFind([
      {
        classId: CLASS_A,
        checkedInAt: new Date("2026-08-01T08:00:00.000Z"),
        checkedOutAt: new Date("2026-08-01T10:00:00.000Z"), // 2h
      },
      {
        classId: CLASS_A,
        checkedInAt: new Date("2026-08-03T08:00:00.000Z"),
        checkedOutAt: new Date("2026-08-03T09:30:00.000Z"), // 1.5h
      },
    ]);
    ClassEnrollment.distinct.mockResolvedValue(["s1", "s2"]);

    const result = await getTeacherContributionSummary(TEACHER_ID);

    expect(result.totalHours).toBe(3.5);
    expect(result.totalSessions).toBe(2);
  });

  it("đếm đúng số lớp (distinct classId) và số học viên (distinct studentId qua ClassEnrollment ACTIVE)", async () => {
    mockFind([
      { classId: CLASS_A, checkedInAt: new Date(0), checkedOutAt: new Date(3600000) },
      { classId: CLASS_A, checkedInAt: new Date(0), checkedOutAt: new Date(3600000) },
      { classId: CLASS_B, checkedInAt: new Date(0), checkedOutAt: new Date(3600000) },
    ]);
    ClassEnrollment.distinct.mockResolvedValue(["s1", "s2", "s3"]);

    const result = await getTeacherContributionSummary(TEACHER_ID);

    expect(result.totalClasses).toBe(2);
    expect(result.totalStudents).toBe(3);
    expect(ClassEnrollment.distinct).toHaveBeenCalledWith("studentId", {
      classId: { $in: [CLASS_A, CLASS_B] },
      status: "ACTIVE",
    });
  });

  it("trả về toàn 0 và KHÔNG gọi ClassEnrollment khi giáo viên chưa có buổi nào được xác nhận", async () => {
    mockFind([]);

    const result = await getTeacherContributionSummary(TEACHER_ID);

    expect(result).toMatchObject({
      totalHours: 0,
      totalSessions: 0,
      totalClasses: 0,
      totalStudents: 0,
    });
    expect(ClassEnrollment.distinct).not.toHaveBeenCalled();
  });

  it("chỉ tính buổi có status CONFIRMED và có đủ checkedInAt/checkedOutAt", async () => {
    mockFind([]);
    await getTeacherContributionSummary(TEACHER_ID);

    expect(TeacherAttendance.find).toHaveBeenCalledWith(
      expect.objectContaining({
        teacherId: expect.anything(),
        status: "CONFIRMED",
        isDeleted: false,
        checkedInAt: { $ne: null },
        checkedOutAt: { $ne: null },
      })
    );
  });

  it("không cho giờ âm nếu dữ liệu bất thường có checkedOutAt trước checkedInAt", async () => {
    mockFind([
      {
        classId: CLASS_A,
        checkedInAt: new Date("2026-08-01T10:00:00.000Z"),
        checkedOutAt: new Date("2026-08-01T09:00:00.000Z"),
      },
    ]);
    ClassEnrollment.distinct.mockResolvedValue([]);

    const result = await getTeacherContributionSummary(TEACHER_ID);

    expect(result.totalHours).toBe(0);
  });
});
