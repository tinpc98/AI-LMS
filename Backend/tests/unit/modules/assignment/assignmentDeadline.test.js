// Test cho TÍNH NĂNG MỚI: deadline thật cho Assignment, mirror đúng Exam (duration + startAt/
// endAt trên Assignment, expiresAt trên AssignmentAttempt, chặn lưu/nộp quá hạn, cron auto-submit).
// Trước đây Assignment hoàn toàn không có cách nào tính hạn nộp.
import { describe, it, expect, vi, beforeEach } from "vitest";

const findAssignmentById = vi.fn();
const findInProgressAttempt = vi.fn();
const countAttempts = vi.fn();
const createAttempt = vi.fn();
const findAttemptById = vi.fn();

vi.mock("#modules/assignment/assignment.repository.js", () => ({
  findAssignmentById: (...a) => findAssignmentById(...a),
  findInProgressAttempt: (...a) => findInProgressAttempt(...a),
  countAttempts: (...a) => countAttempts(...a),
  createAttempt: (...a) => createAttempt(...a),
  findAttemptById: (...a) => findAttemptById(...a),
}));
vi.mock("#modules/assignment/assignmentAttempt.model.js", () => ({ default: {} }));
// TÍNH NĂNG MỚI (mục 5): _gradeAttempt giờ cố cộng XP sau khi chấm — Assignment.findById trả về
// null khiến resolveClassIdForAssignment dừng sớm (không tìm được courseId), nên không cần mock
// Topic/badge sâu hơn ở đây (các test trong file này không quan tâm tới việc cộng XP).
vi.mock("#modules/assignment/assignment.model.js", () => ({
  default: { findById: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }) },
}));

const { startAttemptService, saveAnswerService, submitAttemptService, gradeSubmission } =
  await import("#modules/assignment/assignment.service.js");

const baseAssignment = (over = {}) => ({
  _id: "assign-1",
  status: "PUBLISHED",
  duration: 30,
  startAt: null,
  endAt: null,
  questions: [],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  findInProgressAttempt.mockResolvedValue(null);
  countAttempts.mockResolvedValue(0);
});

describe("startAttemptService — khung thời gian mở/đóng + tính expiresAt", () => {
  it("Assignment chưa tới startAt → chặn bắt đầu làm bài", async () => {
    findAssignmentById.mockResolvedValue(
      baseAssignment({ startAt: new Date(Date.now() + 60 * 60 * 1000) })
    );

    await expect(startAttemptService("assign-1", "student-1")).rejects.toMatchObject({
      code: "ASSIGNMENT_NOT_STARTED",
    });
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("Assignment đã qua endAt → chặn bắt đầu làm bài", async () => {
    findAssignmentById.mockResolvedValue(
      baseAssignment({ endAt: new Date(Date.now() - 60 * 60 * 1000) })
    );

    await expect(startAttemptService("assign-1", "student-1")).rejects.toThrow(/đã đóng/);
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("Trong khung thời gian hợp lệ → tạo attempt với expiresAt = now + duration*60000", async () => {
    findAssignmentById.mockResolvedValue(baseAssignment({ duration: 30 }));
    const saveFn = vi.fn().mockResolvedValue(true);
    createAttempt.mockImplementation((data) => ({ ...data, save: saveFn }));

    const before = Date.now();
    const attempt = await startAttemptService("assign-1", "student-1");
    const after = Date.now();

    expect(saveFn).toHaveBeenCalled();
    const expectedMin = before + 30 * 60000;
    const expectedMax = after + 30 * 60000;
    expect(attempt.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(attempt.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
  });
});

describe("saveAnswerService — chặn lưu câu trả lời sau khi hết hạn", () => {
  it("Đã quá expiresAt → ném lỗi, không lưu", async () => {
    findAttemptById.mockResolvedValue({
      studentId: { toString: () => "student-1" },
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() - 1000),
      questions: [{ questionId: { toString: () => "q1" } }],
      save: vi.fn(),
    });

    await expect(
      saveAnswerService("attempt-1", "q1", "student-1", { selectedOptionIds: ["a"] })
    ).rejects.toThrow(/expired/);
  });

  it("Còn hạn → lưu bình thường", async () => {
    const saveFn = vi.fn().mockResolvedValue(true);
    const aq = { questionId: { toString: () => "q1" }, answer: null };
    findAttemptById.mockResolvedValue({
      studentId: { toString: () => "student-1" },
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() + 60000),
      questions: [aq],
      save: saveFn,
    });

    await saveAnswerService("attempt-1", "q1", "student-1", { selectedOptionIds: ["a"] });
    expect(saveFn).toHaveBeenCalled();
    expect(aq.answer).toEqual({ selectedOptionIds: ["a"] });
  });
});

describe("nộp muộn được ghi nhận (isLate/lateBySeconds), không bị chặn nộp", () => {
  it("Nộp trong hạn → isLate=false", async () => {
    findAttemptById.mockResolvedValue({
      studentId: { toString: () => "student-1" },
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() + 60000),
      questions: [],
      save: vi.fn().mockResolvedValue(true),
    });

    const attempt = await submitAttemptService("attempt-1", "student-1");
    expect(attempt.isLate).toBe(false);
    expect(attempt.lateBySeconds).toBe(0);
  });

  it("Nộp muộn quá GRACE_PERIOD (2 phút) → isLate=true, ghi số giây muộn, VẪN chấm điểm bình thường", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    findAttemptById.mockResolvedValue({
      studentId: { toString: () => "student-1" },
      status: "IN_PROGRESS",
      expiresAt: tenMinutesAgo,
      questions: [],
      save: vi.fn().mockResolvedValue(true),
    });

    const attempt = await submitAttemptService("attempt-1", "student-1");
    expect(attempt.isLate).toBe(true);
    expect(attempt.lateBySeconds).toBeGreaterThan(0);
    expect(attempt.status).toBe("GRADED"); // Không có câu ESSAY nào → vẫn chấm xong ngay
  });
});

describe("gradeSubmission — nộp hệ thống dùng bởi cron auto-submit, không kiểm quyền học sinh", () => {
  it("Attempt IN_PROGRESS quá hạn → chấm và chuyển trạng thái như nộp bình thường", async () => {
    findAttemptById.mockResolvedValue({
      studentId: { toString: () => "student-1" },
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() - 5 * 60 * 1000),
      questions: [],
      save: vi.fn().mockResolvedValue(true),
    });

    const attempt = await gradeSubmission("attempt-1");
    expect(attempt.status).toBe("GRADED");
    expect(attempt.isLate).toBe(true);
  });

  it("Attempt đã nộp rồi (không còn IN_PROGRESS) → no-op, không chấm lại", async () => {
    const existing = { status: "GRADED", save: vi.fn() };
    findAttemptById.mockResolvedValue(existing);

    const result = await gradeSubmission("attempt-1");
    expect(result).toBe(existing);
    expect(existing.save).not.toHaveBeenCalled();
  });
});
