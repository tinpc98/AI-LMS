// Test cho fix AUTHZ-02: chặn giáo viên chấm bài thi của lớp không phụ trách.
import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import examAttemptService from "../../../../src/modules/exam-attempt/examAttempt.service.js";
import { ExamAttempt } from "#modules/exam-attempt";
import { Class as classModel } from "#modules/class";

const OWNER_TEACHER_ID = "507f1f77bcf86cd799439011";
const OTHER_TEACHER_ID = "507f1f77bcf86cd799439099";
const CLASS_ID = "607f1f77bcf86cd799439111";

const makeAttempt = () => {
  const attempt = {
    _id: "attempt-1",
    answers: [{ questionId: "q1", pointsEarned: 0 }],
    examId: { classId: CLASS_ID, questions: [{ questionId: "q1", points: 5 }] },
    save: vi.fn().mockResolvedValue(true),
  };
  return attempt;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("examAttemptService.gradeEssay — AUTHZ-02", () => {
  it("Giáo viên không phụ trách lớp bị chặn 403, không lưu điểm", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue({
      startTransaction: vi.fn(),
      abortTransaction: vi.fn().mockResolvedValue(true),
      commitTransaction: vi.fn().mockResolvedValue(true),
      endSession: vi.fn(),
    });
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockReturnValue({
      populate: () => ({ session: () => Promise.resolve(attempt) }),
    });
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OWNER_TEACHER_ID,
    });

    await expect(
      examAttemptService.gradeEssay(
        "attempt-1",
        [{ questionId: "q1", pointsEarned: 5 }],
        OTHER_TEACHER_ID,
        "Teacher"
      )
    ).rejects.toMatchObject({ status: 403 });

    expect(attempt.save).not.toHaveBeenCalled();
  });

  it("Giáo viên phụ trách lớp chấm điểm thành công", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue({
      startTransaction: vi.fn(),
      abortTransaction: vi.fn().mockResolvedValue(true),
      commitTransaction: vi.fn().mockResolvedValue(true),
      endSession: vi.fn(),
    });
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockReturnValue({
      populate: () => ({ session: () => Promise.resolve(attempt) }),
    });
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OWNER_TEACHER_ID,
    });

    const result = await examAttemptService.gradeEssay(
      "attempt-1",
      [{ questionId: "q1", pointsEarned: 5 }],
      OWNER_TEACHER_ID,
      "Teacher"
    );

    expect(attempt.save).toHaveBeenCalled();
    expect(result.status).toBe("GRADED");
    expect(result.totalScore).toBe(5);
  });

  it("Admin chấm điểm bài thi bất kỳ lớp nào cũng được", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue({
      startTransaction: vi.fn(),
      abortTransaction: vi.fn().mockResolvedValue(true),
      commitTransaction: vi.fn().mockResolvedValue(true),
      endSession: vi.fn(),
    });
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockReturnValue({
      populate: () => ({ session: () => Promise.resolve(attempt) }),
    });

    const result = await examAttemptService.gradeEssay(
      "attempt-1",
      [{ questionId: "q1", pointsEarned: 5 }],
      "admin-id",
      "Admin"
    );

    expect(attempt.save).toHaveBeenCalled();
    expect(result.status).toBe("GRADED");
  });
});
