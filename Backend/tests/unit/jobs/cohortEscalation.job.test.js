// Test cho cohortEscalation.job.js — EduSpace mechanism design Phần B.1 (BR-13, Mức 1 tự động).
import { describe, it, expect, vi, beforeEach } from "vitest";

const findOverdueSessions = vi.fn();
const escalateLevel1 = vi.fn();

vi.mock("#modules/class", () => ({
  findOverdueSessions: (...a) => findOverdueSessions(...a),
  escalateLevel1: (...a) => escalateLevel1(...a),
}));

const { runCohortEscalationLevel1 } = await import("#jobs/cohortEscalation.job.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runCohortEscalationLevel1", () => {
  it("Không có buổi quá giờ → không gọi escalateLevel1, trả về 0 hết", async () => {
    findOverdueSessions.mockResolvedValue([]);

    const result = await runCohortEscalationLevel1();

    expect(result).toEqual({ checked: 0, resolved: 0, needsAdminAttention: 0 });
    expect(escalateLevel1).not.toHaveBeenCalled();
  });

  it("Tất cả buổi đều kích hoạt dự bị thành công → resolved = checked, needsAdminAttention = 0", async () => {
    findOverdueSessions.mockResolvedValue([{ _id: "s1" }, { _id: "s2" }]);
    escalateLevel1.mockResolvedValue({ resolved: true, reason: "BACKUP_ACTIVATED" });

    const result = await runCohortEscalationLevel1();

    expect(result.checked).toBe(2);
    expect(result.resolved).toBe(2);
    expect(result.needsAdminAttention).toBe(0);
  });

  it("Một buổi không có dự bị → đưa vào needsAdminAttentionDetails kèm lý do, KHÔNG chặn các buổi còn lại", async () => {
    findOverdueSessions.mockResolvedValue([{ _id: "s1" }, { _id: "s2" }]);
    escalateLevel1.mockImplementation((sessionId) => {
      if (sessionId === "s1")
        return Promise.resolve({ resolved: true, reason: "BACKUP_ACTIVATED" });
      return Promise.resolve({ resolved: false, reason: "NO_BACKUP_AVAILABLE" });
    });

    const result = await runCohortEscalationLevel1();

    expect(result.resolved).toBe(1);
    expect(result.needsAdminAttention).toBe(1);
    expect(result.needsAdminAttentionDetails).toEqual([
      { sessionId: "s2", reason: "NO_BACKUP_AVAILABLE" },
    ]);
  });

  it("escalateLevel1 ném lỗi cho MỘT buổi → không chặn các buổi còn lại, ghi nhận reason=ESCALATION_ERROR", async () => {
    findOverdueSessions.mockResolvedValue([{ _id: "s1" }, { _id: "s2" }]);
    escalateLevel1.mockImplementation((sessionId) => {
      if (sessionId === "s1") throw new Error("lỗi giả lập");
      return Promise.resolve({ resolved: true, reason: "BACKUP_ACTIVATED" });
    });

    const result = await runCohortEscalationLevel1();

    expect(result.resolved).toBe(1);
    expect(result.needsAdminAttention).toBe(1);
    expect(result.needsAdminAttentionDetails[0]).toEqual({
      sessionId: "s1",
      reason: "ESCALATION_ERROR",
    });
  });

  it("Truyền đúng tham số `now` xuống findOverdueSessions", async () => {
    const now = new Date("2026-08-01T10:00:00Z");
    findOverdueSessions.mockResolvedValue([]);

    await runCohortEscalationLevel1(now);

    expect(findOverdueSessions).toHaveBeenCalledWith(now);
  });
});
