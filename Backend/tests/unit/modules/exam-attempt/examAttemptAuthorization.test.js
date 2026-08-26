// Test cho fix AUTHZ-02: chặn giáo viên chấm bài thi của lớp không phụ trách.
//
// Cập nhật: gradeEssay không còn là hàm service gọi trực tiếp (attemptId, grades, userId, role)
// — nó đã chuyển hẳn thành controller Express (req, res) trong examAttempt.controller.js, đọc
// quyền qua checkClassTeacherOwnership dùng chung từ #modules/class (không tự query Class.findById
// nữa). Cấu trúc attempt.questions cũng đổi: {questionId, questionSnapshot:{type}, points, score,
// isCorrect} thay vì {questionId, pointsEarned} phẳng.
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { gradeEssay } from "../../../../src/modules/exam-attempt/examAttempt.controller.js";
import ExamAttempt from "../../../../src/modules/exam-attempt/examAttempt.model.js";
import Exam from "../../../../src/modules/exam/exam.model.js";
import { checkClassTeacherOwnership } from "#modules/class";

vi.mock("#modules/class", () => ({
  checkClassTeacherOwnership: vi.fn(),
}));
vi.mock("#modules/performance", () => ({
  processAttemptPerformanceService: vi.fn().mockResolvedValue({}),
}));

const OWNER_TEACHER_ID = "507f1f77bcf86cd799439011";
const OTHER_TEACHER_ID = "507f1f77bcf86cd799439099";
const CLASS_ID = "607f1f77bcf86cd799439111";
const EXAM_ID = "707f1f77bcf86cd799439222";

const makeAttempt = () => ({
  _id: "attempt-1",
  examId: EXAM_ID,
  status: "SUBMITTED",
  performanceProcessedAt: null,
  questions: [
    { questionId: "q1", questionSnapshot: { type: "ESSAY" }, points: 5, score: 0, isCorrect: null },
  ],
  save: vi.fn().mockResolvedValue(true),
});

const makeReqRes = (userId, role, essayGrades = [{ questionId: "q1", pointsEarned: 5 }]) => {
  const req = {
    params: { attemptId: "attempt-1" },
    user: { id: userId, role },
    body: { essayGrades },
  };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return { req, res };
};

beforeEach(() => {
  checkClassTeacherOwnership.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("examAttemptController.gradeEssay — AUTHZ-02", () => {
  it("Giáo viên không phụ trách lớp bị chặn 403, không lưu điểm", async () => {
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    checkClassTeacherOwnership.mockResolvedValue(false);

    const { req, res } = makeReqRes(OTHER_TEACHER_ID, "Teacher");
    await gradeEssay(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(attempt.save).not.toHaveBeenCalled();
  });

  it("Giáo viên phụ trách lớp chấm điểm thành công", async () => {
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    checkClassTeacherOwnership.mockResolvedValue(true);

    const { req, res } = makeReqRes(OWNER_TEACHER_ID, "Teacher");
    await gradeEssay(req, res, vi.fn());

    expect(attempt.save).toHaveBeenCalled();
    expect(attempt.status).toBe("GRADED");
    expect(attempt.score).toBe(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("Admin chấm điểm bài thi bất kỳ lớp nào cũng được", async () => {
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    // Admin bỏ qua checkClassTeacherOwnership hoàn toàn (checkTeacherExamAccess short-circuit) —
    // không cần mock trả true, chỉ cần đảm bảo nó KHÔNG bị gọi.

    const { req, res } = makeReqRes("admin-id", "Admin");
    await gradeEssay(req, res, vi.fn());

    expect(checkClassTeacherOwnership).not.toHaveBeenCalled();
    expect(attempt.save).toHaveBeenCalled();
    expect(attempt.status).toBe("GRADED");
  });
});
