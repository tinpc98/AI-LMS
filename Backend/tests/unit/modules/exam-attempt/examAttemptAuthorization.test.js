// Test cho fix AUTHZ-02: chặn giáo viên chấm bài thi của lớp không phụ trách.
//
// Cập nhật: gradeEssay không còn là hàm service gọi trực tiếp (attemptId, grades, userId, role)
// — nó đã chuyển hẳn thành controller Express (req, res) trong examAttempt.controller.js, đọc
// quyền qua checkClassTeacherOwnership dùng chung từ #modules/class (không tự query Class.findById
// nữa). Cấu trúc attempt.questions cũng đổi: {questionId, questionSnapshot:{type}, points, score,
// isCorrect} thay vì {questionId, pointsEarned} phẳng.
//
// Cập nhật lần 2 (BUG ĐÃ SỬA — race condition chấm điểm đồng thời): gradeEssay không còn đọc rồi
// attempt.save() nữa — giờ dùng ExamAttempt.findOneAndUpdate với optimistic lock trên __v, retry
// nếu bị chen. Mock ExamAttempt.findOneAndUpdate thay cho attempt.save().
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
  __v: 0,
  questions: [
    { questionId: "q1", questionSnapshot: { type: "ESSAY" }, points: 5, score: 0, isCorrect: null },
  ],
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
  // Nhánh trigger Performance Engine gọi ExamAttempt.findByIdAndUpdate — Mongoose triển khai
  // findByIdAndUpdate bằng cách gọi NỘI BỘ chính findOneAndUpdate trên cùng Model, nên nếu không
  // mock riêng, lời gọi này sẽ lẫn vào đếm số lần gọi findOneAndUpdate của test (và rơi xuống
  // implementation thật gây CastError vì id giả không phải ObjectId hợp lệ).
  vi.spyOn(ExamAttempt, "findByIdAndUpdate").mockResolvedValue({});
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
    const findOneAndUpdateSpy = vi.spyOn(ExamAttempt, "findOneAndUpdate");
    checkClassTeacherOwnership.mockResolvedValue(false);

    const { req, res } = makeReqRes(OTHER_TEACHER_ID, "Teacher");
    await gradeEssay(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(findOneAndUpdateSpy).not.toHaveBeenCalled();
  });

  it("Giáo viên phụ trách lớp chấm điểm thành công", async () => {
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    checkClassTeacherOwnership.mockResolvedValue(true);
    const updatedAttempt = { ...attempt, status: "GRADED", score: 5, __v: 1 };
    const findOneAndUpdateSpy = vi
      .spyOn(ExamAttempt, "findOneAndUpdate")
      .mockResolvedValue(updatedAttempt);

    const { req, res } = makeReqRes(OWNER_TEACHER_ID, "Teacher");
    await gradeEssay(req, res, vi.fn());

    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      { _id: "attempt-1", __v: 0 },
      expect.objectContaining({
        $set: expect.objectContaining({ "questions.0.score": 5, score: 5, status: "GRADED" }),
        $inc: { __v: 1 },
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: updatedAttempt })
    );
  });

  it("Admin chấm điểm bài thi bất kỳ lớp nào cũng được", async () => {
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    // Admin bỏ qua checkClassTeacherOwnership hoàn toàn (checkTeacherExamAccess short-circuit) —
    // không cần mock trả true, chỉ cần đảm bảo nó KHÔNG bị gọi.
    const updatedAttempt = { ...attempt, status: "GRADED", score: 5, __v: 1 };
    vi.spyOn(ExamAttempt, "findOneAndUpdate").mockResolvedValue(updatedAttempt);

    const { req, res } = makeReqRes("admin-id", "Admin");
    await gradeEssay(req, res, vi.fn());

    expect(checkClassTeacherOwnership).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("BUG ĐÃ SỬA — 1 giáo viên khác vừa ghi trước (__v lệch) → đọc lại và thử lại, không mất điểm", async () => {
    const attempt = makeAttempt();
    const findByIdSpy = vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    checkClassTeacherOwnership.mockResolvedValue(true);
    const updatedAttempt = { ...attempt, status: "GRADED", score: 5, __v: 1 };
    const findOneAndUpdateSpy = vi
      .spyOn(ExamAttempt, "findOneAndUpdate")
      .mockResolvedValueOnce(null) // Lần 1: version mismatch (ai đó vừa ghi)
      .mockResolvedValueOnce(updatedAttempt); // Lần 2: thử lại thành công

    const { req, res } = makeReqRes(OWNER_TEACHER_ID, "Teacher");
    await gradeEssay(req, res, vi.fn());

    expect(findByIdSpy).toHaveBeenCalledTimes(2); // Đọc lại sau lần thất bại đầu
    expect(findOneAndUpdateSpy).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("Xung đột liên tục vượt quá số lần thử lại → trả 409 thay vì mất điểm âm thầm", async () => {
    const attempt = makeAttempt();
    vi.spyOn(ExamAttempt, "findById").mockResolvedValue(attempt);
    vi.spyOn(Exam, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ classId: CLASS_ID }) }),
    });
    checkClassTeacherOwnership.mockResolvedValue(true);
    vi.spyOn(ExamAttempt, "findOneAndUpdate").mockResolvedValue(null); // Luôn mismatch

    const { req, res } = makeReqRes(OWNER_TEACHER_ID, "Teacher");
    await gradeEssay(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
