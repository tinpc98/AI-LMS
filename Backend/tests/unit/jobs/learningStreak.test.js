// Test cho learningStreak.job.js — TÍNH NĂNG MỚI (mục 5 "Learning Streak" + mục 4 "Bền bỉ").
import { describe, it, expect, vi, beforeEach } from "vitest";

const distinct = vi.fn();
const find = vi.fn();
const awardXpService = vi.fn();
const checkAndAwardPersistentBadge = vi.fn();

vi.mock("#modules/badge/learningActivity.model.js", () => ({
  default: { distinct: (...a) => distinct(...a), find: (...a) => find(...a) },
}));
vi.mock("#modules/badge/xp.service.js", () => ({ awardXpService: (...a) => awardXpService(...a) }));
vi.mock("#modules/badge/badgeAward.service.js", () => ({
  checkAndAwardPersistentBadge: (...a) => checkAndAwardPersistentBadge(...a),
}));

const { runLearningStreakCheck } = await import("#jobs/learningStreak.job.js");

const mongooseSortLean = (result) => ({
  select: () => ({ sort: () => ({ lean: () => Promise.resolve(result) }) }),
});

const NOW = new Date("2026-03-08T02:00:00.000Z"); // Job chạy đầu ngày 08/03 -> kiểm streak tới hết 07/03.

const activityAt = (dateStr, classId = "class-1") => ({ createdAt: new Date(dateStr), classId });

beforeEach(() => {
  vi.clearAllMocks();
  awardXpService.mockResolvedValue({ _id: "xp-1" });
  checkAndAwardPersistentBadge.mockResolvedValue(undefined);
});

describe("runLearningStreakCheck", () => {
  it("Không có ứng viên nào (không ai hoạt động gần đây) → checked=0, không query gì thêm", async () => {
    distinct.mockResolvedValue([]);

    const result = await runLearningStreakCheck(NOW);

    expect(result).toEqual({ checked: 0, awarded: 0, failed: 0 });
    expect(find).not.toHaveBeenCalled();
  });

  it("Đủ 7 ngày liên tục (01/03 -> 07/03) → cộng 50 XP Learning Streak + kiểm badge Bền bỉ", async () => {
    distinct.mockResolvedValue(["student-1"]);
    find.mockReturnValue(
      mongooseSortLean([
        activityAt("2026-03-07T10:00:00.000Z", "class-9"), // Gần nhất -> dùng classId này.
        activityAt("2026-03-06T10:00:00.000Z"),
        activityAt("2026-03-05T10:00:00.000Z"),
        activityAt("2026-03-04T10:00:00.000Z"),
        activityAt("2026-03-03T10:00:00.000Z"),
        activityAt("2026-03-02T10:00:00.000Z"),
        activityAt("2026-03-01T10:00:00.000Z"),
      ])
    );

    const result = await runLearningStreakCheck(NOW);

    expect(awardXpService).toHaveBeenCalledWith({
      studentId: "student-1",
      classId: "class-9",
      activityType: "Learning Streak",
      sourceRef: "streak:student-1:2026-03-07",
      xpAmount: 50,
    });
    expect(checkAndAwardPersistentBadge).toHaveBeenCalledWith("student-1");
    expect(result).toEqual({ checked: 1, awarded: 1, failed: 0 });
  });

  it("Thiếu 1 ngày trong chuỗi → không cộng gì, không kiểm badge", async () => {
    distinct.mockResolvedValue(["student-1"]);
    find.mockReturnValue(
      mongooseSortLean([
        activityAt("2026-03-07T10:00:00.000Z"),
        activityAt("2026-03-06T10:00:00.000Z"),
        // Thiếu 03-05
        activityAt("2026-03-04T10:00:00.000Z"),
        activityAt("2026-03-03T10:00:00.000Z"),
        activityAt("2026-03-02T10:00:00.000Z"),
        activityAt("2026-03-01T10:00:00.000Z"),
      ])
    );

    const result = await runLearningStreakCheck(NOW);

    expect(awardXpService).not.toHaveBeenCalled();
    expect(checkAndAwardPersistentBadge).not.toHaveBeenCalled();
    expect(result.awarded).toBe(0);
  });

  it("1 học sinh lỗi không chặn học sinh còn lại", async () => {
    distinct.mockResolvedValue(["student-bad", "student-good"]);
    find
      .mockReturnValueOnce({
        select: () => ({ sort: () => ({ lean: () => Promise.reject(new Error("DB lỗi")) }) }),
      })
      .mockReturnValueOnce(
        mongooseSortLean(
          [
            "2026-03-07",
            "2026-03-06",
            "2026-03-05",
            "2026-03-04",
            "2026-03-03",
            "2026-03-02",
            "2026-03-01",
          ].map((d) => activityAt(`${d}T10:00:00.000Z`))
        )
      );

    const result = await runLearningStreakCheck(NOW);

    expect(result).toEqual({ checked: 2, awarded: 1, failed: 1 });
    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "student-good" })
    );
  });
});
