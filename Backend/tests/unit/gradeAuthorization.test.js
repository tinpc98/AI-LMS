// Test cho fix AUTHZ-03/05: chặn giáo viên nhập/xem điểm của lớp không phụ trách.
import { describe, it, expect, afterEach, vi } from "vitest";
import gradeService from "../../src/modules/grade/grade.service.js";
import { Class as classModel } from "#modules/class";
import { Grade } from "#modules/grade";

const OWNER_TEACHER_ID = "507f1f77bcf86cd799439011";
const OTHER_TEACHER_ID = "507f1f77bcf86cd799439099";
const CLASS_ID = "607f1f77bcf86cd799439111";
const STUDENT_ID = "607f1f77bcf86cd799439222";

const makeClass = () => ({ _id: CLASS_ID, teacherId: OWNER_TEACHER_ID, courseId: "course-1" });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("gradeService.upsertGrade — AUTHZ-03", () => {
  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue(makeClass());

    await expect(
      gradeService.upsertGrade({
        studentId: STUDENT_ID,
        classId: CLASS_ID,
        category: "assignment",
        score: 8,
        gradedBy: OTHER_TEACHER_ID,
        gradedByRole: "Teacher",
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Giáo viên phụ trách lớp nhập điểm thành công", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue(makeClass());
    vi.spyOn(Grade, "findOneAndUpdate").mockReturnValue({
      populate: () => Promise.resolve({ _id: "grade-1", score: 8 }),
    });

    const result = await gradeService.upsertGrade({
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      category: "assignment",
      score: 8,
      gradedBy: OWNER_TEACHER_ID,
      gradedByRole: "Teacher",
    });
    expect(result.score).toBe(8);
  });

  it("Admin nhập điểm cho bất kỳ lớp nào cũng được", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue(makeClass());
    vi.spyOn(Grade, "findOneAndUpdate").mockReturnValue({
      populate: () => Promise.resolve({ _id: "grade-1", score: 9 }),
    });

    const result = await gradeService.upsertGrade({
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      category: "assignment",
      score: 9,
      gradedBy: "admin-id",
      gradedByRole: "Admin",
    });
    expect(result.score).toBe(9);
  });
});

describe("gradeService.getGradesByClass — AUTHZ-05", () => {
  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue(makeClass());

    await expect(
      gradeService.getGradesByClass(CLASS_ID, OTHER_TEACHER_ID, "Teacher")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Giáo viên phụ trách lớp xem được bảng điểm", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue(makeClass());
    vi.spyOn(gradeService, "aggregateGradesMatrix").mockResolvedValue({
      gradeItems: [],
      students: [],
    });

    const result = await gradeService.getGradesByClass(CLASS_ID, OWNER_TEACHER_ID, "Teacher");
    expect(result).toEqual({ gradeItems: [], students: [] });
  });
});
