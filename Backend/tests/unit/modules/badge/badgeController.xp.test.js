// Test cho badge.controller.js#getMyXp — TÍNH NĂNG MỚI (mục 5).
import { describe, it, expect, vi, beforeEach } from "vitest";

const getLifetimeXpService = vi.fn();

vi.mock("#modules/badge/xp.service.js", () => ({
  getLifetimeXpService: (...a) => getLifetimeXpService(...a),
}));
vi.mock("#modules/badge/learningRanking.service.js", () => ({ default: {} }));
vi.mock("#modules/badge/gamification.service.js", () => ({ default: {} }));
vi.mock("#modules/badge/learningActivity.model.js", () => ({ default: {} }));
vi.mock("#modules/class", () => ({ Class: {} }));
vi.mock("#modules/classEnrollment", () => ({ ClassEnrollment: {} }));

const { getMyXp } = await import("#modules/badge/badge.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe("getMyXp", () => {
  it("Trả về totalXP/level của chính người gọi (lấy studentId từ req.user)", async () => {
    getLifetimeXpService.mockResolvedValue({
      totalXp: 120,
      level: 2,
      xpIntoLevel: 20,
      xpForNextLevel: 283,
    });
    const req = { user: { id: "student-1" } };
    const res = buildRes();

    await getMyXp(req, res);

    expect(getLifetimeXpService).toHaveBeenCalledWith("student-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { totalXp: 120, level: 2, xpIntoLevel: 20, xpForNextLevel: 283 },
      })
    );
  });

  it("Lỗi service -> trả 500 với thông báo lỗi", async () => {
    getLifetimeXpService.mockRejectedValue(new Error("DB down"));
    const req = { user: { id: "student-1" } };
    const res = buildRes();

    await getMyXp(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
