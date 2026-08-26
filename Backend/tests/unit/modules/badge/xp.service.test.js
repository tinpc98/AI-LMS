// Test cho xp.service.js — TÍNH NĂNG MỚI (mục 5): cộng XP đúng 1 lần/sourceRef, áp trần/ngày.
import { describe, it, expect, vi, beforeEach } from "vitest";

const aggregate = vi.fn();
const create = vi.fn();

vi.mock("#modules/badge/learningActivity.model.js", () => ({
  default: { aggregate: (...a) => aggregate(...a), create: (...a) => create(...a) },
}));

const { awardXpService, getLifetimeXpService } = await import("#modules/badge/xp.service.js");

const STUDENT_ID = "507f1f77bcf86cd799439011";
const CLASS_ID = "507f1f77bcf86cd799439012";

beforeEach(() => {
  vi.clearAllMocks();
  aggregate.mockResolvedValue([]); // Mặc định: chưa cộng XP nào hôm nay.
});

describe("awardXpService", () => {
  it("Chưa cộng gì hôm nay → cộng đủ mức danh nghĩa", async () => {
    create.mockResolvedValue({ _id: "a1", xpAwarded: 20 });

    await awardXpService({
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      activityType: "Lesson Completed",
      sourceRef: "lesson:l1",
      xpAmount: 20,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        xpAwarded: 20,
        sourceRef: "lesson:l1",
        activityType: "Lesson Completed",
      })
    );
  });

  it("Đã gần chạm trần/ngày → chỉ cộng phần còn lại", async () => {
    aggregate.mockResolvedValue([{ total: 290 }]);
    create.mockResolvedValue({ _id: "a2", xpAwarded: 10 });

    await awardXpService({
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      activityType: "Lesson Completed",
      sourceRef: "lesson:l2",
      xpAmount: 20,
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ xpAwarded: 10 }));
  });

  it("sourceRef trùng (lỗi 11000 từ unique index) → trả về null, KHÔNG throw", async () => {
    const dupError = new Error("E11000 duplicate key");
    dupError.code = 11000;
    create.mockRejectedValue(dupError);

    const result = await awardXpService({
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      activityType: "Lesson Completed",
      sourceRef: "lesson:l1",
      xpAmount: 20,
    });

    expect(result).toBeNull();
  });

  it("Lỗi khác (không phải trùng key) → ném lại lỗi", async () => {
    create.mockRejectedValue(new Error("DB down"));

    await expect(
      awardXpService({
        studentId: STUDENT_ID,
        classId: CLASS_ID,
        activityType: "Lesson Completed",
        sourceRef: "lesson:l1",
        xpAmount: 20,
      })
    ).rejects.toThrow("DB down");
  });
});

describe("getLifetimeXpService", () => {
  it("Chưa có XP nào → totalXp=0, Level 1", async () => {
    aggregate.mockResolvedValue([]);
    const result = await getLifetimeXpService(STUDENT_ID);
    expect(result.totalXp).toBe(0);
    expect(result.level).toBe(1);
  });

  it("Tổng XP từ aggregate → tính đúng level", async () => {
    aggregate.mockResolvedValue([{ total: 100 }]);
    const result = await getLifetimeXpService(STUDENT_ID);
    expect(result.totalXp).toBe(100);
    expect(result.level).toBe(2);
  });
});
