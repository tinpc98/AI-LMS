// Test cho learningRanking.service.js — TÍNH NĂNG MỚI (mục 5): bảng xếp hạng đọc từ sổ cái XP
// thật (LearningActivity.xpAwarded), scope theo TUẦN, thay cho heuristic cũ (LessonProgress.progress
// + đếm Attendance/LearningActivity + tổng Grade — không phản ánh nghiệp vụ XP thật nào).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const classEnrollmentAggregate = vi.fn();

vi.mock("#modules/classEnrollment/classEnrollment.model.js", () => ({
  default: { aggregate: (...a) => classEnrollmentAggregate(...a) },
}));

const { default: learningRankingService } =
  await import("#modules/badge/learningRanking.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const STUDENT_A = new mongoose.Types.ObjectId().toString();
const STUDENT_B = new mongoose.Types.ObjectId().toString();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getClassRanking", () => {
  it("Gộp xpByType thành lessonXP/attendanceXP/gradeXP đúng nhóm, totalXP = tổng 3 nhóm", async () => {
    classEnrollmentAggregate.mockResolvedValue([
      {
        studentId: STUDENT_A,
        fullName: "An",
        email: "an@example.com",
        avatar: "",
        xpByType: [
          { _id: "Lesson Completed", totalXP: 20 },
          { _id: "Practice Quiz Passed", totalXP: 10 },
          { _id: "Attendance Present", totalXP: 10 },
          { _id: "Assignment Submitted", totalXP: 15 },
        ],
      },
    ]);

    const result = await learningRankingService.getClassRanking(CLASS_ID);

    expect(result.items[0]).toMatchObject({
      lessonXP: 30, // 20 + 10
      attendanceXP: 10,
      gradeXP: 15,
      totalXP: 55,
      rank: 1,
    });
  });

  it("Truy vấn learningactivities giới hạn createdAt >= đầu tuần (ISO, thứ 2)", async () => {
    classEnrollmentAggregate.mockResolvedValue([]);

    await learningRankingService.getClassRanking(CLASS_ID);

    const pipeline = classEnrollmentAggregate.mock.calls[0][0];
    const lookupStage = pipeline.find((s) => s.$lookup?.from === "learningactivities");
    const matchExpr = lookupStage.$lookup.pipeline[0].$match.$expr.$and;
    const weekStartCondition = matchExpr.find((c) => c.$gte);
    const weekStart = weekStartCondition.$gte[1];

    expect(weekStart.getUTCDay()).toBe(1); // Luôn là thứ 2 (Monday)
    expect(weekStart.getUTCHours()).toBe(0);
  });

  it("Học sinh chưa có XP nào tuần này -> rank=null (chưa có thứ hạng thi đua)", async () => {
    classEnrollmentAggregate.mockResolvedValue([
      {
        studentId: STUDENT_A,
        fullName: "An",
        xpByType: [{ _id: "Lesson Completed", totalXP: 20 }],
      },
      { studentId: STUDENT_B, fullName: "Bình", xpByType: [] },
    ]);

    const result = await learningRankingService.getClassRanking(CLASS_ID);

    const bStudent = result.items.find((i) => i.studentId === STUDENT_B);
    expect(bStudent.totalXP).toBe(0);
    expect(bStudent.rank).toBeNull();
  });

  it("Đồng hạng: 2 học sinh cùng totalXP -> cùng rank, học sinh kế tiếp nhảy đúng số hạng", async () => {
    classEnrollmentAggregate.mockResolvedValue([
      { studentId: "s1", fullName: "A", xpByType: [{ _id: "Lesson Completed", totalXP: 20 }] },
      { studentId: "s2", fullName: "B", xpByType: [{ _id: "Lesson Completed", totalXP: 20 }] },
      { studentId: "s3", fullName: "C", xpByType: [{ _id: "Attendance Present", totalXP: 10 }] },
    ]);

    const result = await learningRankingService.getClassRanking(CLASS_ID);

    expect(result.items.map((i) => i.rank)).toEqual([1, 1, 3]);
  });

  it("Phân trang: limit=1 trả đúng 1 item nhưng totalItems phản ánh toàn bộ", async () => {
    classEnrollmentAggregate.mockResolvedValue([
      { studentId: "s1", fullName: "A", xpByType: [{ _id: "Lesson Completed", totalXP: 20 }] },
      { studentId: "s2", fullName: "B", xpByType: [{ _id: "Lesson Completed", totalXP: 10 }] },
    ]);

    const result = await learningRankingService.getClassRanking(CLASS_ID, { page: 1, limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, limit: 1, totalItems: 2, totalPages: 2 });
  });
});

describe("getStudentRanking", () => {
  it("Trả về đúng bản ghi của học sinh trong bảng xếp hạng đầy đủ", async () => {
    classEnrollmentAggregate.mockResolvedValue([
      {
        studentId: STUDENT_A,
        fullName: "An",
        xpByType: [{ _id: "Lesson Completed", totalXP: 20 }],
      },
      { studentId: STUDENT_B, fullName: "Bình", xpByType: [] },
    ]);

    const result = await learningRankingService.getStudentRanking(CLASS_ID, STUDENT_B);

    expect(result.studentId).toBe(STUDENT_B);
    expect(result.totalXP).toBe(0);
  });

  it("Học sinh không thuộc lớp (không có trong ranking) -> null", async () => {
    classEnrollmentAggregate.mockResolvedValue([]);

    const result = await learningRankingService.getStudentRanking(CLASS_ID, "not-in-class");

    expect(result).toBeNull();
  });
});
