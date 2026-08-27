// Chốt job tự động nộp bài Assignment khi hết giờ — mirror đúng examAttemptAutoSubmit.test.js
// (TÍNH NĂNG MỚI: Assignment trước đây hoàn toàn không có deadline).
//
// Đây là job có hậu quả nặng nhất trong tính năng: nó CHỐT ĐIỂM của học sinh mà không ai bấm
// nút. Sai ở đây nghĩa là nộp sớm bài đang làm, hoặc chấm rỗng bài đã làm xong.
import { describe, it, expect, vi, beforeEach } from "vitest";

const find = vi.fn();
const gradeSubmission = vi.fn();

const mongooseQuery = (result) => ({
  select: () => ({ lean: async () => result }),
});

vi.mock("#modules/assignment/assignmentAttempt.model.js", () => ({
  default: { find: (...a) => find(...a) },
}));
vi.mock("#modules/assignment/assignment.service.js", () => ({
  gradeSubmission: (...a) => gradeSubmission(...a),
}));

const { runAssignmentAttemptAutoSubmit, findOverdueAttempts } =
  await import("#jobs/assignmentAttemptAutoSubmit.job.js");

const MOC = new Date("2026-08-01T10:00:00Z");
const GRACE_PERIOD_MS = 2 * 60 * 1000;

beforeEach(() => {
  find.mockReset().mockReturnValue(mongooseQuery([]));
  gradeSubmission.mockReset().mockResolvedValue({});
});

describe("findOverdueAttempts — điều kiện lọc", () => {
  it("chỉ lấy phiên đang IN_PROGRESS", async () => {
    await findOverdueAttempts(MOC);
    expect(find.mock.calls[0][0]).toMatchObject({ status: "IN_PROGRESS" });
  });

  it("CỘNG ÂN HẠN vào hạn nộp trước khi so sánh", async () => {
    await findOverdueAttempts(MOC);
    const filter = find.mock.calls[0][0];
    const expectedCutoff = new Date(MOC.getTime() - GRACE_PERIOD_MS);
    expect(filter.expiresAt.$lt.getTime()).toBe(expectedCutoff.getTime());
  });

  it("mặc định so với thời điểm hiện tại nếu không truyền", async () => {
    const before = Date.now();
    await findOverdueAttempts();
    const after = Date.now();

    const cutoffMs = find.mock.calls[0][0].expiresAt.$lt.getTime();
    expect(cutoffMs).toBeGreaterThanOrEqual(before - GRACE_PERIOD_MS);
    expect(cutoffMs).toBeLessThanOrEqual(after - GRACE_PERIOD_MS);
  });
});

describe("runAssignmentAttemptAutoSubmit", () => {
  it("không có phiên quá hạn thì KHÔNG gọi chấm điểm", async () => {
    await expect(runAssignmentAttemptAutoSubmit(MOC)).resolves.toEqual({
      submitted: 0,
      failed: 0,
    });
    expect(gradeSubmission).not.toHaveBeenCalled();
  });

  it("chấm bài theo ĐÚNG những gì đã lưu lên máy chủ, chỉ truyền attemptId", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "a1" }]));
    await runAssignmentAttemptAutoSubmit(MOC);
    expect(gradeSubmission).toHaveBeenCalledWith("a1");
  });

  it("MỘT phiên hỏng không chặn các phiên còn lại", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "a1" }, { _id: "a2" }, { _id: "a3" }]));
    gradeSubmission.mockImplementation(async (id) => {
      if (id === "a2") throw new Error("lỗi ghi DB");
      return {};
    });

    const kq = await runAssignmentAttemptAutoSubmit(MOC);

    expect(kq).toEqual({ submitted: 2, failed: 1 });
    expect(gradeSubmission).toHaveBeenCalledTimes(3);
  });

  it("đếm đúng số phiên đã nộp", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "a1" }, { _id: "a2" }]));
    await expect(runAssignmentAttemptAutoSubmit(MOC)).resolves.toEqual({
      submitted: 2,
      failed: 0,
    });
  });
});
